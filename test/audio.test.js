import { describe, it, expect } from 'vitest';
import {
    DEFAULT_AUDIO_SETTINGS, normalizeAudioSettings, loadAudioSettings, saveAudioSettings, busGain, AUDIO_SETTINGS_KEY
} from '../src/js/modules/audio/audioSettings.js';
import { SFX, SFX_NAMES, projectileSfx, sfxDuration } from '../src/js/modules/audio/sfxPresets.js';
import { MUSIC, MUSIC_NAMES, noteToFreq, parsePattern, compileTrack, trackForTheme } from '../src/js/modules/audio/musicTracks.js';
import { AudioEngine } from '../src/js/modules/audio/audioEngine.js';

function memoryStorage() {
    const map = new Map();
    return {
        getItem: (k) => (map.has(k) ? map.get(k) : null),
        setItem: (k, v) => map.set(k, String(v)),
        map
    };
}

describe('audio settings', () => {
    it('defaults, clamps and ignores junk', () => {
        expect(normalizeAudioSettings(null)).toEqual({ ...DEFAULT_AUDIO_SETTINGS });
        expect(normalizeAudioSettings({ master: 2, music: -1, sfx: 'x', muted: 'yes' }))
            .toEqual({ master: 1, music: 0, sfx: DEFAULT_AUDIO_SETTINGS.sfx, muted: false });
    });

    it('round-trips through storage and survives broken JSON', () => {
        const storage = memoryStorage();
        saveAudioSettings({ master: 0.5, music: 0.25, sfx: 1, muted: true }, storage);
        expect(loadAudioSettings(storage)).toEqual({ master: 0.5, music: 0.25, sfx: 1, muted: true });
        storage.setItem(AUDIO_SETTINGS_KEY, '{nope');
        expect(loadAudioSettings(storage)).toEqual({ ...DEFAULT_AUDIO_SETTINGS });
    });

    it('mutes every bus', () => {
        expect(busGain({ master: 0.5, music: 0.5, sfx: 1, muted: false }, 'music')).toBeCloseTo(0.25);
        expect(busGain({ master: 1, music: 1, sfx: 1, muted: true }, 'sfx')).toBe(0);
    });
});

describe('sound effect presets', () => {
    const WAVES = new Set(['square', 'pulse25', 'pulse12', 'triangle', 'sawtooth', 'sine', 'noise']);

    it('every voice is playable', () => {
        for (const name of SFX_NAMES) {
            expect(SFX[name].length, name).toBeGreaterThan(0);
            for (const v of SFX[name]) {
                expect(WAVES.has(v.wave), `${name} wave ${v.wave}`).toBe(true);
                expect(v.freq, name).toBeGreaterThan(0);
                if (v.to !== undefined) expect(v.to, name).toBeGreaterThan(0); // exponential ramps need > 0
                expect(v.dur, name).toBeGreaterThan(0);
                expect(v.vol, name).toBeGreaterThan(0);
                expect(v.vol, name).toBeLessThanOrEqual(1);
            }
            expect(sfxDuration(SFX[name]), name).toBeLessThan(1.5);
        }
    });

    it('has a launch sound for every spell damage type that flies', () => {
        for (const type of ['arcane', 'fire', 'lightning', 'ice', 'poison', 'physical']) {
            expect(projectileSfx(type)).toBe(`cast_${type}`);
        }
        expect(projectileSfx('healing')).toBeNull();
        expect(projectileSfx(undefined)).toBe('cast_arcane');
    });
});

describe('music', () => {
    it('reads note names', () => {
        expect(noteToFreq('A4')).toBeCloseTo(440);
        expect(noteToFreq('C#5')).toBeCloseTo(554.37, 1);
        expect(noteToFreq('Bb3')).toBeCloseTo(233.08, 1);
        expect(noteToFreq('H2')).toBeNull();
    });

    it('parses holds, rests and drums', () => {
        const { length, events } = parsePattern('A4 - - . | k C5');
        expect(length).toBe(6);
        expect(events).toEqual([
            { step: 0, len: 3, freq: noteToFreq('A4') },
            { step: 4, len: 1, drum: 'k' },
            { step: 5, len: 1, freq: noteToFreq('C5') }
        ]);
        expect(() => parsePattern('A4 Q9')).toThrow();
    });

    it('every track compiles and its voices line up', () => {
        for (const name of MUSIC_NAMES) {
            const track = compileTrack(name);
            expect(track.stepSeconds, name).toBeGreaterThan(0);
            for (const voice of track.voices) {
                // Voices loop on their own; they must divide the track evenly
                // or the tune drifts against itself.
                expect(track.length % voice.length, `${name} ${voice.wave}`).toBe(0);
                const drums = voice.events.filter(e => e.drum).length;
                if (voice.wave === 'drums') expect(drums).toBe(voice.events.length);
                else expect(drums).toBe(0);
            }
        }
    });

    it('has a tune for every section theme, the title, combat and death', () => {
        for (const theme of ['castle', 'cave', 'crypt']) expect(trackForTheme(theme)).toBe(theme);
        expect(trackForTheme('unknown')).toBe('castle');
        for (const name of ['title', 'combat', 'death']) expect(MUSIC[name]).toBeTruthy();
        expect(compileTrack('death').loop).toBe(false);
    });
});

describe('engine without Web Audio', () => {
    it('is a silent no-op but still keeps settings', () => {
        const storage = memoryStorage();
        const engine = new AudioEngine({ storage });
        expect(engine.available).toBe(false);
        expect(engine.unlock()).toBe(false);
        expect(engine.play('hit')).toBe(false);
        engine.playMusic('castle');
        expect(engine.toggleMute()).toBe(true);
        expect(loadAudioSettings(storage).muted).toBe(true);
    });
});
