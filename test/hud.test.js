import { describe, it, expect } from 'vitest';
import {
    HUD_LAYOUTS, DEFAULT_HUD_LAYOUT, HUD_LAYOUT_KEY,
    getHudLayout, nextHudLayout, loadHudLayout, saveHudLayout
} from '../src/js/modules/ui/hudLayouts.js';
import { beltItems, escapeHtml } from '../src/js/modules/ui/hud.js';
import { compareStats } from '../src/js/modules/ui/inventoryUI.js';

// HUD logic that does not need a DOM: the layout setting, which items go on
// the quick-use belt, and the inventory's stat comparison.

function memoryStorage() {
    const data = {};
    return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, data };
}

describe('HUD layouts', () => {
    it('defaults to the sidebar and falls back on unknown ids', () => {
        expect(DEFAULT_HUD_LAYOUT).toBe('sidebar');
        expect(getHudLayout('nonsense').id).toBe('sidebar');
        expect(loadHudLayout(memoryStorage())).toBe('sidebar');
    });

    it('cycles between sidebar and action bar', () => {
        expect(HUD_LAYOUTS.map(l => l.id)).toEqual(['sidebar', 'actionbar']);
        expect(nextHudLayout('sidebar').id).toBe('actionbar');
        expect(nextHudLayout('actionbar').id).toBe('sidebar');
    });

    it('persists the choice and survives storage that throws', () => {
        const storage = memoryStorage();
        saveHudLayout('actionbar', storage);
        expect(storage.data[HUD_LAYOUT_KEY]).toBe('actionbar');
        expect(loadHudLayout(storage)).toBe('actionbar');

        const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
        expect(loadHudLayout(broken)).toBe('sidebar');
        expect(() => saveHudLayout('actionbar', broken)).not.toThrow();
    });
});

describe('belt items', () => {
    const potion = (name, quantity = 1) => ({ name, type: 'potion', canUse: true, quantity });
    const wand = (name, charges) => ({ name, type: 'wand', canUse: true, charges });
    const scroll = { name: 'Scroll of Fireball', type: 'scroll', canUse: true };
    const sword = { name: 'Short Sword', type: 'weapon', canEquip: true };

    it('puts potions before wands, skips scrolls and gear, and keeps pack indices', () => {
        const items = [sword, wand('Wand of Frost', 5), scroll, potion('Health Potion', 3), potion('Mana Potion')];
        const belt = beltItems(items);
        expect(belt.map(b => b.item.name)).toEqual(['Health Potion', 'Mana Potion', 'Wand of Frost']);
        expect(belt.map(b => b.index)).toEqual([3, 4, 1]);
        expect(belt.map(b => b.count)).toEqual([3, 1, 5]);
    });

    it('merges unstacked copies of the same item and caps at three slots', () => {
        const items = [potion('Health Potion'), potion('Health Potion'), potion('Mana Potion'),
            potion('Elixir'), wand('Wand of Frost', 2)];
        const belt = beltItems(items);
        expect(belt).toHaveLength(3);
        expect(belt[0]).toMatchObject({ index: 0, count: 2 });
        expect(belt.map(b => b.item.name)).toEqual(['Health Potion', 'Mana Potion', 'Elixir']);
    });

    it('is empty for an empty or missing pack', () => {
        expect(beltItems([])).toEqual([]);
        expect(beltItems()).toEqual([]);
    });
});

describe('inventory stat comparison', () => {
    it('shows deltas against the equipped item, including stats only it has', () => {
        const bow = { stats: { attackPower: 4 } };
        const sword = { stats: { attackPower: 5, strength: 1 } };
        expect(compareStats(bow, sword)).toEqual([
            { key: 'attackPower', label: 'Attack', value: 4, delta: -1 },
            { key: 'strength', label: 'Strength', value: 0, delta: -1 }
        ]);
    });

    it('has no deltas when the slot is empty', () => {
        expect(compareStats({ stats: { defense: 3 } }, null)).toEqual([
            { key: 'defense', label: 'Defense', value: 3, delta: null }
        ]);
    });
});

describe('escapeHtml', () => {
    it('escapes markup in item names and messages', () => {
        expect(escapeHtml('<b>"Tom\'s" & co</b>')).toBe('&lt;b&gt;&quot;Tom&#39;s&quot; &amp; co&lt;/b&gt;');
    });
});
