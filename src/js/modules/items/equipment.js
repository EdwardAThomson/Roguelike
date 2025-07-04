import { Item } from './item.js';

export class Equipment extends Item {
    constructor(options = {}) {
        super(options);
        this.canEquip = true;
        this.durability = options.durability || 100;
        this.maxDurability = options.maxDurability || 100;
    }
    
    equip(entity) {
        if (super.equip(entity)) {
            // Add stat bonuses
            this.applyStats(entity);
            return true;
        }
        return false;
    }
    
    unequip(entity) {
        if (super.unequip(entity)) {
            // Remove stat bonuses
            this.removeStats(entity);
            return true;
        }
        return false;
    }
    
    applyStats(entity) {
        // Apply stat bonuses to entity
        for (const [stat, value] of Object.entries(this.stats)) {
            // Some stats need to be handled differently
            if (stat === 'maxHealth') {
                entity.maxHealth += value;
                // Don't increase current health
            } else if (stat === 'maxMana') {
                entity.maxMana += value;
                // Don't increase current mana
            } else if (entity.hasOwnProperty(stat)) {
                entity[stat] += value;
            }
        }
        
        // Recalculate derived stats
        entity.updateStats();
    }
    
    removeStats(entity) {
        // Remove stat bonuses from entity
        for (const [stat, value] of Object.entries(this.stats)) {
            if (stat === 'maxHealth') {
                entity.maxHealth -= value;
                // Make sure health doesn't exceed new max
                entity.health = Math.min(entity.health, entity.maxHealth);
            } else if (stat === 'maxMana') {
                entity.maxMana -= value;
                // Make sure mana doesn't exceed new max
                entity.mana = Math.min(entity.mana, entity.maxMana);
            } else if (entity.hasOwnProperty(stat)) {
                entity[stat] -= value;
            }
        }
        
        // Recalculate derived stats
        entity.updateStats();
    }
}

export class Weapon extends Equipment {
    constructor(options = {}) {
        super({
            type: 'weapon',
            slot: 'weapon',
            ...options
        });
        this.damageType = options.damageType || 'physical'; // physical, fire, ice, etc.
        this.twoHanded = options.twoHanded || false;
    }
}

export class Armor extends Equipment {
    constructor(options = {}) {
        super({
            type: 'armor',
            ...options
        });
        this.armorType = options.armorType || 'light'; // light, medium, heavy
    }
}

export class Accessory extends Equipment {
    constructor(options = {}) {
        super({
            type: 'accessory',
            ...options
        });
    }
}