// Sound effects as data, the audio counterpart of the sprite grids: every
// effect is a short list of synth voices that the engine plays with Web
// Audio oscillators and filtered noise. Nothing is loaded from disk.
//
// Voice fields:
//   wave   'square' | 'pulse25' | 'pulse12' | 'triangle' | 'sawtooth' | 'sine' | 'noise'
//   freq   start frequency in Hz (for noise: the filter cutoff)
//   to     optional end frequency; the pitch (or cutoff) sweeps to it
//   dur    length in seconds
//   vol    peak volume, 0..1, before the effects bus
//   delay  start offset in seconds (default 0)
//   filter for noise: 'lowpass' (default) | 'highpass' | 'bandpass'

// A quick run of notes on one wave, for jingles and pickups.
export function arp(wave, freqs, step, vol, options = {}) {
    const { dur = step * 1.15, delay = 0 } = options;
    return freqs.map((freq, i) => ({ wave, freq, dur, vol, delay: delay + i * step }));
}

export const SFX = {
    // Combat
    hit: [
        { wave: 'noise', freq: 2400, to: 300, dur: 0.09, vol: 0.55 },
        { wave: 'square', freq: 210, to: 90, dur: 0.07, vol: 0.25 }
    ],
    hurt: [
        { wave: 'square', freq: 320, to: 70, dur: 0.2, vol: 0.32 },
        { wave: 'noise', freq: 1200, to: 200, dur: 0.12, vol: 0.4 }
    ],
    kill: [
        { wave: 'noise', freq: 1600, to: 120, dur: 0.32, vol: 0.5 },
        { wave: 'triangle', freq: 392, to: 98, dur: 0.28, vol: 0.45 },
        { wave: 'pulse25', freq: 784, to: 196, dur: 0.12, vol: 0.12, delay: 0.02 }
    ],
    explode: [
        { wave: 'noise', freq: 1800, to: 60, dur: 0.6, vol: 0.7 },
        { wave: 'square', freq: 110, to: 35, dur: 0.45, vol: 0.3 }
    ],
    death: [
        { wave: 'square', freq: 440, to: 55, dur: 1.1, vol: 0.3 },
        { wave: 'triangle', freq: 220, to: 40, dur: 1.2, vol: 0.4 },
        { wave: 'noise', freq: 900, to: 80, dur: 0.8, vol: 0.25 }
    ],

    // Projectiles, by damage type. Spells sound when their bolt leaves the
    // caster; 'physical' covers arrows from bows and archers.
    cast_arcane: [
        { wave: 'pulse25', freq: 660, to: 1760, dur: 0.14, vol: 0.32 },
        { wave: 'sine', freq: 1320, to: 2640, dur: 0.1, vol: 0.12, delay: 0.03 }
    ],
    cast_fire: [
        { wave: 'noise', freq: 600, to: 3200, dur: 0.32, vol: 0.6 },
        { wave: 'sawtooth', freq: 90, to: 180, dur: 0.28, vol: 0.18 }
    ],
    cast_lightning: [
        { wave: 'noise', freq: 2000, to: 6000, dur: 0.16, vol: 0.3, filter: 'highpass' },
        { wave: 'square', freq: 1800, to: 140, dur: 0.14, vol: 0.14 },
        { wave: 'square', freq: 1500, to: 120, dur: 0.1, vol: 0.15, delay: 0.06 }
    ],
    cast_ice: [
        { wave: 'triangle', freq: 1900, to: 1200, dur: 0.22, vol: 0.3 },
        { wave: 'sine', freq: 2600, to: 3200, dur: 0.16, vol: 0.12, delay: 0.04 },
        { wave: 'noise', freq: 5000, to: 7000, dur: 0.12, vol: 0.12, filter: 'highpass' }
    ],
    cast_poison: [
        { wave: 'square', freq: 240, to: 140, dur: 0.26, vol: 0.2 },
        { wave: 'noise', freq: 500, to: 900, dur: 0.22, vol: 0.25, filter: 'bandpass' }
    ],
    cast_physical: [
        { wave: 'noise', freq: 5000, to: 900, dur: 0.08, vol: 0.35, filter: 'bandpass' },
        { wave: 'triangle', freq: 900, to: 500, dur: 0.06, vol: 0.18 }
    ],

    // Player
    heal: arp('triangle', [523, 659, 784, 1047], 0.05, 0.3),
    mana: arp('sine', [659, 880, 1175], 0.05, 0.28),
    levelup: [
        ...arp('pulse25', [523, 659, 784, 1047], 0.08, 0.22),
        { wave: 'pulse25', freq: 1319, dur: 0.35, vol: 0.2, delay: 0.32 },
        { wave: 'triangle', freq: 262, dur: 0.6, vol: 0.35, delay: 0.32 }
    ],

    // Items and the world
    pickup: arp('pulse25', [660, 990], 0.06, 0.28),
    gold: arp('square', [1319, 1760], 0.05, 0.14),
    key: arp('pulse25', [784, 988, 1319], 0.07, 0.2),
    equip: [
        { wave: 'noise', freq: 3500, to: 2000, dur: 0.05, vol: 0.35, filter: 'bandpass' },
        { wave: 'square', freq: 520, to: 480, dur: 0.05, vol: 0.12, delay: 0.03 }
    ],
    gate: [
        { wave: 'noise', freq: 400, to: 90, dur: 0.7, vol: 0.45 },
        { wave: 'square', freq: 196, dur: 0.45, vol: 0.14, delay: 0.1 },
        { wave: 'square', freq: 294, dur: 0.45, vol: 0.12, delay: 0.1 },
        { wave: 'pulse25', freq: 392, dur: 0.3, vol: 0.12, delay: 0.3 }
    ],
    transition: [
        { wave: 'noise', freq: 300, to: 2400, dur: 0.35, vol: 0.25 },
        { wave: 'triangle', freq: 220, to: 440, dur: 0.3, vol: 0.25 }
    ],

    // Interface
    uiOpen: arp('pulse25', [660, 880], 0.035, 0.12),
    uiClose: arp('pulse25', [880, 660], 0.035, 0.12),
    uiClick: [{ wave: 'pulse12', freq: 1000, dur: 0.025, vol: 0.12 }]
};

export const SFX_NAMES = Object.keys(SFX);

// The effect name for a projectile's damage type ('cast_fire', ...), or
// null for damage types that have no launch sound.
export function projectileSfx(damageType) {
    const name = `cast_${damageType || 'arcane'}`;
    return SFX[name] ? name : null;
}

// Total length of an effect in seconds, used to free its nodes.
export function sfxDuration(voices) {
    return voices.reduce((end, v) => Math.max(end, (v.delay || 0) + v.dur), 0);
}
