// The polished ASCII renderer: classic glyphs on tinted cells, with light
// falloff from the player, torches and spells, and the same turn feedback as
// the 16-bit mode (sliding glyphs, hit flashes, damage numbers).

import { liftColor, hexToRgb } from './pixelArt.js';
import { itemVisual } from './visuals.js';
import { collectLights, flicker } from './sectionScene.js';
import { BURST_MS, FLOAT_MS } from './effects.js';

const ASCII_THEMES = {
    castle: { wall: '#9aa2c4', floor: '#5a5e78', bg: [20, 20, 30], wallBg: [34, 35, 52], carpetBg: [60, 12, 20], carpet: '#c05060' },
    cave: { wall: '#b8946c', floor: '#6e5840', bg: [24, 18, 12], wallBg: [44, 34, 24] },
    crypt: { wall: '#a69cc8', floor: '#57506e', bg: [16, 13, 24], wallBg: [32, 27, 46] }
};

const FONT = '"DejaVu Sans Mono", Menlo, Consolas, "Courier New", monospace';
const GATE_ARROWS = { north: '↑', south: '↓', east: '→', west: '←' };

export class AsciiBackend {
    constructor(game) {
        this.game = game;
    }

    render(scene, fx, now) {
        const game = this.game;
        const g = game.ctx;
        const C = game.tileSize;
        const th = ASCII_THEMES[scene.theme] || ASCII_THEMES.castle;
        const view = scene.view;
        const vw = game.camera.viewportWidth, vh = game.camera.viewportHeight;
        const cam = fx.cameraPos(now, game);
        const revealed = !!(game.stateManager && game.stateManager.mapRevealed);
        const fov = game.fov;
        const isVisible = (x, y) => revealed || (fov && fov.visible.has(`${x},${y}`));
        const isExplored = (x, y) => revealed || (fov && fov.explored.has(`${x},${y}`));
        const sx = (x) => Math.round((x - cam.x) * C);
        const sy = (y) => Math.round((y - cam.y) * C);

        g.fillStyle = '#07060b';
        g.fillRect(0, 0, game.canvas.width, game.canvas.height);

        const lights = collectLights(game, scene, fx, now);
        const tint = (x, y) => {
            let r = 0.22, gg = 0.22, b = 0.3;
            for (const l of lights) {
                const w = Math.max(0, 1 - Math.hypot(x + 0.5 - l.x, y + 0.5 - l.y) / l.r) * l.i;
                if (w <= 0) continue;
                r += l.c[0] / 255 * w * 1.15;
                gg += l.c[1] / 255 * w * 1.15;
                b += l.c[2] / 255 * w * 1.15;
            }
            return [Math.min(1.25, r), Math.min(1.2, gg), Math.min(1.2, b)];
        };
        const fg = (hex, tn, vis) => {
            const [r, gg, b] = hexToRgb(hex);
            if (!vis) return `rgb(${r * 0.22 + 22 | 0},${gg * 0.22 + 24 | 0},${b * 0.22 + 40 | 0})`;
            return `rgb(${Math.min(255, r * tn[0]) | 0},${Math.min(255, gg * tn[1]) | 0},${Math.min(255, b * tn[2]) | 0})`;
        };
        const bg = (arr, tn, vis) => vis
            ? `rgb(${arr[0] * tn[0] | 0},${arr[1] * tn[1] | 0},${arr[2] * tn[2] | 0})`
            : `rgb(${arr[0] * 0.45 | 0},${arr[1] * 0.45 | 0},${arr[2] * 0.55 | 0})`;

        g.textAlign = 'center';
        g.textBaseline = 'middle';
        const glyph = (px, py, ch, color, size = Math.round(C * 0.8), weight = 700) => {
            g.font = `${weight} ${size}px ${FONT}`;
            g.fillStyle = color;
            g.fillText(ch, px + C / 2, py + C / 2 + 1);
        };

        const tints = new Map();
        const x0 = Math.floor(cam.x), y0 = Math.floor(cam.y);
        const gateAt = new Map(((game.dungeon && game.dungeon.gates) || []).map(gt => [`${gt.x},${gt.y}`, gt]));
        const carpets = scene.decor.carpets;

        for (let y = y0; y <= y0 + vh; y++) {
            for (let x = x0; x <= x0 + vw; x++) {
                if (x < 0 || y < 0 || x >= view.width || y >= view.height) continue;
                if (!isExplored(x, y)) continue;
                const vis = isVisible(x, y);
                const tn = vis ? tint(x, y) : null;
                tints.set(`${x},${y}`, tn);
                const X = sx(x), Y = sy(y);
                const tile = view.at(x, y);
                if (tile === 'floor') {
                    const carpet = th.carpetBg && carpets.has(`${x},${y}`);
                    g.fillStyle = bg(carpet ? th.carpetBg : th.bg, tn, vis);
                    g.fillRect(X, Y, C, C);
                    glyph(X, Y, '·', fg(carpet ? th.carpet : th.floor, tn, vis), Math.round(C * 0.75), 400);
                } else if (tile === 'gate') {
                    const gate = gateAt.get(`${x},${y}`);
                    g.fillStyle = bg(th.wallBg, tn, vis);
                    g.fillRect(X, Y, C, C);
                    const ch = gate && !gate.locked && GATE_ARROWS[gate.direction] ? GATE_ARROWS[gate.direction] : '+';
                    glyph(X, Y, ch, fg(gate && gate.locked ? '#f0c838' : '#e0a050', tn, vis));
                } else if (view.nearFloor(x, y)) {
                    g.fillStyle = bg(th.wallBg, tn, vis);
                    g.fillRect(X, Y, C, C);
                    glyph(X, Y, '#', fg(th.wall, tn, vis));
                }
            }
        }

        const cellTint = (x, y) => tints.get(`${x},${y}`) || null;
        const put = (x, y, ch, color, { flash = false, fx: fxPos = null } = {}) => {
            const vis = isVisible(x, y);
            const tn = cellTint(x, y) || tint(x, y);
            const X = fxPos ? sx(fxPos.x) : sx(x), Y = fxPos ? sy(fxPos.y) : sy(y);
            // Clear the cell's floor glyph (or decoration) under the new one.
            if (view.at(x, y) === 'floor') {
                const carpet = th.carpetBg && carpets.has(`${x},${y}`);
                g.fillStyle = bg(carpet ? th.carpetBg : th.bg, tn, vis);
                g.fillRect(sx(x), sy(y), C, C);
            }
            if (flash) {
                g.fillStyle = '#a02030';
                g.fillRect(X, Y, C, C);
                glyph(X, Y, ch, '#ffffff');
                return;
            }
            glyph(X, Y, ch, fg(color, tn, vis));
        };

        const decor = scene.decor;
        const inView = (p) => p.x >= x0 - 1 && p.y >= y0 - 1 && p.x <= x0 + vw + 1 && p.y <= y0 + vh + 1 && isExplored(p.x, p.y);
        decor.torches.forEach((p, i) => {
            if (!inView(p)) return;
            const X = sx(p.x), Y = sy(p.y);
            g.fillStyle = bg(th.wallBg, cellTint(p.x, p.y) || tint(p.x, p.y), isVisible(p.x, p.y));
            g.fillRect(X + 3, Y + 3, C - 6, C - 6);
            glyph(X, Y, '¡', `rgb(255,${150 + 60 * flicker(now, i) | 0},70)`);
        });
        decor.candles.forEach(p => { if (inView(p)) put(p.x, p.y, '¡', '#ffe0a0'); });
        decor.mushrooms.forEach(p => { if (inView(p)) put(p.x, p.y, '♣', '#40e8d0'); });
        decor.bones.forEach(p => { if (inView(p)) put(p.x, p.y, '%', '#d8d0bc'); });

        const items = (game.itemManager && Array.isArray(game.itemManager.itemsOnGround)) ? game.itemManager.itemsOnGround : [];
        for (const gi of items) {
            if (!gi || !gi.item || !isVisible(gi.x, gi.y)) continue;
            const v = itemVisual(gi.item);
            put(gi.x, gi.y, v.glyph, v.color);
        }
        for (const m of game.monsters || []) {
            if (!isVisible(m.x, m.y)) continue;
            put(m.x, m.y, m.symbol || '?', liftColor(m.color || '#ffffff'), { flash: fx.isFlashing(m, now), fx: fx.entityPos(m, now) });
        }
        if (game.player) {
            const p = game.player;
            put(p.x, p.y, '@', '#fff0c0', { flash: fx.isFlashing(p, now), fx: fx.entityPos(p, now) });
        }

        const projectiles = (game.projectileManager && game.projectileManager.getActiveProjectiles()) || [];
        for (const proj of projectiles) {
            const pos = proj.getPosition();
            glyph(sx(pos.x), sy(pos.y), proj.symbol || '*', proj.color || '#9cd0ff');
        }
        for (const b of fx.bursts) {
            const k = (now - b.t0) / BURST_MS;
            g.globalAlpha = Math.max(0, 1 - k);
            glyph(sx(b.x), sy(b.y), k < 0.5 ? '*' : '·', b.color);
            g.globalAlpha = 1;
        }
        for (const f of fx.floaters) {
            const k = (now - f.t0) / FLOAT_MS;
            const X = sx(f.x), Y = sy(f.y) - C * 0.45 - k * C * 0.6;
            g.globalAlpha = k < 0.7 ? 1 : (1 - k) / 0.3;
            g.font = `700 ${Math.round(C * 0.6)}px ${FONT}`;
            g.lineWidth = 3;
            g.strokeStyle = '#07060b';
            g.strokeText(f.text, X + C / 2, Y + C / 2);
            g.fillStyle = f.color;
            g.fillText(f.text, X + C / 2, Y + C / 2);
            g.globalAlpha = 1;
        }
    }
}
