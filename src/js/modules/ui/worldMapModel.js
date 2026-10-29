// Pure data layer for the world map (M). Reads the live game and returns
// plain objects describing what the player knows about the world, so the
// canvas code in mapUI.js only draws and this half can be unit-tested
// headlessly.
//
// The world is pseudo-infinite: sections are generated on demand at integer
// (worldX, worldY) coordinates, with north = worldY + 1 (see
// Dungeon.placeConstrainedGates). The model therefore only ever covers the
// finite set of VISITED sections plus their unvisited neighbours (the
// "frontier"); the renderer pans and zooms over that.

import { pickThemeForSection } from '../worldManager.js';

// Flattened map colours per theme. Values mirror the 16-bit terrain palette
// (render/tileArt.js TILE_THEMES on the graphics branch) so the map reads as
// the same world as the play view.
export const MAP_THEME_COLORS = {
    castle: { wall: '#555a7a', wallDark: '#2f3146', floor: '#4a4c62', accent: '#d6a640', label: 'Castle' },
    cave:   { wall: '#7e6249', wallDark: '#2c221a', floor: '#43352a', accent: '#b0835a', label: 'Cave' },
    crypt:  { wall: '#554d6e', wallDark: '#241f31', floor: '#353046', accent: '#8e7cc0', label: 'Crypt' }
};

export function mapThemeColors(theme) {
    return MAP_THEME_COLORS[theme] || MAP_THEME_COLORS.castle;
}

export function parseSectionId(id) {
    const [x, y] = String(id).split('_').map(Number);
    return { x, y };
}

export function sectionIdOf(x, y) {
    return `${x}_${y}`;
}

// Neighbour offsets in world coordinates, keyed by gate direction.
export const DIRECTION_OFFSETS = {
    north: { dx: 0, dy: 1 },
    south: { dx: 0, dy: -1 },
    east: { dx: 1, dy: 0 },
    west: { dx: -1, dy: 0 }
};

/**
 * Everything the map needs about one visited section. The current section is
 * read from the live game (game.dungeon / game.fov) because the live section
 * is not in worldManager.sectionStates until the player leaves it.
 */
export function getSectionSnapshot(game, sectionId) {
    const wm = game.worldManager;
    if (!wm) return null;
    const { x, y } = parseSectionId(sectionId);
    const isCurrent = sectionId === wm.currentSectionId;

    let dungeon = null;
    if (isCurrent && game.dungeon) {
        dungeon = game.dungeon;
    } else if (wm.sectionStates && wm.sectionStates[sectionId]) {
        dungeon = wm.sectionStates[sectionId].dungeon || null;
    }

    const explored = (isCurrent && game.fov && game.fov.explored)
        ? game.fov.explored
        : (wm.explorationMemory && wm.explorationMemory[sectionId]) || new Set();

    return {
        id: sectionId,
        x,
        y,
        isCurrent,
        isOrigin: x === 0 && y === 0,
        theme: (dungeon && dungeon.theme) || pickThemeForSection(x, y),
        difficulty: (wm.sectionDifficulty && wm.sectionDifficulty[sectionId]) || 1,
        tiles: dungeon ? dungeon.tiles : null,
        gates: dungeon ? (dungeon.gates || []) : [],
        explored,
        revealed: !!(game.stateManager && game.stateManager.mapRevealed)
    };
}

export function isExplored(snapshot, x, y) {
    return snapshot.revealed || snapshot.explored.has(`${x},${y}`);
}

/**
 * The known world: visited sections, the frontier of unvisited neighbours,
 * links between adjacent visited sections, and the bounding box of it all
 * (in world coordinates) for fit-to-view.
 *
 * A frontier section is `seen` when the player has explored the gate that
 * leads to it, i.e. they know the way there.
 */
export function buildWorldMapModel(game) {
    const wm = game.worldManager;
    const empty = { sections: [], frontier: [], links: [], current: null, bounds: null };
    if (!wm) return empty;

    const visitedIds = new Set(wm.visitedSections || []);
    visitedIds.add(wm.currentSectionId);

    const sections = [...visitedIds].map(id => getSectionSnapshot(game, id)).filter(Boolean);
    const byId = new Map(sections.map(s => [s.id, s]));

    const frontier = new Map();
    const links = [];
    for (const s of sections) {
        for (const [direction, { dx, dy }] of Object.entries(DIRECTION_OFFSETS)) {
            const nx = s.x + dx;
            const ny = s.y + dy;
            const nid = sectionIdOf(nx, ny);
            const gate = s.gates.find(g => g.direction === direction) || null;
            const gateSeen = !!gate && isExplored(s, gate.x, gate.y);

            if (byId.has(nid)) {
                // Record each link once, from its west / south end.
                if (direction === 'east' || direction === 'north') {
                    links.push({ from: s.id, to: nid, direction, gate, gateSeen });
                }
                continue;
            }

            const entry = frontier.get(nid) || { id: nid, x: nx, y: ny, seen: false };
            entry.seen = entry.seen || gateSeen;
            frontier.set(nid, entry);
        }
    }

    const all = [...sections, ...frontier.values()];
    const bounds = all.length ? {
        minX: Math.min(...all.map(s => s.x)),
        maxX: Math.max(...all.map(s => s.x)),
        minY: Math.min(...all.map(s => s.y)),
        maxY: Math.max(...all.map(s => s.y))
    } : null;

    return {
        sections,
        frontier: [...frontier.values()],
        links,
        current: byId.get(wm.currentSectionId) || null,
        bounds
    };
}

/**
 * Where each gate of a section leads, for the Area view's gate labels.
 */
export function describeGates(game, snapshot) {
    const wm = game.worldManager;
    const visited = wm ? wm.visitedSections : new Set();
    return snapshot.gates.map(gate => {
        const offset = DIRECTION_OFFSETS[gate.direction] || { dx: 0, dy: 0 };
        const targetId = gate.nextSectionId && typeof gate.nextSectionId === 'string'
            ? gate.nextSectionId
            : sectionIdOf(snapshot.x + offset.dx, snapshot.y + offset.dy);
        const target = parseSectionId(targetId);
        return {
            gate,
            direction: gate.direction,
            targetId,
            target,
            visited: visited.has(targetId),
            seen: isExplored(snapshot, gate.x, gate.y),
            theme: pickThemeForSection(target.x, target.y)
        };
    });
}
