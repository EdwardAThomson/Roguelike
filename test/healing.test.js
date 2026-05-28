import { describe, it, expect } from 'vitest';
import { Player } from '../src/js/modules/entity/player.js';
import { ItemDatabase } from '../src/js/modules/items/itemDatabase.js';
import { HealthPotion, ManaPotion } from '../src/js/modules/items/consumable.js';
import { InputManager } from '../src/js/modules/inputManager.js';
import { SpellDatabase } from '../src/js/modules/magic/spellDatabase.js';

const noopGame = () => ({ ui: { addMessage() {} } });

describe('ItemDatabase clones preserve consumable subclasses', () => {
    const db = new ItemDatabase();

    it('clones a health potion as a HealthPotion (not a plain Item)', () => {
        const potion = db.getItem('health_potion');
        expect(potion).toBeInstanceOf(HealthPotion);
    });

    it('clones a mana potion as a ManaPotion', () => {
        const potion = db.getItem('mana_potion');
        expect(potion).toBeInstanceOf(ManaPotion);
    });
});

describe('health potion', () => {
    it('heals exactly the potion amount — no double-heal', () => {
        const player = new Player(0, 0);
        const idx = player.inventory.items.findIndex(i => i.id === 'health_potion');
        const potion = player.inventory.items[idx];
        const healAmount = potion.stats.healAmount;

        // Drop well below max so the heal is never clamped.
        player.health = player.maxHealth - healAmount * 3;
        const before = player.health;

        player.useItemFromInventory(idx, noopGame());

        expect(player.health - before).toBe(healAmount);
    });

    it('is consumed on use and removed once the stack is empty', () => {
        const player = new Player(0, 0);
        const idx = player.inventory.items.findIndex(i => i.id === 'health_potion');
        const potion = player.inventory.items[idx];
        const startQty = potion.quantity; // starting stack of 3
        expect(startQty).toBeGreaterThan(1);

        player.health = 1;
        player.useItemFromInventory(idx, noopGame());
        expect(potion.quantity).toBe(startQty - 1);

        // Drain the remaining charges; the stack should disappear from the bag.
        let remaining = potion.quantity;
        while (remaining > 0) {
            const i = player.inventory.items.findIndex(it => it.id === 'health_potion');
            player.useItemFromInventory(i, noopGame());
            remaining--;
        }
        expect(player.inventory.items.findIndex(it => it.id === 'health_potion')).toBe(-1);
    });
});

describe('mana potion', () => {
    it('restores mana once and is consumed', () => {
        const player = new Player(0, 0);
        const manaPotion = player.itemDatabase.getItem('mana_potion');
        player.inventory.addItem(manaPotion);

        const idx = player.inventory.items.findIndex(i => i.id === 'mana_potion');
        const restore = manaPotion.stats.manaRestore;

        player.mana = 0; // plenty of headroom below maxMana
        player.useItemFromInventory(idx, noopGame());

        expect(player.mana).toBe(Math.min(restore, player.maxMana));
        // Single-charge potion: fully consumed.
        expect(player.inventory.items.findIndex(i => i.id === 'mana_potion')).toBe(-1);
    });
});

describe('heal spell', () => {
    it('restores health once, spends mana, and reports success', () => {
        const player = new Player(0, 0);
        player.health = 1;

        const spellDatabase = new SpellDatabase();
        const heal = spellDatabase.getSpell('heal');

        const game = {
            player,
            ui: { addMessage() {} },
            input: {},
            monsters: [],
            fov: { visible: new Set() }
        };
        const inputManager = new InputManager(game);

        player.mana = heal.manaCost + 5;
        const manaBefore = player.mana;

        const cast = inputManager.castSpellForPlayer(heal);

        expect(cast).toBe(true);
        expect(player.health).toBeGreaterThan(1);
        expect(player.mana).toBe(manaBefore - heal.manaCost);
    });
});
