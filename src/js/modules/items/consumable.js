import { Item } from './item.js';

export class Consumable extends Item {
    constructor(options = {}) {
        super({
            canUse: true,
            stackable: true,
            ...options
        });
    }

    use(entity) {
        if (super.use(entity)) {
            // Reduce quantity when used
            this.quantity--;
            return true;
        }
        return false;
    }

    clone() {
        return new Consumable({
            id: this.id,
            name: this.name,
            description: this.description,
            type: this.type,
            rarity: this.rarity,
            value: this.value,
            icon: this.icon,
            color: this.color,
            stackable: this.stackable,
            quantity: this.quantity,
            stats: { ...this.stats }
        });
    }
}

export class HealthPotion extends Consumable {
    constructor(options = {}) {
        super({
            id: options.id || 'health_potion',
            name: options.name || 'Health Potion',
            description: options.description || 'Restores health when consumed.',
            type: 'potion',
            icon: options.icon || '🧪',
            color: options.color || '#e74c3c',
            ...options
        });

        // Set default heal amount if not provided
        if (!this.stats.healAmount) {
            this.stats.healAmount = options.healAmount || 20;
        }
    }

    use(entity, game) {
        if (super.use(entity)) {
            const healAmount = this.stats.healAmount || 20;
            const before = entity.health;
            entity.heal(healAmount);
            if (game && game.ui) {
                game.ui.addMessage(`Healed for ${entity.health - before} HP`, '#5f5');
            }
            return true;
        }
        return false;
    }

    clone() {
        return new HealthPotion({
            id: this.id,
            name: this.name,
            description: this.description,
            rarity: this.rarity,
            value: this.value,
            icon: this.icon,
            color: this.color,
            stackable: this.stackable,
            quantity: this.quantity,
            healAmount: this.stats.healAmount,
            stats: { ...this.stats }
        });
    }
}

export class ManaPotion extends Consumable {
    constructor(options = {}) {
        super({
            id: options.id || 'mana_potion',
            name: options.name || 'Mana Potion',
            description: options.description || 'Restores mana when consumed.',
            type: 'potion',
            icon: options.icon || '🧪',
            color: options.color || '#3498db',
            ...options
        });

        // Set default mana restore if not provided
        if (!this.stats.manaRestore) {
            this.stats.manaRestore = options.manaRestore || 15;
        }
    }

    use(entity, game) {
        if (super.use(entity)) {
            const manaRestore = this.stats.manaRestore || 15;
            const before = entity.mana;
            entity.mana = Math.min(entity.mana + manaRestore, entity.maxMana);
            if (game && game.ui) {
                game.ui.addMessage(`Restored ${entity.mana - before} MP`, '#55f');
            }
            return true;
        }
        return false;
    }

    clone() {
        return new ManaPotion({
            id: this.id,
            name: this.name,
            description: this.description,
            rarity: this.rarity,
            value: this.value,
            icon: this.icon,
            color: this.color,
            stackable: this.stackable,
            quantity: this.quantity,
            manaRestore: this.stats.manaRestore,
            stats: { ...this.stats }
        });
    }
}

export class Scroll extends Consumable {
    constructor(options = {}) {
        super({
            type: 'scroll',
            icon: options.icon || '📜',
            color: options.color || '#f1c40f',
            ...options
        });
        
        this.effect = options.effect || 'none'; // identify, teleport, enchant, etc.
        this.spellId = options.spellId || null; // For spell scrolls
    }
    
    clone() {
        return new Scroll({
            id: this.id,
            name: this.name,
            description: this.description,
            rarity: this.rarity,
            value: this.value,
            icon: this.icon,
            color: this.color,
            stackable: this.stackable,
            quantity: this.quantity,
            effect: this.effect,
            spellId: this.spellId,  // Important! Preserve spellId
            stats: {...this.stats}
        });
    }
    
    use(entity, game) {
        console.log(`📜 Scroll.use() called:`, {
            scrollName: this.name,
            spellId: this.spellId,
            quantity: this.quantity,
            hasEntity: !!entity,
            hasSpellbook: !!(entity && entity.spellbook)
        });
        
        // If this is a spell scroll, unlock the spell in the spellbook
        if (this.spellId && entity && entity.spellbook) {
            console.log(`📜 Scroll.use(): This is a spell scroll for ${this.spellId}, quantity BEFORE: ${this.quantity}`);
            
            // Check if spell is already unlocked
            if (entity.spellbook.isSpellUnlocked(this.spellId)) {
                console.log(`📜 Scroll.use(): Spell already unlocked!`);
                if (game && game.ui) {
                    game.ui.addMessage(`You already know this spell!`, '#f55');
                }
                return false; // Don't consume the scroll
            }
            
            // Unlock the spell
            console.log(`📜 Scroll.use(): Attempting to unlock spell...`);
            const success = entity.spellbook.unlockSpell(this.spellId);
            console.log(`📜 Scroll.use(): unlockSpell returned ${success}`);
            
            if (success) {
                if (game && game.ui) {
                    const spell = entity.spellbook.getSpellData(this.spellId);
                    game.ui.addMessage(`📖 You learned ${spell.name}!`, '#0af');
                    game.ui.addMessage(`Press C to open your spellbook and assign it to a hotkey.`, '#aaa');
                }
                
                // Manually decrement quantity (NOT calling super to avoid double-decrement)
                console.log(`📜 Scroll.use(): About to decrement. Quantity BEFORE: ${this.quantity}`);
                this.quantity--;
                console.log(`📜 Scroll.use(): Decremented quantity. Quantity AFTER: ${this.quantity}`);
                return true;
            } else {
                if (game && game.ui) {
                    game.ui.addMessage(`The scroll's magic fizzles...`, '#aaa');
                }
                return false;
            }
        }
        
        // For non-spell scrolls, use parent behavior
        console.log(`📜 Scroll.use(): Not a spell scroll, using parent behavior`);
        return super.use(entity);
    }
}