// Per-section data shared by the ASCII and 16-bit renderers: a read-only view
// of the tile grid, its decoration, and the light sources in it. Rebuilt only
// when the section (or a tile in it) changes.

import { MapView, sectionDecor } from './tileArt.js';

// Cheap signature of the tile grid, so a gate opening or a corridor being
// carved invalidates the cached art.
export function mapSignature(map) {
    let h = 0;
    for (let y = 0; y < map.length; y++) {
        const row = map[y];
        for (let x = 0; x < row.length; x++) {
            const t = row[x];
            h = (Math.imul(h, 31) + (t === 'floor' ? 1 : t === 'gate' ? 2 : 3)) | 0;
        }
    }
    return h;
}

export class SectionScene {
    constructor() {
        this.dungeon = null;
        this.signature = null;
        this.view = null;
        this.decor = null;
        this.version = 0;
    }

    // Returns true when the section changed since the last call.
    sync(game) {
        const dungeon = game.dungeon;
        const map = game.map || [];
        const signature = mapSignature(map);
        if (dungeon === this.dungeon && signature === this.signature && this.view) return false;

        this.dungeon = dungeon;
        this.signature = signature;
        this.view = new MapView(map);
        const theme = (dungeon && dungeon.theme) || 'castle';
        this.theme = theme;
        this.decor = sectionDecor(
            this.view, theme,
            dungeon ? dungeon.worldX || 0 : 0, dungeon ? dungeon.worldY || 0 : 0,
            (dungeon && dungeon.rooms) || [], (dungeon && dungeon.gates) || []
        );
        this.version++;
        return true;
    }
}

export function flicker(now, i) {
    const t = now / 1000;
    return 0.82 + 0.1 * Math.sin(t * 11 + i * 2.1) + 0.08 * Math.sin(t * 23.7 + i * 5.3);
}

const hexRgb = (hex) => {
    let h = String(hex || '#ffffff').replace('#', '');
    if (h.length === 3) h = [...h].map(c => c + c).join('');
    const n = parseInt(h, 16);
    return Number.isNaN(n) ? [255, 255, 255] : [n >> 16 & 255, n >> 8 & 255, n & 255];
};

// Light sources in tile coordinates (x, y are tile centres; r in tiles).
export function collectLights(game, scene, fx, now) {
    const lights = [];
    if (game.player) {
        const p = fx ? fx.entityPos(game.player, now) : game.player;
        lights.push({ x: p.x + 0.5, y: p.y + 0.4, r: 7.5, c: [255, 214, 160], i: 1 });
    }
    const d = scene.decor || { torches: [], candles: [], mushrooms: [] };
    d.torches.forEach((t, i) => lights.push({ x: t.x + 0.5, y: t.y + 0.3, r: 5.2, c: [255, 150, 70], i: 0.95 * flicker(now, i) }));
    d.candles.forEach((t, i) => lights.push({ x: t.x + 0.5, y: t.y + 0.4, r: 2.9, c: [255, 200, 120], i: 0.8 * flicker(now, i + 7) }));
    d.mushrooms.forEach((t, i) => lights.push({ x: t.x + 0.55, y: t.y + 0.65, r: 2.6, c: [60, 230, 205], i: 0.7 + 0.1 * Math.sin(now / 500 + i) }));
    if (fx) {
        fx.projectileTrails().forEach(p => lights.push({ x: p.x + 0.5, y: p.y + 0.5, r: 3.2, c: hexRgb(p.color), i: 1 }));
        fx.bursts.forEach(b => {
            const k = Math.min(1, (now - b.t0) / 380);
            lights.push({ x: b.x + 0.5, y: b.y + 0.5, r: 3.8 * (1 - k * 0.5), c: hexRgb(b.color), i: 1 - k });
        });
    }
    return lights;
}
