// Pixel-art helpers shared by the 16-bit and ASCII renderers.
//
// Everything here is pure (no DOM), so the colour maths and sprite
// rasterising can be unit-tested in node. The renderers turn the rasterised
// pixel lists into canvases.

// Deterministic hash -> [0, 1). Used for per-tile variation so a section
// always draws the same way without a seeded RNG.
export function hash01(a, b, c = 0, d = 0) {
    let h = Math.imul(a | 0, 374761393) ^ Math.imul(b | 0, 668265263) ^
        Math.imul(c | 0, 1274126177) ^ Math.imul(d | 0, 2246822519);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}

export function hexToRgb(hex) {
    let h = hex.replace('#', '');
    if (h.length === 3) h = [...h].map(c => c + c).join('');
    const n = parseInt(h, 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else h = (r - g) / d + 4;
        h /= 6;
    }
    return [h, s, l];
}

function hslToRgb(h, s, l) {
    if (s === 0) return [l * 255, l * 255, l * 255];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const f = (t) => {
        t = (t % 1 + 1) % 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

const shadeCache = new Map();

// Lighten (amount > 0) or darken (amount < 0) a colour the way pixel artists
// do: highlights drift toward warm yellow, shadows toward cool blue.
export function shade(hex, amount) {
    const key = hex + '|' + amount.toFixed(2);
    const cached = shadeCache.get(key);
    if (cached) return cached;

    let [h, s, l] = rgbToHsl(...hexToRgb(hex));
    const target = amount > 0 ? 0.13 : 0.70;
    let dh = target - h;
    if (dh > 0.5) dh -= 1;
    if (dh < -0.5) dh += 1;
    h += dh * 0.07 * Math.abs(amount);
    l = Math.max(0, Math.min(1, l + amount * 0.09));
    s = Math.min(1, s * (1 + 0.06 * Math.abs(amount)));
    const [r, g, b] = hslToRgb(h, s, l);
    const out = `rgb(${r | 0},${g | 0},${b | 0})`;
    shadeCache.set(key, out);
    return out;
}

// Make sure a glyph colour is readable on a near-black background.
export function liftColor(hex, minLightness = 0.55) {
    let [h, s, l] = rgbToHsl(...hexToRgb(hex));
    if (l < minLightness) l = minLightness;
    const [r, g, b] = hslToRgb(h, s, l);
    return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

export const OUTLINE = '#120d1a';

// Turn a letter grid into a list of coloured pixels. '.' is transparent; any
// other letter looks up its colour in the palette. Every sprite gets the same
// treatment, which is what keeps a generated set consistent:
//   - a 1px dark outline around the silhouette,
//   - top/left edges of each colour region lightened, bottom/right darkened
//     (one light from the top-left),
//   - the lower third slightly darker.
// Returns { width, height, pixels: [{x, y, color}] }.
export function rasterizeSprite(rows, palette, { outline = OUTLINE } = {}) {
    const width = Math.max(...rows.map(r => r.length));
    const height = rows.length;
    const at = (x, y) => (x < 0 || y < 0 || x >= width || y >= height) ? '.' : (rows[y][x] || '.');
    const pixels = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const ch = at(x, y);
            if (ch === '.' || ch === ' ') {
                const touches = at(x - 1, y) !== '.' || at(x + 1, y) !== '.' ||
                    at(x, y - 1) !== '.' || at(x, y + 1) !== '.';
                if (touches && outline) pixels.push({ x, y, color: outline });
                continue;
            }
            const base = palette[ch];
            if (!base) throw new Error(`Sprite letter '${ch}' has no colour in its palette`);
            const lightEdge = at(x, y - 1) !== ch || at(x - 1, y) !== ch;
            const darkEdge = at(x, y + 1) !== ch || at(x + 1, y) !== ch;
            let amount = 0;
            if (lightEdge && !darkEdge) amount = 1.3;
            else if (darkEdge && !lightEdge) amount = -1.5;
            else if (!lightEdge && !darkEdge && y > height * 0.66) amount = -0.5;
            pixels.push({ x, y, color: amount ? shade(base, amount) : base });
        }
    }
    return { width, height, pixels };
}

// Tiny 3x5 bitmap font for damage numbers, so the game needs no web font.
const DIGITS = {
    '0': ['111', '101', '101', '101', '111'],
    '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'],
    '3': ['111', '001', '111', '001', '111'],
    '4': ['101', '101', '111', '001', '001'],
    '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'],
    '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'],
    '9': ['111', '101', '111', '001', '111'],
    '+': ['000', '010', '111', '010', '000'],
    '-': ['000', '000', '111', '000', '000']
};

// Pixel offsets for a short string in the 3x5 font (4px advance).
export function bitmapText(text) {
    const pixels = [];
    [...String(text)].forEach((ch, i) => {
        const glyph = DIGITS[ch];
        if (!glyph) return;
        glyph.forEach((row, y) => [...row].forEach((bit, x) => {
            if (bit === '1') pixels.push({ x: i * 4 + x, y });
        }));
    });
    return { width: String(text).length * 4 - 1, height: 5, pixels };
}
