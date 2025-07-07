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
        console.log(`Equipment: applyStats: ${this.name} being applied to ${entity.name}`);
        console.log(`Equipment: applyStats: Item stats:`, this.stats);
        
        // Apply stat bonuses to entity
        for (const [stat, value] of Object.entries(this.stats)) {
            // Some stats need to be handled differently
            if (stat === 'maxHealth') {
                // Don't directly modify maxHealth - let calculateMaxHealth handle it
                // This prevents the bonus from being overwritten by updateStats()
            } else if (stat === 'maxMana') {
                // Don't directly modify maxMana - let calculateMaxMana handle it
                // This prevents the bonus from being overwritten by updateStats()
            } else if (entity.hasOwnProperty(stat)) {
                entity[stat] += value;
            }
        }
        
        console.log(`Equipment: applyStats: calling updateStats() for ${entity.name}`);
        // Recalculate derived stats
        entity.updateStats();
    }
    
    removeStats(entity) {
        console.log(`Equipment: removeStats: ${this.name} being removed from ${entity.name}`);
        console.log(`Equipment: removeStats: Item stats:`, this.stats);
        
        // Remove stat bonuses from entity
        for (const [stat, value] of Object.entries(this.stats)) {
            if (stat === 'maxHealth') {
                // Don't directly modify maxHealth - let calculateMaxHealth handle it
                // Just update stats to recalculate properly
            } else if (stat === 'maxMana') {
                // Don't directly modify maxMana - let calculateMaxMana handle it
                // Just update stats to recalculate properly
            } else if (entity.hasOwnProperty(stat)) {
                entity[stat] -= value;
            }
        }
        
        console.log(`Equipment: removeStats: calling updateStats() for ${entity.name}`);
        // Recalculate derived stats
        entity.updateStats();
        
        // After recalculating stats, make sure current health/mana don't exceed new maximums
        if (entity.health > entity.maxHealth) {
            entity.health = entity.maxHealth;
        }
        if (entity.mana > entity.maxMana) {
            entity.mana = entity.maxMana;
        }
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