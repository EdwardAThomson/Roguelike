import { describe, it, expect } from 'vitest';
import { bootFakeGame } from '../helpers/fakeGame.js';

describe('booting the first section (0_0)', () => {
    const game = bootFakeGame();

    it('produces a dungeon, player, and non-empty map', () => {
        expect(game.dungeon).toBeDefined();
        expect(game.dungeon.rooms.length).toBeGreaterThan(0);
        expect(game.player).toBeDefined();
        expect(game.map.length).toBe(game.gridHeight);
        expect(game.map[0].length).toBe(game.gridWidth);
    });

    it("pins the starting section's theme to castle", () => {
        expect(game.dungeon.theme).toBe('castle');
    });

    it('places the player on a floor tile inside the map', () => {
        const { x, y } = game.player;
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(game.gridWidth);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThan(game.gridHeight);
        expect(game.map[y][x]).toBe('floor');
    });

    it('spawns 8 monsters, all on floor tiles and not stacked on the player', () => {
        expect(game.monsters.length).toBe(8);
        for (const m of game.monsters) {
            expect(m.x).toBeGreaterThanOrEqual(0);
            expect(m.x).toBeLessThan(game.gridWidth);
            expect(m.y).toBeGreaterThanOrEqual(0);
            expect(m.y).toBeLessThan(game.gridHeight);
            expect(game.map[m.y][m.x]).toBe('floor');
            expect(m.x === game.player.x && m.y === game.player.y).toBe(false);
        }
    });

    it('gives the player Magic Dart in the first spell slot', () => {
        const slot0 = game.player.spellbook.getSpellInSlot(0);
        expect(slot0).toBeDefined();
        expect(slot0.id).toBe('magic_dart');
    });

    it('populates FOV around the player after the initial update', () => {
        // FOV.update runs during boot; the player's own tile is always visible.
        const key = `${game.player.x},${game.player.y}`;
        expect(game.fov.visible.has(key)).toBe(true);
    });
});
