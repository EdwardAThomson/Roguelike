// The visual registry: how each kind of thing in the game is drawn in each
// display mode. Game data keeps its own symbol/colour/icon (the Classic
// renderer still uses those); the ASCII and 16-bit renderers look things up
// here. Anything not covered falls back to its letter, so new content never
// renders as nothing.

import { CHARACTER_SPRITES, ITEM_SPRITES } from './spriteDefs.js';

// Monster type (the key in monsterDatabase) -> sprite key. Monster ASCII
// glyphs come from the database itself.
export function monsterSpriteKey(type) {
    return CHARACTER_SPRITES[type] ? type : null;
}

// Item -> { sprite, glyph, color } for the ASCII and 16-bit modes. Uses the
// item's id first, then its type/slot, so database additions still get a
// sensible picture.
export function itemVisual(item) {
    const id = (item && item.id) || '';
    const type = item && item.type;
    const slot = item && item.slot;

    const pick = (sprite, glyph, color) => ({ sprite, glyph, color });

    if (type === 'key' || id === 'gate_key') return pick('key', '-', item.color || '#f2cc48');
    if (type === 'currency' || id === 'gold') return pick('gold', '$', '#f2cc48');
    if (type === 'potion') {
        const mana = /mana/.test(id) || /mana/i.test(item.name || '');
        return pick(mana ? 'potion_mana' : 'potion_health', '!', mana ? '#6c9cff' : '#ff5a78');
    }
    if (type === 'scroll') return pick('scroll', '?', '#ece0c0');
    if (type === 'wand') return pick(/frost/.test(id) ? 'wand_of_frost' : 'wand', '/', /frost/.test(id) ? '#a0e8ff' : '#c0a0ff');

    if (type === 'weapon' || slot === 'weapon') {
        if (/staff/.test(id)) return pick(id === 'staff_of_flames' ? 'staff_of_flames' : 'staff', '/', id === 'staff_of_flames' ? '#ff9040' : '#70d8a8');
        if (/crossbow/.test(id)) return pick('crossbow', '}', '#c8cede');
        if (/bow/.test(id)) return pick('bow', '}', '#c8945a');
        if (/blowgun/.test(id)) return pick('blowgun', '}', '#b0c060');
        if (/axe/.test(id)) return pick('axe', ')', '#d0d6e4');
        if (/mace/.test(id)) return pick('mace', ')', '#b0b8c8');
        if (/dagger|knives/.test(id)) return pick('dagger', ')', '#d6deec');
        return pick('sword', ')', '#d6deec');
    }

    if (slot === 'head') return pick(/leather|cap/.test(id) ? 'cap' : 'helmet', '[', /leather|cap/.test(id) ? '#c08a5a' : '#b8c0d4');
    if (slot === 'feet') return pick('boots', '[', '#b0784a');
    if (slot === 'body') return pick(/leather/.test(id) ? 'leather_armor' : 'armor', '[', /leather/.test(id) ? '#c08a5a' : '#b8c0d4');
    if (slot === 'offhand') {
        if (/tome/.test(id)) return pick('tome', '+', '#e05a6a');
        return pick('shield', '[', '#a8b8d8');
    }
    if (slot === 'ring') return pick('ring', '=', '#f0c838');
    if (slot === 'amulet') return pick('amulet', '"', '#60d0e8');

    return pick('bag', '*', '#c8a070');
}

// Every sprite key this module can hand out, so tests can check each one has
// a definition.
export function allItemSpriteKeys() {
    return Object.keys(ITEM_SPRITES);
}
