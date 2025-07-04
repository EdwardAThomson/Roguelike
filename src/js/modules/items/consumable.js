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
    
    use(entity) {
        if (super.use(entity)) {
            const healAmount = this.stats.healAmount || 20;
            
            // Apply healing
            entity.heal(healAmount);
            
            return true;
        }
        return false;
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
    
    use(entity) {
        if (super.use(entity)) {
            const manaRestore = this.stats.manaRestore || 15;
            
            // Apply mana restoration
            entity.mana = Math.min(entity.mana + manaRestore, entity.maxMana);
            
            return true;
        }
        return false;
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
    }
    
    use(entity) {
        if (super.use(entity)) {
            // Implement scroll effects in subclasses or provide effect callback
            if (typeof this.stats.effectFn === 'function') {
                this.stats.effectFn(entity);
            }
            
            return true;
        }
        return false;
    }
}