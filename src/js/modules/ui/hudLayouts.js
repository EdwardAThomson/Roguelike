// HUD layouts: where the bars, hotbar, gear and log sit around the map. Like
// the graphics style, this is a per-player display setting kept in
// localStorage and never in the save file. Change it from the menu's Options
// or in game with L.

export const HUD_LAYOUTS = [
    { id: 'sidebar', label: 'Sidebar' },
    { id: 'actionbar', label: 'Action bar' }
];

export const DEFAULT_HUD_LAYOUT = 'sidebar';
export const HUD_LAYOUT_KEY = 'modernrogue.hudLayout';

export function getHudLayout(id) {
    return HUD_LAYOUTS.find(l => l.id === id) || HUD_LAYOUTS.find(l => l.id === DEFAULT_HUD_LAYOUT);
}

export function nextHudLayout(id) {
    const i = HUD_LAYOUTS.findIndex(l => l.id === id);
    return HUD_LAYOUTS[(i + 1) % HUD_LAYOUTS.length];
}

export function loadHudLayout(storage = globalThis.localStorage) {
    try {
        const id = storage && storage.getItem(HUD_LAYOUT_KEY);
        return getHudLayout(id).id;
    } catch (e) {
        return DEFAULT_HUD_LAYOUT;
    }
}

export function saveHudLayout(id, storage = globalThis.localStorage) {
    try {
        if (storage) storage.setItem(HUD_LAYOUT_KEY, getHudLayout(id).id);
    } catch (e) {
        // Private windows can refuse storage; the layout still applies this session.
    }
}
