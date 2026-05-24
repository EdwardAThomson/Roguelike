import { describe, it, expect } from 'vitest';
import { Monster } from '../src/js/modules/entity/monster.js';

// Build a fake game from an ASCII map. '#' = wall, anything else = floor.
// Rows are indexed [y][x] to match the engine's map layout.
function makeGame(rows, { player = { x: 0, y: 0 }, monsters = [] } = {}) {
    const map = rows.map(row => [...row].map(c => (c === '#' ? 'wall' : 'floor')));
    return {
        gridHeight: rows.length,
        gridWidth: rows[0].length,
        map,
        player,
        monsters
    };
}

describe('getDistanceToPlayer (Chebyshev)', () => {
    it('counts a diagonal as a single tile', () => {
        const m = new Monster(0, 0);
        expect(m.getDistanceToPlayer({ x: 2, y: 2 })).toBe(2);
    });

    it('returns the larger axis delta', () => {
        const m = new Monster(0, 0);
        expect(m.getDistanceToPlayer({ x: 3, y: 1 })).toBe(3);
    });
});

describe('findPath', () => {
    it('finds a straight path on open floor', () => {
        const game = makeGame(['.....']);
        const m = new Monster(0, 0);
        const path = m.findPath(0, 0, 4, 0, game);
        expect(path).not.toBeNull();
        expect(path[0]).toEqual({ x: 0, y: 0 });
        expect(path[path.length - 1]).toEqual({ x: 4, y: 0 });
        // Chebyshev-optimal straight line: start + 4 steps
        expect(path).toHaveLength(5);
    });

    it('uses diagonals when the grid is open', () => {
        const game = makeGame(['...', '...', '...']);
        const m = new Monster(0, 0);
        const path = m.findPath(0, 0, 2, 2, game);
        // Diagonal moves cost 1, so the optimal path is start + 2 diagonal steps
        expect(path).toHaveLength(3);
    });

    it('routes around a wall through the only gap', () => {
        // A full-height wall in column 2 with a single opening at row 1.
        const game = makeGame([
            '..#..',
            '.....', // gap in the wall is here (column 2 is floor on this row)
            '..#..'
        ]);
        // Re-close column 2 except the middle so there is exactly one gap.
        game.map[0][2] = 'wall';
        game.map[2][2] = 'wall';
        const m = new Monster(0, 0);
        const path = m.findPath(0, 0, 4, 0, game);
        expect(path).not.toBeNull();
        // Every step must be a floor tile and 8-connected to the previous one.
        for (let i = 0; i < path.length; i++) {
            const { x, y } = path[i];
            expect(game.map[y][x]).toBe('floor');
            if (i > 0) {
                const prev = path[i - 1];
                expect(Math.max(Math.abs(x - prev.x), Math.abs(y - prev.y))).toBe(1);
            }
        }
        // It must pass through the gap at (2,1).
        expect(path.some(p => p.x === 2 && p.y === 1)).toBe(true);
    });

    it('returns null when the goal is walled off', () => {
        // (2,2) is enclosed on all 8 sides, so even diagonal moves can't reach it.
        const game = makeGame([
            '.....',
            '.###.',
            '.#.#.',
            '.###.',
            '.....'
        ]);
        const m = new Monster(0, 0);
        expect(m.findPath(0, 0, 2, 2, game)).toBeNull();
    });

    it('returns null when the goal is out of bounds', () => {
        const game = makeGame(['...']);
        const m = new Monster(0, 0);
        expect(m.findPath(0, 0, 9, 9, game)).toBeNull();
    });
});

describe('canMoveTo', () => {
    const game = makeGame(['...', '.#.', '...'], { player: { x: 2, y: 2 } });

    it('rejects out-of-bounds tiles', () => {
        expect(new Monster(0, 0).canMoveTo(-1, 0, game)).toBe(false);
    });

    it('rejects wall tiles', () => {
        expect(new Monster(0, 0).canMoveTo(1, 1, game)).toBe(false);
    });

    it('rejects the tile occupied by the player', () => {
        expect(new Monster(0, 0).canMoveTo(2, 2, game)).toBe(false);
    });

    it('rejects a tile occupied by another monster', () => {
        const other = new Monster(1, 0);
        const g = { ...game, monsters: [other] };
        expect(new Monster(0, 0).canMoveTo(1, 0, g)).toBe(false);
    });

    it('accepts a free floor tile', () => {
        expect(new Monster(0, 0).canMoveTo(0, 1, game)).toBe(true);
    });
});

describe('moveToward', () => {
    it('steps one tile closer to the target on open floor', () => {
        const game = makeGame(['.....'], { player: { x: 4, y: 0 } });
        const m = new Monster(0, 0);
        const before = m.getDistanceToPlayer(game.player);
        m.moveToward(game, 4, 0);
        expect(m.getDistanceToPlayer(game.player)).toBe(before - 1);
    });

    it('moves toward the gap when a wall blocks the direct route', () => {
        const game = makeGame([
            '..#..',
            '.....',
            '..#..'
        ], { player: { x: 4, y: 0 } });
        game.map[0][2] = 'wall';
        game.map[2][2] = 'wall';
        const m = new Monster(0, 0);
        m.moveToward(game, 4, 0);
        // The greedy approach would stall at the wall; A* should make real progress
        // toward the gap rather than staying put.
        expect(`${m.x},${m.y}`).not.toBe('0,0');
    });
});

describe('fleeFrom', () => {
    it('increases distance from the threat', () => {
        const game = makeGame(['.....'], { player: { x: 0, y: 0 } });
        const m = new Monster(2, 0);
        const before = Math.max(Math.abs(m.x - 0), Math.abs(m.y - 0));
        m.fleeFrom(game, 0, 0);
        const after = Math.max(Math.abs(m.x - 0), Math.abs(m.y - 0));
        expect(after).toBeGreaterThan(before);
    });

    it('stays put when boxed in with no safer tile', () => {
        // Monster at (1,0) with walls on either side and the threat directly below.
        const game = makeGame(['#.#', '...']);
        const m = new Monster(1, 0);
        m.fleeFrom(game, 1, 1);
        // Only escape would be sideways into walls, so it should not teleport away.
        expect(m.y).toBe(0);
    });
});
