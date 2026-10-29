// Item icons for the HTML UI (inventory, equipment sidebar, help screen),
// drawn from the same sprite definitions as the 16-bit renderer so an item
// looks the same on the floor and in your pack. Replaces the emoji icons,
// which looked different on every operating system.

import { rasterizeSprite } from './pixelArt.js';
import { ITEM_SPRITES, SPELL_SPRITES } from './spriteDefs.js';
import { itemVisual } from './visuals.js';

// What an empty equipment slot shows, as a faded outline.
export const SLOT_SPRITES = {
    head: 'helmet',
    body: 'armor',
    feet: 'boots',
    weapon: 'sword',
    offhand: 'shield',
    ring: 'ring',
    amulet: 'amulet'
};

const urlCache = new Map();

// Rasterise a sprite, centred in a 16x16 cell (floor sprites sit low in
// their tile; icons look better centred), and return it as a data URL.
export function spriteDataUrl(key) {
    return defDataUrl(key, ITEM_SPRITES[key] || ITEM_SPRITES.bag);
}

function defDataUrl(cacheKey, def) {
    if (urlCache.has(cacheKey)) return urlCache.get(cacheKey);
    if (typeof document === 'undefined') return '';

    const { pixels } = rasterizeSprite(def.rows, def.palette);
    const xs = pixels.map(p => p.x), ys = pixels.map(p => p.y);
    const dx = Math.floor((16 - (Math.max(...xs) - Math.min(...xs) + 1)) / 2) - Math.min(...xs);
    const dy = Math.floor((16 - (Math.max(...ys) - Math.min(...ys) + 1)) / 2) - Math.min(...ys);

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 16;
    const g = canvas.getContext('2d');
    for (const p of pixels) {
        g.fillStyle = p.color;
        g.fillRect(p.x + dx, p.y + dy, 1, 1);
    }
    const url = canvas.toDataURL('image/png');
    urlCache.set(cacheKey, url);
    return url;
}

function imgHtml(key, extraClass = '') {
    return `<img class="pixel-icon ${extraClass}" src="${spriteDataUrl(key)}" alt="" draggable="false">`;
}

export function itemIconHtml(item) {
    return imgHtml(itemVisual(item).sprite);
}

export function emptySlotIconHtml(slot) {
    return imgHtml(SLOT_SPRITES[slot] || 'bag', 'pixel-icon-empty');
}

export function spriteIconHtml(key, extraClass = '') {
    return imgHtml(key, extraClass);
}

// Spell icon by spell id; unknown spells fall back to the tome.
export function spellIconHtml(spellId, extraClass = '') {
    const def = SPELL_SPRITES[spellId];
    const url = def ? defDataUrl(`spell:${spellId}`, def) : spriteDataUrl('tome');
    return `<img class="pixel-icon ${extraClass}" src="${url}" alt="" draggable="false">`;
}
