// Generated terrain art for the 16-bit renderer.
//
// A section's whole map is painted once into an offscreen canvas at 16px per
// tile (the "base"), then the renderer copies the visible part each frame and
// scales it 2x. Walls are three-quarter view: a wall with floor below shows
// its face, any other wall shows its top. That, the floor shadows and the
// decoration are all worked out from the existing tile grid, so the dungeon
// generator does not change.

import { hash01, shade, OUTLINE } from './pixelArt.js';

export const TILE = 16;

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

function px(g, x, y, c, w = 1, h = 1) {
    g.fillStyle = c;
    g.fillRect(x, y, w, h);
}

function disc(g, cx, cy, radius, color, clipX, clipY) {
    g.fillStyle = color;
    const R = Math.ceil(radius);
    for (let dy = -R; dy <= R; dy++) {
        for (let dx = -R; dx <= R; dx++) {
            if (dx * dx + dy * dy > radius * radius) continue;
            const X = Math.round(cx) + dx, Y = Math.round(cy) + dy;
            if (X < clipX || Y < clipY || X >= clipX + TILE || Y >= clipY + TILE) continue;
            g.fillRect(X, Y, 1, 1);
        }
    }
}

export class SectionArtist {
    constructor(view, theme, worldX, worldY) {
        this.view = view;
        this.art = themeArt(theme);
        this.wx = worldX * 131;
        this.wy = worldY * 137;
    }

    r(x, y, salt) {
        return hash01(x + this.wx, y + this.wy, salt);
    }

    paint(g, decor) {
        const v = this.view;
        for (let y = 0; y < v.height; y++) {
            for (let x = 0; x < v.width; x++) {
                if (v.isFloor(x, y)) {
                    this.floor(g, x, y);
                    if (decor.carpets.has(`${x},${y}`)) this.carpet(g, x, y, decor.carpets);
                    this.shadows(g, x, y);
                } else if (v.isFace(x, y)) {
                    this.face(g, x, y);
                } else {
                    this.top(g, x, y);
                }
            }
        }
        decor.banners.forEach(p => this.banner(g, p.x, p.y));
        decor.torches.forEach(p => this.sconce(g, p.x, p.y));
        decor.candles.forEach(p => this.candle(g, p.x, p.y));
        decor.mushrooms.forEach(p => this.mushroom(g, p.x, p.y));
        decor.bones.forEach(p => this.bones(g, p.x, p.y));
    }

    face(g, x, y) {
        const a = this.art, X = x * TILE, Y = y * TILE;
        px(g, X, Y, a.mortar, TILE, TILE);
        if (a.faceKind === 'brick') {
            for (let row = 0; row < 4; row++) {
                const y0 = Y + row * 4, off = (row % 2) * 4;
                for (let bx = -8 + off; bx < TILE; bx += 8) {
                    const x0 = Math.max(0, bx), x1 = Math.min(TILE, bx + 7);
                    if (x1 <= x0) continue;
                    const v = this.r(x * 4 + ((bx + 8) >> 3), y * 4 + row, 7);
                    px(g, X + x0, y0, shade(a.face, (v - 0.5) * 1.6), x1 - x0, 3);
                    px(g, X + x0, y0, shade(a.face, 1.4), x1 - x0, 1);
                }
            }
        } else if (a.faceKind === 'rock') {
            px(g, X, Y, shade(a.face, -1.2), TILE, TILE);
            for (let i = 0; i < 7; i++) {
                const cx = X + 1 + this.r(x, y, i) * 14, cy = Y + 1 + this.r(y, x, i + 9) * 14;
                const rad = 2.2 + this.r(x + i, y, 3) * 2.8;
                disc(g, cx + 1, cy + 1, rad, shade(a.face, -2), X, Y);
                disc(g, cx, cy, rad, shade(a.face, this.r(i, x, y) - 0.5), X, Y);
                disc(g, cx - 1, cy - 1, rad * 0.45, shade(a.face, 1.5), X, Y);
            }
        } else {
            for (let row = 0; row < 2; row++) {
                const y0 = Y + row * 8, off = (row % 2) * 5;
                for (let bx = -10 + off; bx < TILE; bx += 10) {
                    const x0 = Math.max(0, bx), x1 = Math.min(TILE, bx + 9);
                    if (x1 <= x0) continue;
                    const v = this.r(x * 3 + bx, y * 2 + row, 5);
                    px(g, X + x0, y0, shade(a.face, (v - 0.5) * 1.2), x1 - x0, 7);
                    px(g, X + x0, y0, shade(a.face, 1.2), x1 - x0, 1);
                    if (v > 0.7) px(g, X + x0 + 3, y0 + 3, shade(a.face, -1.6), 2, 1);
                }
            }
            for (let k = 0; k < 3; k++) {
                if (this.r(x, y, 40 + k) < 0.45) continue;
                const mx = X + Math.floor(this.r(x, y, 50 + k) * 15);
                const len = 1 + Math.floor(this.r(x, y, 60 + k) * 6);
                px(g, mx, Y, a.moss, 1, len);
                px(g, mx, Y, shade(a.moss, 1.2));
            }
        }
        g.fillStyle = 'rgba(8,6,16,0.30)';
        g.fillRect(X, Y + TILE - 3, TILE, 3);
        g.fillRect(X, Y + TILE - 1, TILE, 1);
    }

    top(g, x, y) {
        const a = this.art, v = this.view, X = x * TILE, Y = y * TILE;
        const lip = v.isFace(x, y + 1);
        if (!v.nearFloor(x, y) && !lip) {
            px(g, X, Y, '#0a0911', TILE, TILE);
            return;
        }
        px(g, X, Y, a.top, TILE, TILE);
        for (let i = 0; i < 5; i++) px(g, X + Math.floor(this.r(x, y, i) * 16), Y + Math.floor(this.r(y, x, i) * 16), shade(a.top, -1.2));
        for (let i = 0; i < 3; i++) px(g, X + Math.floor(this.r(x, y, i + 9) * 16), Y + Math.floor(this.r(y, x, i + 9) * 16), shade(a.top, 1));
        if (v.isFloor(x, y - 1)) px(g, X, Y, a.topLight, TILE, 1);
        if (v.isFloor(x - 1, y)) px(g, X, Y, a.topLight, 1, TILE);
        if (v.isFloor(x + 1, y)) px(g, X + TILE - 1, Y, shade(a.top, -1.4), 1, TILE);
        if (lip) {
            px(g, X, Y + TILE - 2, a.topLight, TILE, 1);
            px(g, X, Y + TILE - 1, shade(a.topLight, 1.2), TILE, 1);
        }
    }

    floor(g, x, y) {
        const a = this.art, X = x * TILE, Y = y * TILE;
        if (a.floorKind === 'flag') {
            px(g, X, Y, a.gap, TILE, TILE);
            for (let sy = 0; sy < 2; sy++) {
                const off = ((y * 2 + sy) % 2) * 4;
                for (let sx = -1; sx < 3; sx++) {
                    const x0 = Math.max(0, sx * 8 + off), x1 = Math.min(TILE, sx * 8 + off + 7);
                    if (x1 <= x0) continue;
                    const v = this.r(x * 3 + sx, y * 2 + sy, 11);
                    px(g, X + x0, Y + sy * 8, shade(a.floor, (v - 0.5) * 1.4), x1 - x0, 7);
                    px(g, X + x0, Y + sy * 8, shade(a.floor, 0.9), x1 - x0, 1);
                }
            }
            if (this.r(x, y, 77) < 0.18) {
                const cx = X + 3 + Math.floor(this.r(x, y, 78) * 8), cy = Y + 3 + Math.floor(this.r(x, y, 79) * 8);
                for (let i = 0; i < 4; i++) px(g, cx + i, cy + (i >> 1), shade(a.floor, -2));
            }
        } else if (a.floorKind === 'dirt') {
            px(g, X, Y, a.floor, TILE, TILE);
            for (let yy = 0; yy < TILE; yy++) {
                for (let xx = 0; xx < TILE; xx++) {
                    const v = this.r(X + xx, Y + yy, 3);
                    if (v < 0.09) px(g, X + xx, Y + yy, shade(a.floor, -1.2));
                    else if (v > 0.93) px(g, X + xx, Y + yy, shade(a.floor, 0.9));
                }
            }
            for (let i = 0; i < 2; i++) {
                const cx = X + 2 + Math.floor(this.r(x, y, 20 + i) * 12), cy = Y + 2 + Math.floor(this.r(x, y, 30 + i) * 12);
                px(g, cx, cy, shade(a.floor, 1.8), 2, 1);
                px(g, cx, cy + 1, shade(a.floor, -1.6), 2, 1);
            }
        } else {
            px(g, X, Y, a.gap, TILE, TILE);
            const v = this.r(x, y, 13);
            px(g, X, Y, shade(a.floor, (v - 0.5) * 1.2), 15, 15);
            px(g, X, Y, shade(a.floor, 1), 15, 1);
            px(g, X, Y, shade(a.floor, 0.6), 1, 15);
            if (v > 0.55) {
                let cx = X + 4 + Math.floor(this.r(x, y, 14) * 6);
                for (let i = 0; i < 7; i++) {
                    px(g, cx, Y + 2 + i, shade(a.floor, -2));
                    if (this.r(x, y, 15 + i) > 0.5) cx++;
                }
            }
        }
    }

    carpet(g, x, y, carpets) {
        const X = x * TILE, Y = y * TILE;
        px(g, X, Y, '#7c1c2c', TILE, TILE);
        for (let i = 0; i < 6; i++) px(g, X + Math.floor(this.r(x, y, 90 + i) * 16), Y + Math.floor(this.r(y, x, 90 + i) * 16), '#6a1424');
        if (!carpets.has(`${x - 1},${y}`)) { px(g, X + 1, Y, '#d6a640', 1, TILE); px(g, X + 3, Y, '#a8802c', 1, TILE); }
        if (!carpets.has(`${x + 1},${y}`)) { px(g, X + 14, Y, '#d6a640', 1, TILE); px(g, X + 12, Y, '#a8802c', 1, TILE); }
        if (carpets.has(`${x - 1},${y}`) && carpets.has(`${x + 1},${y}`) && y % 2 === 0) {
            const c = '#c89a3a';
            px(g, X + 7, Y + 4, c, 2, 1); px(g, X + 6, Y + 5, c, 4, 1); px(g, X + 5, Y + 6, c, 6, 2);
            px(g, X + 6, Y + 8, c, 4, 1); px(g, X + 7, Y + 9, c, 2, 1); px(g, X + 7, Y + 6, '#7c1c2c', 2, 2);
        }
    }

    shadows(g, x, y) {
        const v = this.view, X = x * TILE, Y = y * TILE;
        if (v.isSolid(x, y - 1)) {
            g.fillStyle = 'rgba(6,4,14,0.42)'; g.fillRect(X, Y, TILE, 3);
            g.fillStyle = 'rgba(6,4,14,0.22)'; g.fillRect(X, Y + 3, TILE, 2);
        }
        if (v.isSolid(x - 1, y)) {
            g.fillStyle = 'rgba(6,4,14,0.32)'; g.fillRect(X, Y, 3, TILE);
        }
    }

    banner(g, x, y) {
        const a = this.art, X = x * TILE, Y = y * TILE, c = a.banner;
        px(g, X + 3, Y + 1, '#3a3040', 10, 1);
        for (let yy = 2; yy < 14; yy++) {
            for (let xx = 4; xx < 12; xx++) {
                if (yy >= 11 && Math.abs(xx - 7.5) < yy - 10) continue;
                if (a.faceKind === 'block' && yy > 9 && this.r(xx, yy, x) > 0.8) continue;
                px(g, X + xx, Y + yy, xx === 4 ? shade(c, 1.2) : xx === 11 ? shade(c, -1.4) : c);
            }
        }
        px(g, X + 4, Y + 2, a.trim, 8, 1);
        px(g, X + 7, Y + 5, a.trim, 2, 4);
        px(g, X + 6, Y + 6, a.trim, 4, 1);
    }

    sconce(g, x, y) {
        const X = x * TILE, Y = y * TILE;
        px(g, X + 6, Y + 8, '#2a2630', 4, 1);
        px(g, X + 7, Y + 6, '#4a4450', 2, 4);
        px(g, X + 6, Y + 5, '#5c5462', 4, 1);
    }

    candle(g, x, y) {
        const X = x * TILE, Y = y * TILE;
        px(g, X + 6, Y + 13, '#3a3040', 5, 1);
        px(g, X + 7, Y + 7, '#e8dcc0', 2, 6);
        px(g, X + 7, Y + 7, '#fff4dc', 1, 6);
        px(g, X + 10, Y + 10, '#d8ccb0', 2, 3);
    }

    mushroom(g, x, y) {
        const X = x * TILE, Y = y * TILE;
        const one = (ox, oy, s) => {
            px(g, X + ox, Y + oy, '#d8d0c0', 1, s + 1);
            px(g, X + ox - s, Y + oy - 1, '#2aa89a', s * 2 + 1, 1);
            px(g, X + ox - s + 1, Y + oy - 2, '#5ae0d0', s * 2 - 1, 1);
        };
        one(5, 12, 2); one(10, 10, 3); one(12, 13, 1);
    }

    bones(g, x, y) {
        const X = x * TILE, Y = y * TILE, c = '#d8d0bc';
        px(g, X + 3, Y + 10, c, 6, 1); px(g, X + 2, Y + 9, c); px(g, X + 2, Y + 11, c);
        px(g, X + 9, Y + 9, c); px(g, X + 9, Y + 11, c); px(g, X + 9, Y + 5, c, 3, 3);
        px(g, X + 10, Y + 6, '#2a2030'); px(g, X + 6, Y + 13, c, 4, 1);
    }
}

// Gates are drawn every frame (their lock state changes). Locked: an iron-
// banded door. Open: a dark archway with an arrow toward the next section.
export function drawGate(g, X, Y, gate, art) {
    px(g, X + 1, Y, shade(art.face, 1.2), 14, 16);
    if (gate && gate.locked) {
        px(g, X + 3, Y + 2, '#6e4426', 10, 14);
        px(g, X + 2, Y + 1, OUTLINE, 1, 15);
        px(g, X + 13, Y + 1, OUTLINE, 1, 15);
        for (const lx of [5, 8, 11]) px(g, X + lx, Y + 2, '#4a2c18', 1, 14);
        px(g, X + 3, Y + 2, '#8a5832', 10, 1);
        for (const by of [5, 11]) { px(g, X + 3, Y + by, '#2e2c3a', 10, 2); px(g, X + 3, Y + by, '#5a5868', 10, 1); }
        px(g, X + 7, Y + 7, '#f0c838', 3, 3);
        px(g, X + 8, Y + 8, OUTLINE, 1, 2);
        return;
    }
    px(g, X + 3, Y + 2, '#07060c', 10, 14);
    px(g, X + 4, Y + 1, '#07060c', 8, 1);
    const arrow = { north: [[7, 5], [6, 6], [7, 6], [8, 6], [7, 7], [7, 8], [7, 9]], south: [[7, 5], [7, 6], [7, 7], [6, 8], [7, 8], [8, 8], [7, 9]],
        east: [[5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [8, 6], [8, 8]], west: [[5, 7], [6, 7], [7, 7], [8, 7], [9, 7], [6, 6], [6, 8]] };
    (arrow[gate && gate.direction] || []).forEach(([ax, ay]) => px(g, X + ax + 1, Y + ay + 2, '#f0c838'));
}
