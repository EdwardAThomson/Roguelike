// The Web Audio engine: a synth for the sound-effect presets and a small
// step sequencer for the music, both built from oscillators and filtered
// noise so the game ships no audio files.
//
// Signal path:  voices -> sfx bus  \
//               tracks -> music bus -> master -> speakers
//                         (+ echo send on the music bus)
//
// Browsers only allow audio after a user gesture, so the AudioContext is
// created on the first key press or click (installUnlock). Everything is a
// safe no-op where Web Audio does not exist (node tests, old browsers).

import { SFX, sfxDuration } from './sfxPresets.js';
import { compileTrack } from './musicTracks.js';
import { loadAudioSettings, saveAudioSettings, normalizeAudioSettings, busGain } from './audioSettings.js';

const LOOKAHEAD_S = 0.15;   // how far ahead the sequencer schedules notes
const TICK_MS = 30;         // how often it wakes up to do so
const CROSSFADE_S = 0.9;    // music change fade
const SFX_REPEAT_S = 0.045; // the same effect never stacks closer than this
const MAX_SFX_VOICES = 24;  // cap on overlapping effect voices

function audioContextClass() {
    return globalThis.AudioContext || globalThis.webkitAudioContext || null;
}

export class AudioEngine {
    constructor(options = {}) {
        this.storage = options.storage;
        this.settings = loadAudioSettings(this.storage);
        this.ctx = null;
        this.tracks = [];         // playing tracks (the newest is current)
        this.musicName = null;    // the tune that should be playing
        this.lastPlayed = new Map();
        this.liveVoices = 0;
        this.timer = null;
        this.unlockInstalled = false;
    }

    get available() {
        return !!audioContextClass();
    }

    get started() {
        return !!this.ctx;
    }

    // Start audio on the first gesture. Safe to call more than once.
    installUnlock(target = globalThis.window) {
        if (this.unlockInstalled || !target || !target.addEventListener) return;
        this.unlockInstalled = true;
        const unlock = () => {
            this.unlock();
            if (this.ctx && this.ctx.state === 'running') {
                target.removeEventListener('keydown', unlock, true);
                target.removeEventListener('pointerdown', unlock, true);
            }
        };
        target.addEventListener('keydown', unlock, true);
        target.addEventListener('pointerdown', unlock, true);

        // Pause the music while the tab is hidden (timers are throttled
        // there, which would make the sequencer stutter).
        const doc = globalThis.document;
        if (doc && doc.addEventListener) {
            doc.addEventListener('visibilitychange', () => {
                if (!this.ctx) return;
                if (doc.hidden) this.ctx.suspend();
                else this.ctx.resume();
            });
        }
    }

    unlock() {
        const Ctx = audioContextClass();
        if (!Ctx) return false;
        if (!this.ctx) {
            try {
                this.ctx = new Ctx();
            } catch (e) {
                console.warn('⚠️ Audio unavailable:', e);
                return false;
            }
            this.buildGraph();
            console.log('🔊 Audio started');
            if (this.musicName) {
                const name = this.musicName;
                this.musicName = null;
                this.playMusic(name);
            }
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return true;
    }

    buildGraph() {
        const ctx = this.ctx;
        this.master = ctx.createGain();
        this.master.connect(ctx.destination);
        this.musicBus = ctx.createGain();
        this.musicBus.connect(this.master);
        this.sfxBus = ctx.createGain();
        this.sfxBus.connect(this.master);

        // Echo for the cave and crypt melodies.
        this.echoIn = ctx.createGain();
        this.echoIn.gain.value = 0.32;
        const delay = ctx.createDelay(1);
        delay.delayTime.value = 0.32;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.38;
        const tone = ctx.createBiquadFilter();
        tone.type = 'lowpass';
        tone.frequency.value = 2400;
        this.echoIn.connect(delay);
        delay.connect(tone);
        tone.connect(feedback);
        feedback.connect(delay);
        tone.connect(this.musicBus);

        // Narrow pulse waves give the chiptune square its character.
        this.waves = {
            pulse25: this.pulseWave(0.25),
            pulse12: this.pulseWave(0.125)
        };

        // One second of white noise, reused by every noisy voice.
        const length = ctx.sampleRate;
        this.noise = ctx.createBuffer(1, length, ctx.sampleRate);
        const data = this.noise.getChannelData(0);
        for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

        this.applySettings(true);
    }

    pulseWave(duty) {
        const n = 32;
        const real = new Float32Array(n);
        const imag = new Float32Array(n);
        for (let k = 1; k < n; k++) {
            real[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty) * Math.cos(k * Math.PI * duty);
            imag[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * duty) * Math.sin(k * Math.PI * duty);
        }
        return this.ctx.createPeriodicWave(real, imag);
    }

    // ---- Settings -------------------------------------------------------

    getSettings() {
        return { ...this.settings };
    }

    setSettings(partial) {
        this.settings = saveAudioSettings({ ...this.settings, ...partial }, this.storage);
        this.applySettings();
        return this.getSettings();
    }

    toggleMute() {
        return this.setSettings({ muted: !this.settings.muted }).muted;
    }

    applySettings(immediate = false) {
        if (!this.ctx) return;
        const s = normalizeAudioSettings(this.settings);
        const set = (param, value) => {
            if (immediate) param.value = value;
            else param.setTargetAtTime(value, this.ctx.currentTime, 0.03);
        };
        set(this.master.gain, busGain(s, 'master'));
        set(this.musicBus.gain, s.music);
        set(this.sfxBus.gain, s.sfx);
    }

    // ---- Voices ---------------------------------------------------------

    // Schedule one synth voice. `shape` is 'hit' (fast decay, used by the
    // effects) or 'note' (held, then released, used by the music).
    voice(v, when, output, { shape = 'hit', dur = v.dur, freq = v.freq } = {}) {
        const ctx = this.ctx;
        const end = when + dur;
        const gain = ctx.createGain();
        gain.connect(output);
        const peak = Math.max(0.0001, v.vol);
        gain.gain.setValueAtTime(0.0001, when);
        gain.gain.exponentialRampToValueAtTime(peak, when + 0.005);
        if (shape === 'note') {
            const release = Math.min(0.06, dur * 0.4);
            gain.gain.setTargetAtTime(peak * 0.7, when + 0.02, dur * 0.4);
            gain.gain.setTargetAtTime(0.0001, end - release, release / 3);
        } else {
            gain.gain.exponentialRampToValueAtTime(0.0001, end);
        }

        let source;
        let tail = gain;
        if (v.wave === 'noise') {
            source = ctx.createBufferSource();
            source.buffer = this.noise;
            source.loop = true;
            const filter = ctx.createBiquadFilter();
            filter.type = v.filter || 'lowpass';
            filter.frequency.setValueAtTime(freq, when);
            if (v.to) filter.frequency.exponentialRampToValueAtTime(v.to, end);
            source.connect(filter);
            filter.connect(gain);
            tail = filter;
        } else {
            source = ctx.createOscillator();
            if (this.waves[v.wave]) source.setPeriodicWave(this.waves[v.wave]);
            else source.type = v.wave || 'square';
            source.frequency.setValueAtTime(freq, when);
            if (v.to) source.frequency.exponentialRampToValueAtTime(v.to, end);
            source.connect(gain);
        }
        source.start(when);
        source.stop(end + 0.05);
        source.onended = () => {
            source.disconnect();
            if (tail !== gain) tail.disconnect();
            gain.disconnect();
        };
        return gain;
    }

    // ---- Sound effects --------------------------------------------------

    play(name) {
        if (!this.ctx || this.settings.muted) return false;
        const voices = SFX[name];
        if (!voices) return false;
        const now = this.ctx.currentTime;
        if (now - (this.lastPlayed.get(name) ?? -1) < SFX_REPEAT_S) return false;
        if (this.liveVoices + voices.length > MAX_SFX_VOICES) return false;
        this.lastPlayed.set(name, now);

        const start = now + 0.005;
        for (const v of voices) this.voice(v, start + (v.delay || 0), this.sfxBus);
        this.liveVoices += voices.length;
        setTimeout(() => { this.liveVoices -= voices.length; }, (sfxDuration(voices) + 0.1) * 1000);
        return true;
    }

    // ---- Music ----------------------------------------------------------

    playMusic(name) {
        if (name === this.musicName) return;
        this.musicName = name;
        if (!this.ctx) return; // starts on unlock

        const now = this.ctx.currentTime;
        for (const t of this.tracks) {
            if (t.stopAt === null) {
                t.gain.gain.setTargetAtTime(0.0001, now, CROSSFADE_S / 4);
                t.stopAt = now + CROSSFADE_S;
            }
        }

        const compiled = name ? compileTrack(name) : null;
        if (compiled) {
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.setTargetAtTime(1, now, CROSSFADE_S / 4);
            gain.connect(this.musicBus);
            this.tracks.push({ compiled, gain, step: 0, nextTime: now + 0.05, stopAt: null });
        }

        if (!this.timer) this.timer = setInterval(() => this.schedule(), TICK_MS);
        this.schedule();
    }

    stopMusic() {
        this.playMusic(null);
    }

    schedule() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const horizon = now + LOOKAHEAD_S;

        for (const t of this.tracks) {
            // After a long stall (suspended tab) jump to now instead of
            // firing a burst of stale notes.
            if (t.nextTime < now - 0.25) t.nextTime = now + 0.02;
            while (t.nextTime < horizon && !t.done) {
                if (t.stopAt !== null && t.nextTime >= t.stopAt) break;
                this.scheduleStep(t, t.step, t.nextTime);
                t.step += 1;
                t.nextTime += t.compiled.stepSeconds;
                if (!t.compiled.loop && t.step >= t.compiled.length) t.done = true;
            }
        }

        // Drop tracks that have finished fading out (or playing once).
        this.tracks = this.tracks.filter(t => {
            const finished = (t.stopAt !== null && now > t.stopAt + 0.2) || (t.done && now > t.nextTime + 1);
            if (finished) t.gain.disconnect();
            return !finished;
        });
        if (this.tracks.length === 0 && this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    scheduleStep(track, step, when) {
        const { compiled, gain } = track;
        for (const voice of compiled.voices) {
            const local = compiled.loop ? step % voice.length : step;
            if (local >= voice.length) continue;
            const byStep = voice.byStep || this.indexVoice(voice);
            for (const ev of byStep[local] || []) {
                if (ev.drum) {
                    this.drum(ev.drum, when, voice.vol, gain);
                } else {
                    const dur = ev.len * compiled.stepSeconds * 0.92;
                    const note = this.voice({ wave: voice.wave, vol: voice.vol }, when, gain, { shape: 'note', dur, freq: ev.freq });
                    if (voice.echo) note.connect(this.echoIn);
                }
            }
        }
    }

    indexVoice(voice) {
        voice.byStep = [];
        for (const ev of voice.events) (voice.byStep[ev.step] ||= []).push(ev);
        return voice.byStep;
    }

    drum(kind, when, vol, out) {
        if (kind === 'k') {
            this.voice({ wave: 'triangle', freq: 160, to: 45, dur: 0.14, vol: vol * 1.6 }, when, out);
        } else if (kind === 's') {
            this.voice({ wave: 'noise', freq: 2600, to: 900, dur: 0.12, vol: vol * 1.1, filter: 'bandpass' }, when, out);
        } else {
            this.voice({ wave: 'noise', freq: 7000, dur: 0.035, vol: vol * 0.5, filter: 'highpass' }, when, out);
        }
    }
}

// The one engine shared by the menu (title music) and the game.
export const audio = new AudioEngine();
