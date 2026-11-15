// Background music as data: short chiptune loops written in a tiny step
// notation and played by the engine's sequencer with the same synth voices
// as the sound effects.
//
// A pattern is a space-separated list of steps ('|' marks bars and is
// ignored):
//   'D4', 'C#5', 'Bb3'   play a note (scientific pitch, A4 = 440 Hz)
//   '-'                  hold the previous note one more step
//   '.'                  rest
//   'k' 's' 'h'          drum hits (kick, snare, hat) on a 'drums' voice
//
// Every voice loops over its own length; the track's loop is the longest.

const NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// 'A4' -> 440, 'C#5' -> 554.37, 'Bb3' -> 233.08; null for anything else.
export function noteToFreq(token) {
    const m = /^([A-G])([#b]?)(-?\d)$/.exec(token);
    if (!m) return null;
    let semis = NOTE_INDEX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    const octave = Number(m[3]);
    const midi = (octave + 1) * 12 + semis;
    return 440 * Math.pow(2, (midi - 69) / 12);
}

const DRUMS = new Set(['k', 's', 'h']);

// Turn a pattern string into timed events.
// Returns { length, events: [{ step, len, freq?, drum? }] }.
export function parsePattern(pattern) {
    const tokens = String(pattern).split(/\s+/).filter(t => t && t !== '|');
    const events = [];
    let last = null;
    tokens.forEach((token, step) => {
        if (token === '-') {
            if (last) last.len += 1;
            return;
        }
        last = null;
        if (token === '.') return;
        if (DRUMS.has(token)) {
            events.push({ step, len: 1, drum: token });
            return;
        }
        const freq = noteToFreq(token);
        if (freq === null) throw new Error(`Unknown music token "${token}"`);
        last = { step, len: 1, freq };
        events.push(last);
    });
    return { length: tokens.length, events };
}

export const MUSIC = {
    // Menu: a heroic minor-key theme over a pumping octave bass.
    title: {
        bpm: 104, stepsPerBeat: 2,
        voices: [
            { wave: 'pulse25', vol: 0.16, pattern: `
                A4 - - C5 E5 - D5 C5 | C5 - - A4 F4 - - . | G4 - - C5 E5 - G5 - | G5 - F5 E5 D5 - - . |
                A4 - - C5 E5 - A5 - | A5 - G5 F5 C5 - F5 - | D5 - - B4 G4 - D5 - | E5 - - - G#4 - - . ` },
            { wave: 'triangle', vol: 0.32, pattern: `
                A2 A3 A2 A3 A2 A3 A2 A3 | F2 F3 F2 F3 F2 F3 F2 F3 | C3 C4 C3 C4 C3 C4 C3 C4 | G2 G3 G2 G3 G2 G3 G2 G3 |
                A2 A3 A2 A3 A2 A3 A2 A3 | F2 F3 F2 F3 F2 F3 F2 F3 | G2 G3 G2 G3 G2 G3 G2 G3 | E2 E3 E2 E3 E2 E3 G#2 B2 ` },
            { wave: 'drums', vol: 0.2, pattern: 'k h s h k k s h' }
        ]
    },

    // Castle: a stately D minor march.
    castle: {
        bpm: 92, stepsPerBeat: 2,
        voices: [
            { wave: 'pulse25', vol: 0.15, pattern: `
                D4 - F4 - A4 - G4 F4 | F4 - - - D4 - - . | E4 - G4 - C5 - Bb4 A4 | A4 - - - - - . . |
                D5 - C5 - A4 - F4 - | G4 - Bb4 - D5 - C5 Bb4 | A4 - G4 - E4 - C#4 - | D4 - - - - - . . ` },
            { wave: 'pulse12', vol: 0.07, pattern: `
                A3 - - - A3 - - - | F3 - - - F3 - - - | G3 - - - G3 - - - | E3 - - - C#3 - - - |
                A3 - - - A3 - - - | Bb3 - - - Bb3 - - - | C#4 - - - A3 - - - | A3 - - - F3 - - - ` },
            { wave: 'triangle', vol: 0.32, pattern: `
                D2 . D2 . A2 . D2 . | Bb1 . Bb1 . F2 . Bb1 . | C2 . C2 . G2 . C2 . | A1 . A1 . E2 . A1 . |
                D2 . D2 . A2 . D2 . | G1 . G1 . D2 . G1 . | A1 . A1 . E2 . C#2 . | D2 . A1 . D2 - - . ` },
            { wave: 'drums', vol: 0.14, pattern: 'k . h . s . h . | k . h . s . h h' }
        ]
    },

    // Cave: slow and sparse in E phrygian, with echoing drips.
    cave: {
        bpm: 70, stepsPerBeat: 2,
        voices: [
            { wave: 'triangle', vol: 0.22, echo: true, pattern: `
                . . B4 . . . G4 . | . . A4 . F4 . . . | . . E4 . G4 . B4 . | C5 - - - B4 . . . |
                . . E5 . . . D5 . | C5 . . . B4 . A4 . | G4 . . . F4 . . . | E4 - - - - - . . ` },
            { wave: 'sine', vol: 0.06, echo: true, pattern: `
                . . . . . . . E6 | . . . . . . . . | . . . . . B5 . . | . . . . . . . . ` },
            { wave: 'triangle', vol: 0.3, pattern: `
                E2 - - - - - - - | F2 - - - - - - - | E2 - - - - - - - | D2 - - - C2 - - - |
                E2 - - - - - - - | F2 - - - - - - - | G2 - - - F2 - - - | E2 - - - - - - - ` }
        ]
    },

    // Crypt: a slow C minor dirge with an organ-like pad.
    crypt: {
        bpm: 76, stepsPerBeat: 2,
        voices: [
            { wave: 'pulse25', vol: 0.12, echo: true, pattern: `
                G4 - - - Ab4 - G4 - | Eb4 - - - - - . . | F4 - - - Ab4 - C5 - | B4 - - - - - . . |
                C5 - - - Bb4 - Ab4 - | G4 - - - Eb4 - . . | F4 - Ab4 - Db5 - C5 - | B4 - - - G4 - - - ` },
            { wave: 'pulse12', vol: 0.08, pattern: `
                Eb3 - - - - - - - | C3 - - - - - - - | Ab2 - - - - - - - | B2 - - - D3 - - - |
                Eb3 - - - - - - - | C3 - - - - - - - | F3 - - - - - - - | D3 - - - B2 - - - ` },
            { wave: 'triangle', vol: 0.32, pattern: `
                C2 - - - - - - - | Ab1 - - - - - - - | F1 - - - - - - - | G1 - - - - - - - |
                C2 - - - - - - - | Ab1 - - - - - - - | Db2 - - - - - - - | G1 - - - - - - - ` }
        ]
    },

    // Combat: driving A minor loop, faster, with full drums.
    combat: {
        bpm: 144, stepsPerBeat: 2,
        voices: [
            { wave: 'pulse25', vol: 0.19, pattern: `
                A4 . A4 C5 E5 . D5 C5 | F4 . F4 A4 C5 . B4 A4 | G4 . G4 B4 D5 . E5 D5 | E5 - - - G#4 - B4 - |
                A5 . G5 E5 D5 . C5 D5 | C5 . A4 F4 A4 . C5 F5 | D5 . B4 G4 B4 . D5 G5 | E5 - D5 - C5 - B4 - ` },
            { wave: 'sawtooth', vol: 0.16, pattern: `
                A1 A1 A2 A1 A1 A1 A2 A1 | F1 F1 F2 F1 F1 F1 F2 F1 | G1 G1 G2 G1 G1 G1 G2 G1 | E1 E1 E2 E1 E1 E1 E2 G#1 ` },
            { wave: 'drums', vol: 0.24, pattern: 'k h s h k k s h | k h s h k k s s' }
        ]
    },

    // Death: a short falling phrase that plays once.
    death: {
        bpm: 66, stepsPerBeat: 2, loop: false,
        voices: [
            { wave: 'pulse25', vol: 0.16, echo: true, pattern: 'A4 - G4 - F4 - E4 - | D4 - C4 - B3 - - - | A3 - - - - - - - ' },
            { wave: 'triangle', vol: 0.32, pattern: 'A2 - - - D2 - - - | F2 - - - E2 - - - | A1 - - - - - - - ' }
        ]
    }
};

export const MUSIC_NAMES = Object.keys(MUSIC);

// Parsed form of a track, cached: { bpm, stepSeconds, length, loop, voices }.
const compiled = new Map();
export function compileTrack(name) {
    if (compiled.has(name)) return compiled.get(name);
    const track = MUSIC[name];
    if (!track) return null;
    const voices = track.voices.map(v => ({ ...v, ...parsePattern(v.pattern) }));
    const result = {
        name,
        bpm: track.bpm,
        stepSeconds: 60 / track.bpm / (track.stepsPerBeat || 2),
        length: Math.max(...voices.map(v => v.length)),
        loop: track.loop !== false,
        voices
    };
    compiled.set(name, result);
    return result;
}

// Which tune fits a section theme ('castle' | 'cave' | 'crypt').
export function trackForTheme(theme) {
    return MUSIC[theme] ? theme : 'castle';
}
