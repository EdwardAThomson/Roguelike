import { describe, it, expect } from 'vitest';
import { bootFakeGame } from '../helpers/fakeGame.js';

// End-to-end: theme selection → spawn filter → real monster placement.
// This is what the unit tests in dungeonTheme.test.js *don't* cover: the
// theme actually being threaded through worldManager → combatManager →
// monsterDatabase, and monsters getting placed on the real map.

function spawnUnderTheme(theme, count, difficulty) {
    const game = bootFakeGame();
    game.monsters = []; // clear the boot spawn — we want a controlled batch
    game.dungeon.theme = theme;
    game.combat.spawnMonsters(count, difficulty, theme);
    return game;
}

describe('theme threads all the way through to actual spawns', () => {
    it('a cave section only spawns cave-tagged monsters', () => {
        const game = spawnUnderTheme('cave', 30, 4);
        expect(game.monsters.length).toBe(30);
        for (const m of game.monsters) {
            const type = game.monsterDB.monsterTypes[m.type];
            expect(type.themes).toContain('cave');
        }
    });

    it('a crypt section at difficulty 4 can spawn the Wraith', () => {
        const game = spawnUnderTheme('crypt', 60, 4);
        // Every spawn must be crypt-tagged.
        for (const m of game.monsters) {
            const type = game.monsterDB.monsterTypes[m.type];
            expect(type.themes).toContain('crypt');
        }
        // Wraith is the only L4 crypt monster; across 60 rolls we should see it.
        const types = new Set(game.monsters.map(m => m.type));
        expect(types.has('wraith')).toBe(true);
    });

    it('placed monsters are on floor tiles and not stacked on the player', () => {
        const game = spawnUnderTheme('castle', 20, 3);
        for (const m of game.monsters) {
            expect(game.map[m.y][m.x]).toBe('floor');
            expect(m.x === game.player.x && m.y === game.player.y).toBe(false);
        }
    });
});
