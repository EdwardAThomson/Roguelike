import { describe, it, expect } from 'vitest';
import { Staff, Wand } from '../src/js/modules/items/magicItem.js';
import { ItemDatabase } from '../src/js/modules/items/itemDatabase.js';

// Minimal game stub. castSpellForPlayer records the spell it was handed and
// returns a configurable success flag so we can exercise both paths.
function makeGame({ castResult = true } = {}) {
    const calls = [];
    const player = { name: 'Hero', mana: 50, maxMana: 50 };
    const game = {
        player,
        ui: { addMessage() {} },
        spellDatabase: {
            getSpell(id) {
                return { id, name: id, manaCost: 7, type: 'offensive' };
            }
        },
        inputManager: {
            castSpellForPlayer(spell) {
                calls.push(spell);
                return castResult;
            }
        }
    };
    return { game, player, calls };
}

describe('Staff', () => {
    it('is both equippable and usable', () => {
        const staff = new Staff({ id: 'staff', name: 'Staff', spellId: 'magic_missile' });
        expect(staff.type).toBe('weapon');
        expect(staff.canEquip).toBe(true);
        expect(staff.canUse).toBe(true);
        expect(staff.spellId).toBe('magic_missile');
    });

    it('casts its bound spell with the player paying mana, and is not consumed', () => {
        const { game, player, calls } = makeGame();
        const staff = new Staff({ id: 'staff', name: 'Staff', spellId: 'magic_missile' });
        const result = staff.use(player, game);

        expect(calls).toHaveLength(1);
        expect(calls[0].id).toBe('magic_missile');
        expect(calls[0].manaCost).toBe(7); // staff does NOT zero out the mana cost
        expect(result).toBe(false);        // never consumed
        expect(staff.quantity).toBe(1);
    });

    it('does nothing when used by a non-player entity', () => {
        const { game, calls } = makeGame();
        const staff = new Staff({ spellId: 'magic_missile' });
        expect(staff.use({ name: 'Goblin' }, game)).toBe(false);
        expect(calls).toHaveLength(0);
    });

    it('clones into a Staff preserving spell and stats', () => {
        const staff = new Staff({ id: 's', name: 'S', spellId: 'fireball', stats: { intelligence: 3 } });
        const copy = staff.clone();
        expect(copy).toBeInstanceOf(Staff);
        expect(copy.spellId).toBe('fireball');
        expect(copy.stats.intelligence).toBe(3);
        expect(copy.canUse).toBe(true);
    });
});

describe('Wand', () => {
    it('casts for free and spends one charge', () => {
        const { game, player, calls } = makeGame({ castResult: true });
        const wand = new Wand({ id: 'w', name: 'Wand', spellId: 'magic_missile', maxCharges: 3 });
        expect(wand.type).toBe('wand');
        expect(wand.canUse).toBe(true);

        const result = wand.use(player, game);
        expect(result).toBe(true);
        expect(wand.charges).toBe(2);
        expect(calls[0].manaCost).toBe(0); // wand zeroes the mana cost
    });

    it('does not spend a charge when the cast fails', () => {
        const { game, player } = makeGame({ castResult: false });
        const wand = new Wand({ spellId: 'magic_missile', maxCharges: 3 });
        expect(wand.use(player, game)).toBe(false);
        expect(wand.charges).toBe(3);
    });

    it('flags itself for removal once the last charge is spent', () => {
        const { game, player } = makeGame({ castResult: true });
        const wand = new Wand({ spellId: 'magic_missile', maxCharges: 1 });
        expect(wand.use(player, game)).toBe(true);
        expect(wand.charges).toBe(0);
        expect(wand.quantity).toBe(0); // inventory.useItem removes when quantity <= 0
    });

    it('refuses to fire when out of charges', () => {
        const { game, player, calls } = makeGame({ castResult: true });
        const wand = new Wand({ spellId: 'magic_missile', maxCharges: 3, charges: 0 });
        expect(wand.use(player, game)).toBe(false);
        expect(calls).toHaveLength(0);
    });

    it('clones into a Wand preserving charges', () => {
        const wand = new Wand({ id: 'w', spellId: 'ice_shard', maxCharges: 5, charges: 2 });
        const copy = wand.clone();
        expect(copy).toBeInstanceOf(Wand);
        expect(copy.spellId).toBe('ice_shard');
        expect(copy.maxCharges).toBe(5);
        expect(copy.charges).toBe(2);
    });
});

describe('ItemDatabase magic items', () => {
    const db = new ItemDatabase();

    it('builds the staff as a castable Staff instance', () => {
        const staff = db.getItem('staff');
        expect(staff).toBeInstanceOf(Staff);
        expect(staff.spellId).toBe('magic_missile');
        expect(staff.canEquip).toBe(true);
    });

    it('builds wands with their charges', () => {
        const wand = db.getItem('wand_of_magic_missiles');
        expect(wand).toBeInstanceOf(Wand);
        expect(wand.spellId).toBe('magic_missile');
        expect(wand.charges).toBe(7);
    });
});
