import { describe, it, expect } from 'vitest';
import { bootFakeGame } from '../helpers/fakeGame.js';
import { SectionScene, collectLights } from '../../src/js/modules/render/sectionScene.js';
import { EffectsTracker } from '../../src/js/modules/render/effects.js';

// The renderer's per-section data comes from a real generated section, and
// observing a real combat turn must not change the turn's outcome.

describe('section scene on a real section', () => {
    it('builds deterministic decoration that sits on walls and floors only', () => {
        const game = bootFakeGame();
        const a = new SectionScene(), b = new SectionScene();
        expect(a.sync(game)).toBe(true);
        expect(a.sync(game)).toBe(false); // cached until the map changes
        b.sync(game);
        expect(JSON.stringify(a.decor.torches)).toBe(JSON.stringify(b.decor.torches));
        for (const t of a.decor.torches) {
            expect(game.map[t.y][t.x]).toBe('wall');
            expect(game.map[t.y + 1][t.x]).toBe('floor');
        }
        for (const c of [...a.decor.candles, ...a.decor.mushrooms, ...a.decor.bones]) {
            expect(game.map[c.y][c.x]).toBe('floor');
        }
        const lights = collectLights(game, a, null, 0);
        expect(lights[0]).toEqual(expect.objectContaining({ x: game.player.x + 0.5 }));
    });

    it('rebuilds when a tile changes', () => {
        const game = bootFakeGame();
        const scene = new SectionScene();
        scene.sync(game);
        const v = scene.version;
        const row = game.map.findIndex(r => r.includes('wall'));
        game.map[row][game.map[row].indexOf('wall')] = 'floor';
        expect(scene.sync(game)).toBe(true);
        expect(scene.version).toBe(v + 1);
    });

    it('observing a melee turn leaves the result unchanged', () => {
        const game = bootFakeGame();
        const rat = game.monsterDB.createMonster('rat', game.player.x + 1, game.player.y);
        game.monsters = [rat];
        const fx = new EffectsTracker();
        fx.update(game, 0);
        game.combat.handlePlayerAttack(rat.x, rat.y);
        const after = JSON.stringify({ hp: rat.health, php: game.player.health, x: game.player.x, n: game.monsters.length });
        fx.update(game, 16);
        expect(JSON.stringify({ hp: rat.health, php: game.player.health, x: game.player.x, n: game.monsters.length })).toBe(after);
        expect(fx.floaters.length).toBeGreaterThan(0);
    });
});
