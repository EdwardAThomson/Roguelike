import { describe, it, expect } from 'vitest';
import { bootFakeGame } from '../helpers/fakeGame.js';
import {
    buildWorldMapModel,
    getSectionSnapshot,
    describeGates,
    parseSectionId
} from '../../src/js/modules/ui/worldMapModel.js';

// The map screen (M) reads the world from live managers. These cover the data
// side headlessly; the canvas drawing is exercised by the e2e spec.

describe('world map model', () => {
    it('starts with the origin section and its four unvisited neighbours', () => {
        const game = bootFakeGame();
        const model = buildWorldMapModel(game);

        expect(model.sections.map(s => s.id)).toEqual(['0_0']);
        expect(model.current.id).toBe('0_0');
        expect(model.current.isOrigin).toBe(true);
        expect(model.current.theme).toBe('castle');
        expect(model.frontier.map(f => f.id).sort()).toEqual(['-1_0', '0_-1', '0_1', '1_0']);
        expect(model.links).toEqual([]);
        expect(model.bounds).toEqual({ minX: -1, maxX: 1, minY: -1, maxY: 1 });
    });

    it('reads the live section from game.dungeon / fov, not sectionStates', () => {
        const game = bootFakeGame();
        const snapshot = getSectionSnapshot(game, '0_0');

        expect(game.worldManager.sectionStates['0_0']).toBeUndefined();
        expect(snapshot.tiles).toBe(game.dungeon.tiles);
        expect(snapshot.explored).toBe(game.fov.explored);
        expect(snapshot.explored.size).toBeGreaterThan(0);
    });

    it('tracks visited sections, links and the frontier across transitions', () => {
        const game = bootFakeGame();
        game.worldManager.transitionToSection(1, 0, 'east');
        game.worldManager.transitionToSection(1, 1, 'north');

        const model = buildWorldMapModel(game);
        const ids = model.sections.map(s => s.id).sort();
        expect(ids).toEqual(['0_0', '1_0', '1_1']);
        expect(model.current.id).toBe('1_1');

        // Departed sections come from sectionStates with their own memory.
        const origin = model.sections.find(s => s.id === '0_0');
        expect(origin.isCurrent).toBe(false);
        expect(origin.tiles).toBe(game.worldManager.sectionStates['0_0'].dungeon.tiles);
        expect(origin.explored).toBe(game.worldManager.explorationMemory['0_0']);

        // Adjacent visited pairs are linked once, from the west / south end.
        const linkKeys = model.links.map(l => `${l.from}>${l.to}`).sort();
        expect(linkKeys).toEqual(['0_0>1_0', '1_0>1_1']);

        // No visited section is also on the frontier, and every frontier
        // entry touches a visited section.
        const visited = new Set(ids);
        for (const f of model.frontier) {
            expect(visited.has(f.id)).toBe(false);
            const touches = model.sections.some(s => Math.abs(s.x - f.x) + Math.abs(s.y - f.y) === 1);
            expect(touches).toBe(true);
        }
        // Difficulty grows with distance from the origin.
        expect(model.sections.find(s => s.id === '1_1').difficulty).toBe(2);
    });

    it('marks a frontier section seen once its gate has been explored', () => {
        const game = bootFakeGame();
        const westGate = game.dungeon.gates.find(g => g.direction === 'west');
        game.fov.explored.delete(`${westGate.x},${westGate.y}`);
        expect(buildWorldMapModel(game).frontier.find(f => f.id === '-1_0').seen).toBe(false);

        game.fov.explored.add(`${westGate.x},${westGate.y}`);
        expect(buildWorldMapModel(game).frontier.find(f => f.id === '-1_0').seen).toBe(true);
    });

    it('describes where each gate leads, with north = worldY + 1', () => {
        const game = bootFakeGame();
        game.worldManager.transitionToSection(1, 0, 'east');
        const gates = describeGates(game, getSectionSnapshot(game, '1_0'));

        const byDirection = Object.fromEntries(gates.map(g => [g.direction, g]));
        expect(byDirection.west.targetId).toBe('0_0');
        expect(byDirection.west.visited).toBe(true);
        expect(byDirection.north.target).toEqual(parseSectionId('1_1'));
        expect(byDirection.north.visited).toBe(false);
        expect(byDirection.south.targetId).toBe('1_-1');
    });

    it('treats every tile as explored while the map-reveal cheat is on', () => {
        const game = bootFakeGame();
        game.stateManager.toggleMapReveal();
        const model = buildWorldMapModel(game);
        expect(model.frontier.every(f => f.seen)).toBe(true);
    });
});
