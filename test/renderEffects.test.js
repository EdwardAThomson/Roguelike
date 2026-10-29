import { describe, it, expect } from 'vitest';
import { EffectsTracker, MOVE_MS, LUNGE_MS, FLOAT_MS, DEATH_MS } from '../src/js/modules/render/effects.js';

function world() {
    const dungeon = {};
    const player = { x: 5, y: 5, health: 50 };
    const rat = { x: 6, y: 5, health: 20, type: 'rat', name: 'Giant Rat' };
    const projectiles = [];
    return {
        dungeon, player, monsters: [rat], camera: { x: 0, y: 0 },
        projectileManager: { getActiveProjectiles: () => projectiles },
        rat, projectiles
    };
}

describe('EffectsTracker', () => {
    it('slides one-tile moves and snaps long jumps', () => {
        const g = world();
        const fx = new EffectsTracker();
        fx.update(g, 0);
        g.player.x = 6; g.player.y = 6;
        fx.update(g, 1000);
        const mid = fx.entityPos(g.player, 1000 + MOVE_MS / 2);
        expect(mid.x).toBeGreaterThan(5);
        expect(mid.x).toBeLessThan(6);
        expect(fx.entityPos(g.player, 1000 + MOVE_MS)).toEqual({ x: 6, y: 6 });

        g.player.x = 20;
        fx.update(g, 2000);
        expect(fx.entityPos(g.player, 2001)).toEqual({ x: 20, y: 6 });
    });

    it('turns a melee hit into a flash, a damage number and a lunge by the attacker', () => {
        const g = world();
        const fx = new EffectsTracker();
        fx.update(g, 0);
        g.rat.health = 14;
        fx.update(g, 100);
        expect(fx.isFlashing(g.rat, 150)).toBe(true);
        expect(fx.floaters).toEqual([expect.objectContaining({ text: '6', x: 6, y: 5 })]);
        const lunge = fx.entityPos(g.player, 100 + LUNGE_MS / 2);
        expect(lunge.x).toBeGreaterThan(5); // toward the rat
        expect(fx.facing(g.player)).toBe(1);
        fx.update(g, 100 + FLOAT_MS + 1);
        expect(fx.floaters).toHaveLength(0);
    });

    it('does not lunge when a projectile did the damage, and bursts where it ended', () => {
        const g = world();
        const fx = new EffectsTracker();
        const bolt = { color: '#88f', getPosition: () => ({ x: 6, y: 5 }) };
        g.projectiles.push(bolt);
        fx.update(g, 0);
        g.rat.health = 10;
        fx.update(g, 50);
        expect(fx.entityPos(g.player, 50 + LUNGE_MS / 2)).toEqual({ x: 5, y: 5 });
        g.projectiles.length = 0;
        fx.update(g, 80);
        expect(fx.bursts).toEqual([expect.objectContaining({ x: 6, y: 5, color: '#88f' })]);
    });

    it('fades out a monster that died and leaves', () => {
        const g = world();
        const fx = new EffectsTracker();
        fx.update(g, 0);
        g.rat.health = 0;
        g.monsters = [];
        fx.update(g, 10);
        expect(fx.corpses).toEqual([expect.objectContaining({ kind: 'rat', x: 6, y: 5 })]);
        fx.update(g, 10 + DEATH_MS + 1);
        expect(fx.corpses).toHaveLength(0);
    });

    it('starts clean in a new section and never writes to game state', () => {
        const g = world();
        const fx = new EffectsTracker();
        fx.update(g, 0);
        g.rat.health = 5;
        const snapshot = JSON.stringify({ p: g.player, m: g.monsters, c: g.camera });
        g.dungeon = {};
        fx.update(g, 10);
        expect(fx.floaters).toHaveLength(0);
        expect(JSON.stringify({ p: g.player, m: g.monsters, c: g.camera })).toBe(snapshot);
    });
});
