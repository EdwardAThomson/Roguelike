// Display modes: how the game is drawn. This is a per-player display setting,
// not part of a run, so it lives in localStorage and never in the save file.
// It can be changed from the menu's Options or in game with T.

export const DISPLAY_MODES = [
    { id: 'lit', label: '16-bit with lighting', tileSize: 32 },
    { id: 'tiles', label: '16-bit', tileSize: 32 },
    { id: 'ascii', label: 'ASCII', tileSize: 24 },
    { id: 'classic', label: 'Classic', tileSize: 24 }
];

export const DEFAULT_DISPLAY_MODE = 'lit';
export const DISPLAY_MODE_KEY = 'modernrogue.displayMode';

// The canvas is 960px wide; its height follows the shape of the space it is
// shown in, so tiles stay square without letterboxing. The camera shows as
// many whole tiles as fit at the mode's tile size.
export const TARGET_CANVAS = { width: 960, height: 720 };

export function canvasTarget(containerWidth, containerHeight) {
    if (!(containerWidth > 0) || !(containerHeight > 0)) return { ...TARGET_CANVAS };
    const height = Math.round(TARGET_CANVAS.width * containerHeight / containerWidth);
    return { width: TARGET_CANVAS.width, height: Math.max(480, Math.min(1280, height)) };
}

export function getDisplayMode(id) {
    return DISPLAY_MODES.find(m => m.id === id) || DISPLAY_MODES.find(m => m.id === DEFAULT_DISPLAY_MODE);
}

export function nextDisplayMode(id) {
    const i = DISPLAY_MODES.findIndex(m => m.id === id);
    return DISPLAY_MODES[(i + 1) % DISPLAY_MODES.length];
}

export function loadDisplayMode(storage = globalThis.localStorage) {
    try {
        const id = storage && storage.getItem(DISPLAY_MODE_KEY);
        return getDisplayMode(id).id;
    } catch (e) {
        return DEFAULT_DISPLAY_MODE;
    }
}

export function saveDisplayMode(id, storage = globalThis.localStorage) {
    try {
        if (storage) storage.setItem(DISPLAY_MODE_KEY, getDisplayMode(id).id);
    } catch (e) {
        // Private windows can refuse storage; the mode still applies this session.
    }
}

// Viewport in tiles for a mode, clamped to the map.
export function viewportFor(mode, gridWidth, gridHeight, target = TARGET_CANVAS) {
    return {
        width: Math.min(gridWidth, Math.floor(target.width / mode.tileSize)),
        height: Math.min(gridHeight, Math.floor(target.height / mode.tileSize))
    };
}
