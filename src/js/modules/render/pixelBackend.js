// The 16-bit renderer. Draws at 16px per tile into an offscreen canvas, then
// scales it 2x onto the game canvas with no smoothing. With `lit` it also
// multiplies a light map over the scene and adds particles.

import { rasterizeSprite, bitmapText, hash01, OUTLINE } from './pixelArt.js';
import { CHARACTER_SPRITES, ITEM_SPRITES } from './spriteDefs.js';
import { itemVisual, monsterSpriteKey } from './visuals.js';
import { TILE, SectionArtist, themeArt, drawGate } from './tileArt.js';
import { collectLights, flicker } from './sectionScene.js';
import { BURST_MS, DEATH_MS, FLOAT_MS } from './effects.js';

const ELITE_OUTLINE = '#f0c040';

function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
}

function spriteCanvas(def, outline) {
    const r = rasterizeSprite(def.rows, def.palette, outline ? { outline } : undefined);
    const c = makeCanvas(16, 16);
    const g = c.getContext('2d');
    for (const p of r.pixels) {
        g.fillStyle = p.color;
        g.fillRect(p.x, p.y, 1, 1);
    }
    return c;
}

function whiten(src) {
    const c = makeCanvas(src.width, src.height);
    const g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#fff';
    g.fillRect(0, 0, c.width, c.height);
    return c;
}

export class PixelBackend {
    constructor(game) {
        this.game = game;
        this.native = makeCanvas(16, 16);
        this.light = makeCanvas(16, 16);
        this.base = null;
        this.baseVersion = -1;
        this.sprites = null;
    }

    buildSprites() {
        const s = { chars: {}, white: {}, elite: {}, items: {}, alpha: {} };
        for (const [key, def] of Object.entries(CHARACTER_SPRITES)) {
            s.chars[key] = spriteCanvas(def);
            s.white[key] = whiten(s.chars[key]);
            s.elite[key] = spriteCanvas(def, ELITE_OUTLINE);
            s.alpha[key] = def.alpha || 1;
        }
        for (const [key, def] of Object.entries(ITEM_SPRITES)) s.items[key] = spriteCanvas(def);
        this.sprites = s;
    }

    ensureBase(scene) {
        if (this.base && this.baseVersion === scene.version) return;
        const v = scene.view;
        this.base = makeCanvas(Math.max(1, v.width * TILE), Math.max(1, v.height * TILE));
        new SectionArtist(v, scene.theme, scene.dungeon ? scene.dungeon.worldX || 0 : 0, scene.dungeon ? scene.dungeon.worldY || 0 : 0)
            .paint(this.base.getContext('2d'), scene.decor);
        this.baseVersion = scene.version;
    }

    render(scene, fx, now, lit) {
        const game = this.game;
        if (!this.sprites) this.buildSprites();
        this.ensureBase(scene);

        const vw = game.camera.viewportWidth, vh = game.camera.viewportHeight;
        const W = vw * TILE, H = vh * TILE;
        if (this.native.width !== W || this.native.height !== H) {
            this.native.width = this.light.width = W;
            this.native.height = this.light.height = H;
        }
        const g = this.native.getContext('2d');
        g.globalCompositeOperation = 'source-over';
        g.globalAlpha = 1;
        g.fillStyle = '#000';
        g.fillRect(0, 0, W, H);

        const cam = fx.cameraPos(now, game);
        const camX = Math.round(cam.x * TILE), camY = Math.round(cam.y * TILE);
        g.drawImage(this.base, camX, camY, W, H, 0, 0, W, H);

        const toX = (tx) => Math.round(tx * TILE) - camX;
        const toY = (ty) => Math.round(ty * TILE) - camY;
        const inView = (x, y) => x >= cam.x - 1 && y >= cam.y - 1 && x <= cam.x + vw && y <= cam.y + vh;
        const art = themeArt(scene.theme);
        const revealed = !!(game.stateManager && game.stateManager.mapRevealed);
        const fov = game.fov;
        const isVisible = (x, y) => revealed || (fov && fov.visible.has(`${x},${y}`));
        const isExplored = (x, y) => revealed || (fov && fov.explored.has(`${x},${y}`));

        // Gates and flames.
        const gates = (game.dungeon && game.dungeon.gates) || [];
        for (const gate of gates) if (inView(gate.x, gate.y)) drawGate(g, toX(gate.x), toY(gate.y), gate, art);
        const decor = scene.decor;
        decor.torches.forEach((t, i) => { if (inView(t.x, t.y)) this.flame(g, toX(t.x) + 8, toY(t.y) + 5, now, i); });
        decor.candles.forEach((t, i) => { if (inView(t.x, t.y)) this.flame(g, toX(t.x) + 8, toY(t.y) + 7, now, i + 7); });

        // Entities, back to front.
        const ents = [];
        const items = (game.itemManager && Array.isArray(game.itemManager.itemsOnGround)) ? game.itemManager.itemsOnGround : [];
        for (const gi of items) {
            if (!gi || !gi.item || !inView(gi.x, gi.y) || !isVisible(gi.x, gi.y)) continue;
            ents.push({ y: gi.y, draw: () => g.drawImage(this.sprites.items[itemVisual(gi.item).sprite] || this.sprites.items.bag, toX(gi.x), toY(gi.y)) });
        }
        for (const c of fx.corpses) {
            if (!inView(c.x, c.y)) continue;
            ents.push({ y: c.y, draw: () => this.drawCorpse(g, c, toX(c.x), toY(c.y), now) });
        }
        const player = game.player;
        (game.monsters || []).forEach((m, i) => {
            if (!inView(m.x, m.y) || !isVisible(m.x, m.y)) return;
            const pos = fx.entityPos(m, now);
            let facing = fx.facing(m);
            if (player && m.x !== player.x) facing = player.x > m.x ? 1 : -1;
            ents.push({ y: pos.y, draw: () => this.drawCharacter(g, m, monsterSpriteKey(m.type), pos, facing, toX, toY, now, i + 1, fx) });
        });
        if (player) {
            const pos = fx.entityPos(player, now);
            ents.push({ y: pos.y + 0.01, draw: () => this.drawCharacter(g, player, 'player', pos, fx.facing(player), toX, toY, now, 0, fx) });
        }
        ents.sort((a, b) => a.y - b.y);
        ents.forEach(e => e.draw());

        this.drawProjectiles(g, fx, toX, toY, now, lit);

        // Fog of war.
        const x0 = Math.floor(cam.x), y0 = Math.floor(cam.y);
        if (!lit) {
            for (let y = y0; y <= y0 + vh; y++) {
                for (let x = x0; x <= x0 + vw; x++) {
                    if (!isExplored(x, y)) { g.fillStyle = '#000'; g.fillRect(toX(x), toY(y), TILE, TILE); }
                    else if (!isVisible(x, y)) { g.fillStyle = 'rgba(8,8,26,0.62)'; g.fillRect(toX(x), toY(y), TILE, TILE); }
                }
            }
        } else {
            this.applyLighting(g, scene, fx, now, cam, camX, camY, W, H, x0, y0, vw, vh, toX, toY, isVisible, isExplored);
        }

        // Damage numbers stay readable above the lighting.
        for (const f of fx.floaters) {
            const k = (now - f.t0) / FLOAT_MS;
            const t = bitmapText(f.text);
            const bx = toX(f.x) + 8 - Math.floor(t.width / 2), by = toY(f.y) - 6 - Math.round(k * 12);
            g.globalAlpha = k < 0.7 ? 1 : (1 - k) / 0.3;
            g.fillStyle = OUTLINE;
            for (const p of t.pixels) g.fillRect(bx + p.x - 1, by + p.y - 1, 3, 3);
            g.fillStyle = f.color;
            for (const p of t.pixels) g.fillRect(bx + p.x, by + p.y, 1, 1);
            g.globalAlpha = 1;
        }

        const out = game.ctx;
        out.imageSmoothingEnabled = false;
        out.drawImage(this.native, 0, 0, game.canvas.width, game.canvas.height);
    }

    drawCharacter(g, entity, key, pos, facing, toX, toY, now, phase, fx) {
        const s = this.sprites;
        const X = toX(pos.x), Y = toY(pos.y);
        g.fillStyle = 'rgba(8,5,16,0.45)';
        g.fillRect(X + 4, Y + 13, 8, 1);
        g.fillRect(X + 3, Y + 14, 10, 2);

        const bob = Math.floor(now / 420 + phase * 0.5) % 2;
        const top = Y - 3 - bob;
        if (!key) {
            // No sprite yet: fall back to the database letter.
            g.font = 'bold 13px monospace';
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.fillStyle = OUTLINE;
            g.fillText(entity.symbol || '?', X + 9, top + 10);
            g.fillStyle = entity.color || '#fff';
            g.fillText(entity.symbol || '?', X + 8, top + 9);
            return;
        }
        const elite = /^Elite /.test(entity.name || '');
        const img = fx.isFlashing(entity, now) ? s.white[key] : elite ? s.elite[key] : s.chars[key];
        g.save();
        g.globalAlpha = s.alpha[key] || 1;
        if (facing < 0) {
            g.translate(X + 16, top);
            g.scale(-1, 1);
            g.drawImage(img, 0, 0);
        } else {
            g.drawImage(img, X, top);
        }
        g.restore();
    }

    drawCorpse(g, c, X, Y, now) {
        const key = monsterSpriteKey(c.kind);
        const k = (now - c.t0) / DEATH_MS;
        if (!key) return;
        const img = k < 0.2 ? this.sprites.white[key] : this.sprites.chars[key];
        g.save();
        g.globalAlpha = Math.max(0, 1 - k);
        if (c.facing < 0) { g.translate(X + 16, Y - 3 + k * 3); g.scale(-1, 1); g.drawImage(img, 0, 0); }
        else g.drawImage(img, X, Y - 3 + k * 3);
        g.restore();
    }

    drawProjectiles(g, fx, toX, toY, now, lit) {
        for (const p of fx.projectileTrails()) {
            if (lit) {
                g.globalCompositeOperation = 'lighter';
                p.trail.forEach((pt, i) => {
                    const a = (i + 1) / p.trail.length;
                    g.globalAlpha = a * 0.7;
                    g.fillStyle = p.color;
                    g.fillRect(toX(pt.x) + 7 + Math.round(Math.sin(i * 1.7 + now / 30) * (1 - a) * 2), toY(pt.y) + 7, 2, 2);
                });
                g.globalAlpha = 1;
                g.globalCompositeOperation = 'source-over';
            }
            const X = toX(p.x), Y = toY(p.y);
            g.fillStyle = OUTLINE;
            g.fillRect(X + 5, Y + 5, 6, 6);
            g.fillStyle = p.color;
            g.fillRect(X + 6, Y + 6, 4, 4);
            g.fillStyle = '#fff';
            g.fillRect(X + 7, Y + 7, 2, 2);
        }
        for (const b of fx.bursts) {
            const k = (now - b.t0) / BURST_MS;
            g.globalAlpha = Math.max(0, 1 - k);
            g.fillStyle = b.color;
            for (let i = 0; i < 12; i++) {
                const ang = (i / 12) * Math.PI * 2 + hash01(i, 3);
                const dist = 2 + k * (6 + hash01(i, 4) * 7);
                g.fillRect(toX(b.x) + 8 + Math.round(Math.cos(ang) * dist), toY(b.y) + 8 + Math.round(Math.sin(ang) * dist), 1, 1);
            }
            g.globalAlpha = 1;
        }
    }

    flame(g, x, y, now, i) {
        const f = Math.floor(now / 110 + i * 3) % 3, h = 4 + f;
        g.fillStyle = '#e05020'; g.fillRect(x - 1, y - h + 2, 3, h - 1);
        g.fillStyle = '#ff9a30'; g.fillRect(x - 1, y - h + 1, 2, h - 2);
        g.fillStyle = '#ffb848'; g.fillRect(x, y - h, 1, h);
        g.fillStyle = '#fff2b0'; g.fillRect(x, y - 2, 1, 2);
    }

    applyLighting(g, scene, fx, now, cam, camX, camY, W, H, x0, y0, vw, vh, toX, toY, isVisible, isExplored) {
        const L = this.light.getContext('2d');
        L.globalCompositeOperation = 'source-over';
        L.fillStyle = '#4a4464';
        L.fillRect(0, 0, W, H);
        L.globalCompositeOperation = 'lighter';
        const lights = collectLights(this.game, scene, fx, now);
        for (const l of lights) {
            const lx = l.x * TILE - camX, ly = l.y * TILE - camY, r = l.r * TILE;
            if (lx + r < 0 || ly + r < 0 || lx - r > W || ly - r > H) continue;
            const gr = L.createRadialGradient(lx, ly, 0, lx, ly, r);
            gr.addColorStop(0, `rgba(${l.c},${l.i})`);
            gr.addColorStop(0.45, `rgba(${l.c},${l.i * 0.5})`);
            gr.addColorStop(1, `rgba(${l.c},0)`);
            L.fillStyle = gr;
            L.fillRect(lx - r, ly - r, r * 2, r * 2);
        }
        L.globalCompositeOperation = 'source-over';
        for (let y = y0; y <= y0 + vh; y++) {
            for (let x = x0; x <= x0 + vw; x++) {
                if (!isExplored(x, y)) { L.fillStyle = '#000'; L.fillRect(toX(x), toY(y), TILE, TILE); }
                else if (!isVisible(x, y)) { L.fillStyle = 'rgba(10,8,20,0.6)'; L.fillRect(toX(x), toY(y), TILE, TILE); }
            }
        }
        g.globalCompositeOperation = 'multiply';
        g.drawImage(this.light, 0, 0);

        // Glows and particles on top.
        g.globalCompositeOperation = 'lighter';
        const t = now / 1000;
        const d = scene.decor;
        const inView = (p) => p.x >= x0 - 1 && p.y >= y0 - 1 && p.x <= x0 + vw + 1 && p.y <= y0 + vh + 1;
        d.torches.forEach((p, i) => {
            if (!inView(p) || !isExplored(p.x, p.y)) return;
            const cx = toX(p.x) + 8, cy = toY(p.y) + 3;
            const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 9);
            gr.addColorStop(0, `rgba(255,170,80,${0.55 * flicker(now, i)})`);
            gr.addColorStop(1, 'rgba(255,120,40,0)');
            g.fillStyle = gr;
            g.fillRect(cx - 9, cy - 9, 18, 18);
            for (let k = 0; k < 6; k++) {
                const ph = (t / 1.5 + k / 6 + i * 0.13) % 1;
                g.fillStyle = `rgba(255,${140 + k * 14},60,${(1 - ph) * 0.9})`;
                g.fillRect(Math.round(cx + Math.sin(k * 12.9 + ph * 7) * 3 * ph), Math.round(cy - 3 - ph * 22), 1, 1);
            }
        });
        d.candles.forEach((p, i) => {
            if (!inView(p) || !isExplored(p.x, p.y)) return;
            const cx = toX(p.x) + 8, cy = toY(p.y) + 5;
            const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 7);
            gr.addColorStop(0, `rgba(255,210,130,${0.5 * flicker(now, i + 7)})`);
            gr.addColorStop(1, 'rgba(255,180,90,0)');
            g.fillStyle = gr;
            g.fillRect(cx - 7, cy - 7, 14, 14);
        });
        d.mushrooms.forEach((p, i) => {
            if (!inView(p) || !isExplored(p.x, p.y)) return;
            const cx = toX(p.x) + 9, cy = toY(p.y) + 10;
            const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 10);
            gr.addColorStop(0, 'rgba(60,230,205,0.35)');
            gr.addColorStop(1, 'rgba(60,230,205,0)');
            g.fillStyle = gr;
            g.fillRect(cx - 10, cy - 10, 20, 20);
            for (let k = 0; k < 3; k++) {
                const ph = (t / 3.2 + k / 3 + i * 0.21) % 1;
                g.fillStyle = `rgba(110,255,230,${(1 - ph) * 0.8})`;
                g.fillRect(Math.round(cx - 4 + k * 4 + Math.sin(ph * 6 + k) * 2), Math.round(cy - ph * 18), 1, 1);
            }
        });
        // Dust in the player's light.
        const player = this.game.player;
        if (player) {
            const pp = fx.entityPos(player, now);
            const pcx = toX(pp.x) + 8, pcy = toY(pp.y) + 8;
            for (let k = 0; k < 14; k++) {
                const ph = (t / 9 + hash01(k, 1, 2)) % 1;
                const mx = pcx + (hash01(k, 3, 4) - 0.5) * 150 + Math.sin(t * 0.7 + k) * 6;
                const my = pcy + (hash01(k, 5, 6) - 0.5) * 120 - ph * 30;
                const dist = Math.hypot(mx - pcx, my - pcy);
                const a = Math.max(0, 1 - dist / 90) * 0.5 * Math.sin(ph * Math.PI);
                if (a > 0.02) { g.fillStyle = `rgba(255,236,200,${a})`; g.fillRect(Math.round(mx), Math.round(my), 1, 1); }
            }
        }
        g.globalCompositeOperation = 'source-over';

        const v = g.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.65);
        v.addColorStop(0, 'rgba(0,0,0,0)');
        v.addColorStop(1, 'rgba(0,0,0,0.4)');
        g.fillStyle = v;
        g.fillRect(0, 0, W, H);
    }
}
