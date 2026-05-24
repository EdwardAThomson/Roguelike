import { Item } from './item.js';
import { Weapon } from './equipment.js';

/**
 * Cast an item's bound spell on behalf of the player.
 * Reuses InputManager.castSpellForPlayer so staves/wands share the exact
 * targeting + projectile path the spell hotkeys use.
 * @returns {boolean} whether the spell was actually cast
 */
export function castBoundSpell(item, entity, game, { freeCast = false } = {}) {
    if (!game || !game.spellDatabase || !game.inputManager) {
        console.warn('castBoundSpell: missing game systems');
        return false;
    }
    // Only the player channels these items.
    if (entity !== game.player) return false;

    const spell = game.spellDatabase.getSpell(item.spellId);
    if (!spell) {
        if (game.ui) game.ui.addMessage(`${item.name} crackles, but nothing happens.`, '#f55');
        return false;
    }

    // Wands carry their own charge as the resource, so they ignore mana.
    if (freeCast) spell.manaCost = 0;

    return game.inputManager.castSpellForPlayer(spell);
}

/**
 * A staff is an equippable mage weapon (Intelligence/mana bonus) that can also
 * channel a bound spell. Casting draws on the player's mana and never consumes
 * the staff. When equipped, the Space "fire" key casts it; when carried, the
 * inventory Use action does.
 */
export class Staff extends Weapon {
    constructor(options = {}) {
        super({
            icon: options.icon || '🪄',
            ...options
        });
        this.canUse = true;
        this.spellId = options.spellId || 'magic_dart';
    }

    use(entity, game) {
        castBoundSpell(this, entity, game, { freeCast: false });
        // Never consume the staff; the cast's own messages report success/failure.
        return false;
    }

    clone() {
        return new Staff({
            id: this.id,
            name: this.name,
            description: this.description,
            icon: this.icon,
            rarity: this.rarity,
            value: this.value,
            stats: { ...this.stats },
            damageType: this.damageType,
            twoHanded: this.twoHanded,
            weaponType: this.weaponType,
            range: this.range,
            projectile: this.projectile ? { ...this.projectile } : null,
            meleeAttack: this.meleeAttack,
            spellId: this.spellId
        });
    }
}

/**
 * A wand is a non-equippable consumable-style item with limited charges. Each
 * use casts its bound spell for free (no mana) and spends one charge; the wand
 * is destroyed once depleted.
 */
export class Wand extends Item {
    constructor(options = {}) {
        super({
            type: 'wand',
            icon: options.icon || '🪄',
            canUse: true,
            stackable: false,
            ...options
        });
        this.spellId = options.spellId || 'magic_missile';
        this.maxCharges = options.maxCharges || 5;
        this.charges = options.charges != null ? options.charges : this.maxCharges;
    }

    use(entity, game) {
        if (this.charges <= 0) {
            if (game && game.ui) game.ui.addMessage(`${this.name} has no charges left.`, '#f55');
            return false;
        }

        const cast = castBoundSpell(this, entity, game, { freeCast: true });
        if (!cast) return false; // no target / cast failed — don't waste a charge

        this.charges--;
        if (game && game.ui) {
            game.ui.addMessage(`${this.name}: ${this.charges}/${this.maxCharges} charges remaining.`, '#aaa');
            if (this.charges <= 0) {
                game.ui.addMessage(`The ${this.name} crumbles to dust.`, '#aaa');
            }
        }

        // Signal inventory.useItem to remove the wand once it is spent.
        if (this.charges <= 0) this.quantity = 0;
        return true;
    }

    getFullDescription() {
        return `${super.getFullDescription()}\n\nCharges: ${this.charges}/${this.maxCharges}`;
    }

    clone() {
        return new Wand({
            id: this.id,
            name: this.name,
            description: this.description,
            icon: this.icon,
            color: this.color,
            rarity: this.rarity,
            value: this.value,
            stats: { ...this.stats },
            spellId: this.spellId,
            maxCharges: this.maxCharges,
            charges: this.charges
        });
    }
}
