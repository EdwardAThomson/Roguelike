// Turn feedback for the ASCII and 16-bit renderers: smooth movement, attack
// lunges, hit flashes, floating damage numbers, death fades and projectile
// impacts.
//
// The tracker only OBSERVES game state once per frame (positions, health,
// which monsters and projectiles exist) and never writes to it, so it cannot
// change how the game plays. Game logic still resolves instantly each turn;
// the motion plays over the top.

export const MOVE_MS = 110;
export const LUNGE_MS = 170;
export const FLASH_MS = 120;
export const FLOAT_MS = 900;
export const DEATH_MS = 450;
export const BURST_MS = 380;

const smooth = (p) => p * p * (3 - 2 * p);
const chebyshev = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

export class EffectsTracker {
    constructor() {
        this.reset(null);
    }

    reset(dungeon) {
        this.dungeon = dungeon;
        this.tracks = new Map();      // entity -> track
        this.projectiles = new Map(); // projectile -> { x, y, color, trail }
        this.floaters = [];
        this.bursts = [];
        this.corpses = [];
        this.camera = null;
    }

    update(game, now) {
        // A new section starts clean: no tweening across the transition.
        if (game.dungeon !== this.dungeon) this.reset(game.dungeon);
        const player = game.player;
        if (!player) return;

        const monsters = game.monsters || [];
        const activeProjectiles = this.observeProjectiles(game, now);
        const live = new Set();

        const observe = (entity, isPlayer) => {
            live.add(entity);
            let t = this.tracks.get(entity);
            if (!t) {
                this.tracks.set(entity, {
                    x: entity.x, y: entity.y, fromX: entity.x, fromY: entity.y, moveT0: -Infinity,
                    hp: entity.health, flashT: -Infinity, lungeT: -Infinity, ldx: 0, ldy: 0,
                    facing: 1, isPlayer, kind: entity.type, elite: !isPlayer && /^Elite /.test(entity.name || '')
                });
                return;
            }

            if (entity.x !== t.x || entity.y !== t.y) {
                const step = chebyshev(entity, t);
                if (step <= 1) {
                    const cur = this.basePos(t, now);
                    t.fromX = cur.x;
                    t.fromY = cur.y;
                    t.moveT0 = now;
                } else {
                    t.moveT0 = -Infinity; // teleport or section entry: snap
                }
                if (entity.x !== t.x) t.facing = entity.x > t.x ? 1 : -1;
                t.x = entity.x;
                t.y = entity.y;
            }

            if (typeof entity.health === 'number' && typeof t.hp === 'number' && entity.health !== t.hp) {
                const delta = entity.health - t.hp;
                if (delta < 0) {
                    t.flashT = now;
                    this.floaters.push({
                        text: String(-delta), color: isPlayer ? '#ff6060' : '#ffe070',
                        x: entity.x, y: entity.y, t0: now
                    });
                    if (!activeProjectiles) this.lungeAt(entity, isPlayer, player, monsters, now);
                } else {
                    this.floaters.push({ text: '+' + delta, color: '#70ff90', x: entity.x, y: entity.y, t0: now });
                }
                t.hp = entity.health;
            }
        };

        observe(player, true);
        for (const m of monsters) observe(m, false);

        for (const [entity, t] of this.tracks) {
            if (live.has(entity)) continue;
            if (!t.isPlayer && (entity.health <= 0 || t.hp <= 0)) {
                this.corpses.push({ kind: t.kind, elite: t.elite, x: t.x, y: t.y, facing: t.facing, t0: now });
            }
            this.tracks.delete(entity);
        }

        this.updateCamera(game, now);
        this.floaters = this.floaters.filter(f => now - f.t0 < FLOAT_MS);
        this.bursts = this.bursts.filter(b => now - b.t0 < BURST_MS);
        this.corpses = this.corpses.filter(c => now - c.t0 < DEATH_MS);
    }

    // Melee only: whoever is adjacent to the hurt entity steps into it.
    lungeAt(target, targetIsPlayer, player, monsters, now) {
        let attacker = null;
        if (!targetIsPlayer) {
            if (chebyshev(player, target) === 1) attacker = player;
        } else {
            attacker = monsters.find(m => chebyshev(m, player) === 1) || null;
        }
        if (!attacker) return;
        const t = this.tracks.get(attacker);
        if (!t) return;
        t.lungeT = now;
        t.ldx = Math.sign(target.x - attacker.x);
        t.ldy = Math.sign(target.y - attacker.y);
        if (t.ldx) t.facing = t.ldx;
    }

    observeProjectiles(game, now) {
        const pm = game.projectileManager;
        const list = pm && typeof pm.getActiveProjectiles === 'function' ? pm.getActiveProjectiles() : [];
        const seen = new Set(list);
        for (const p of list) {
            const pos = typeof p.getPosition === 'function' ? p.getPosition() : { x: p.x, y: p.y };
            let rec = this.projectiles.get(p);
            if (!rec) {
                rec = { trail: [] };
                this.projectiles.set(p, rec);
            }
            rec.x = pos.x;
            rec.y = pos.y;
            rec.color = p.color || '#9cd0ff';
            rec.trail.push({ x: pos.x, y: pos.y });
            if (rec.trail.length > 10) rec.trail.shift();
        }
        for (const [p, rec] of this.projectiles) {
            if (seen.has(p)) continue;
            this.bursts.push({ x: rec.x, y: rec.y, color: rec.color, t0: now });
            this.projectiles.delete(p);
        }
        return list.length > 0;
    }

    updateCamera(game, now) {
        const cam = game.camera;
        if (!cam) return;
        if (!this.camera) {
            this.camera = { x: cam.x, y: cam.y, fromX: cam.x, fromY: cam.y, t0: -Infinity };
            return;
        }
        const c = this.camera;
        if (cam.x !== c.x || cam.y !== c.y) {
            const cur = this.cameraPos(now);
            const far = Math.abs(cam.x - c.x) > 2 || Math.abs(cam.y - c.y) > 2;
            c.fromX = cur.x;
            c.fromY = cur.y;
            c.t0 = far ? -Infinity : now;
            c.x = cam.x;
            c.y = cam.y;
        }
    }

    basePos(t, now) {
        const p = (now - t.moveT0) / MOVE_MS;
        if (p >= 1) return { x: t.x, y: t.y };
        const k = smooth(Math.max(0, p));
        return { x: t.fromX + (t.x - t.fromX) * k, y: t.fromY + (t.y - t.fromY) * k };
    }

    // Where to draw an entity, in fractional tile coordinates.
    entityPos(entity, now) {
        const t = this.tracks.get(entity);
        if (!t) return { x: entity.x, y: entity.y };
        const pos = this.basePos(t, now);
        const lp = (now - t.lungeT) / LUNGE_MS;
        if (lp >= 0 && lp < 1) {
            const a = Math.sin(lp * Math.PI) * 0.3;
            pos.x += t.ldx * a;
            pos.y += t.ldy * a;
        }
        return pos;
    }

    isFlashing(entity, now) {
        const t = this.tracks.get(entity);
        return !!t && now - t.flashT < FLASH_MS;
    }

    facing(entity) {
        const t = this.tracks.get(entity);
        return t ? t.facing : 1;
    }

    cameraPos(now, game = null) {
        const c = this.camera;
        if (!c) return game && game.camera ? { x: game.camera.x, y: game.camera.y } : { x: 0, y: 0 };
        const p = (now - c.t0) / MOVE_MS;
        if (p >= 1) return { x: c.x, y: c.y };
        const k = smooth(Math.max(0, p));
        return { x: c.fromX + (c.x - c.fromX) * k, y: c.fromY + (c.y - c.fromY) * k };
    }

    projectileTrails() {
        return [...this.projectiles.values()];
    }
}
