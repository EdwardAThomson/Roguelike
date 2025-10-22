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
        
        // Ranged weapon properties
        this.weaponType = options.weaponType || 'melee'; // 'melee' or 'ranged'
        this.range = options.range || 1; // 1 for melee, 4-12 for ranged
        this.projectile = options.projectile || null; // Projectile config for ranged weapons
        this.meleeAttack = options.meleeAttack || null; // Backup melee damage for throwing weapons
    }
    
    isRanged() {
        return this.weaponType === 'ranged';
    }
    
    canAttackAt(distance) {
        return distance <= this.range;
    }
    
    clone() {
        return new Weapon({
            id: this.id,
            name: this.name,
            description: this.description,
            icon: this.icon,
            type: this.type,
            slot: this.slot,
            rarity: this.rarity,
            value: this.value,
            stats: {...this.stats},
            damageType: this.damageType,
            twoHanded: this.twoHanded,
            weaponType: this.weaponType,
            range: this.range,
            projectile: this.projectile ? {...this.projectile} : null,
            meleeAttack: this.meleeAttack
        });
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
    
    clone() {
        return new Armor({
            id: this.id,
            name: this.name,
            description: this.description,
            icon: this.icon,
            type: this.type,
            slot: this.slot,
            rarity: this.rarity,
            value: this.value,
            stats: {...this.stats},
            armorType: this.armorType
        });
    }
}

export class Accessory extends Equipment {
    constructor(options = {}) {
        super({
            type: 'accessory',
            ...options
        });
    }
    
    clone() {
        return new Accessory({
            id: this.id,
            name: this.name,
            description: this.description,
            icon: this.icon,
            type: this.type,
            slot: this.slot,
            rarity: this.rarity,
            value: this.value,
            stats: {...this.stats}
        });
    }
}