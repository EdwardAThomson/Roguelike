// Section data the ASCII renderer reads: a read-only view of the tile grid,
// theme palettes and deterministic decoration (torches, candles, ...),
// which also feed the light sources.

import { hash01 } from './pixelArt.js';

export const TILE_THEMES = {
    castle: {
        top: '#2f3146', topLight: '#555a7a', face: '#686f8c', mortar: '#2a2c3e',
        floor: '#4a4c62', gap: '#26273a', faceKind: 'brick', floorKind: 'flag',
        banner: '#a8283a', trim: '#d6a640', carpets: true
    },
    cave: {
        top: '#2c221a', topLight: '#54412f', face: '#7e6249', mortar: '#3a2c20',
        floor: '#43352a', gap: '#2a2018', faceKind: 'rock', floorKind: 'dirt',
        mushrooms: 0.06, bones: 0.012
    },
    crypt: {
        top: '#241f31', topLight: '#463d5e', face: '#554d6e', mortar: '#211c2c',
        floor: '#353046', gap: '#1b1726', faceKind: 'block', floorKind: 'slab',
        moss: '#4f7c55', banner: '#5c3c7c', trim: '#9aa0b0', candles: 0.05, bones: 0.025
    }
};

export function themeArt(theme) {
    return TILE_THEMES[theme] || TILE_THEMES.castle;
}

// Read-only view of a section's tile grid with the questions the art asks.
export class MapView {
    constructor(map) {
        this.map = map || [];
        this.height = this.map.length;
        this.width = this.height ? this.map[0].length : 0;
    }
    at(x, y) {
        if (x < 0 || y < 0 || x >= this.width || y >= this.height) return 'wall';
        return this.map[y][x];
    }
    isFloor(x, y) { return this.at(x, y) === 'floor'; }
    // Gates sit in wall lines, so the art treats them as wall for joining.
    isSolid(x, y) { return !this.isFloor(x, y); }
    isFace(x, y) { return this.isSolid(x, y) && this.isFloor(x, y + 1); }
    nearFloor(x, y) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (this.isFloor(x + dx, y + dy)) return true;
            }
        }
        return false;
    }
}

// Deterministic decoration for a section: same section, same torches.
export function sectionDecor(view, theme, worldX = 0, worldY = 0, rooms = [], gates = []) {
    const art = themeArt(theme);
    const r = (x, y, salt) => hash01(x + worldX * 131, y + worldY * 137, salt);
    const gateAt = new Set(gates.map(g => `${g.x},${g.y}`));
    const decor = { torches: [], banners: [], candles: [], mushrooms: [], bones: [], carpets: new Set() };
    const near = (list, x, y, d) => list.some(p => Math.abs(p.x - x) <= d && Math.abs(p.y - y) <= d);

    for (let y = 0; y < view.height; y++) {
        for (let x = 0; x < view.width; x++) {
            const key = `${x},${y}`;
            if (gateAt.has(key) || near([...gates], x, y, 1)) continue;
            if (view.at(x, y) === 'wall' && view.isFace(x, y)) {
                if (r(x, y, 1) < 0.14 && !near(decor.torches, x, y, 4)) decor.torches.push({ x, y });
                else if (art.banner && r(x, y, 2) < 0.07 && !near(decor.torches, x, y, 1) && !near(decor.banners, x, y, 3)) decor.banners.push({ x, y });
            } else if (view.isFloor(x, y)) {
                const byWall = view.isSolid(x - 1, y) || view.isSolid(x + 1, y) || view.isSolid(x, y - 1);
                if (art.candles && byWall && r(x, y, 3) < art.candles && !near(decor.candles, x, y, 2)) decor.candles.push({ x, y });
                else if (art.mushrooms && byWall && r(x, y, 4) < art.mushrooms) decor.mushrooms.push({ x, y });
                else if (art.bones && r(x, y, 5) < art.bones) decor.bones.push({ x, y });
            }
        }
    }

    if (art.carpets) {
        rooms.forEach((room, i) => {
            if (!room || room.width < 7 || room.height < 5 || r(room.x, room.y, 6 + i) > 0.6) return;
            const cx = room.x + Math.floor(room.width / 2);
            for (let y = room.y; y < room.y + room.height; y++) {
                for (let x = cx - 1; x <= cx + 1; x++) {
                    if (view.isFloor(x, y)) decor.carpets.add(`${x},${y}`);
                }
            }
        });
    }
    return decor;
}

