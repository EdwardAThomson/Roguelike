import { Character } from './character.js';
import { Inventory } from '../items/inventory.js';
import { ItemDatabase } from '../items/itemDatabase.js';

export class Player extends Character {
    constructor(x, y) {
        // Initialize inventory first before the parent constructor
        // This prevents a circular reference issue
        const inventory = new Inventory(20);
        const itemDatabase = new ItemDatabase();
        
        super(); // Now call parent constructor
        
        // Set position
        this.x = x;
        this.y = y;
        this.lastMove = 0;
        this.moveDelay = 115; // ms between moves (slowed by 15%)
        
        // Assign the pre-initialized inventory
        this.inventory = inventory;
        this.itemDatabase = itemDatabase;
        
        // Add starting equipment
        this.giveStartingItems();
    }
    
    giveStartingItems() {
        // Add starting weapon and equip it
        const startingWeapon = this.itemDatabase.getItem('short_sword');
        this.inventory.addItem(startingWeapon);
        const weaponIndex = this.inventory.items.length - 1;
        this.inventory.equipItem(weaponIndex, this);
        
        // Add starting armor and equip it
        const startingArmor = this.itemDatabase.getItem('leather_armor');
        this.inventory.addItem(startingArmor);
        const armorIndex = this.inventory.items.length - 1;
        this.inventory.equipItem(armorIndex, this);
        
        // Add some potions
        const healthPotion = this.itemDatabase.getItem('health_potion');
        healthPotion.quantity = 3;
        this.inventory.addItem(healthPotion);
        
        // Add some gold
        this.inventory.gold = 50;
    }
    
    update(game, deltaTime) {
        // Update last move timer
        this.lastMove += deltaTime;
    }
    
    tryMove(newX, newY, game) {
        // Check if we can move again
        if (this.lastMove < this.moveDelay) {
            return false;
        }
        
        // Check if new position is walkable
        if (game.map[newY][newX] === 'floor') {
            this.x = newX;
            this.y = newY;
            this.lastMove = 0;
            
            // Call FOV update
            game.updateFOV();
            
            // For example purposes, gain experience for each move
            // In a real game, this would come from defeating enemies
            this.checkForExperience(game);
            
            return true;
        }
        
        return false;
    }
    
    checkForExperience(game) {
        // This is a placeholder - in a real game, experience would come from killing monsters, etc.
        // For demo purposes, we'll add a small random chance to find experience
        if (Math.random() < 0.1) {
            const amount = Math.floor(Math.random() * 20) + 5;
            const leveledUp = this.gainExperience(amount);
            
            game.ui.addMessage(`You gained ${amount} experience.`, '#0c0');
            
            if (leveledUp) {
                game.ui.addMessage(`Level up! You are now level ${this.level}`, '#0ff');
            }
        }
    }
    
    // Item and inventory methods
    pickupItem(item, game) {
        if (!this.inventory) return false;
        
        // Special handling for gold
        if (item.type === 'currency' && item.id === 'gold') {
            // Add to gold pile instead of inventory
            this.inventory.gold += item.quantity;
            game.ui.addMessage(`Picked up ${item.quantity} gold`, '#fd0');
            return true;
        }
        
        // Normal item handling
        const success = this.inventory.addItem(item);
        if (success) {
            game.ui.addMessage(`Picked up ${item.name}`, '#fff');
            return true;
        } else {
            game.ui.addMessage(`Inventory full!`, '#f55');
            return false;
        }
    }
    
    equipItemFromInventory(index, game) {
        if (!this.inventory) return false;
        
        const item = this.inventory.getItem(index);
        if (!item) return false;
        
        const success = this.inventory.equipItem(index, this);
        if (success) {
            game.ui.addMessage(`Equipped ${item.name}`, '#5f5');
            return true;
        }
        return false;
    }
    
    unequipItem(slot, game) {
        if (!this.inventory) return false;
        
        const item = this.inventory.equipment[slot];
        if (!item) return false;
        
        const success = this.inventory.unequipItem(slot, this);
        if (success) {
            game.ui.addMessage(`Unequipped ${item.name}`, '#fff');
            return true;
        } else {
            game.ui.addMessage(`Inventory full, can't unequip!`, '#f55');
            return false;
        }
    }
    
    useItemFromInventory(index, game) {
        if (!this.inventory) return false;
        
        const item = this.inventory.getItem(index);
        if (!item) return false;
        
        if (!item.canUse) {
            game.ui.addMessage(`Can't use ${item.name}`, '#f55');
            return false;
        }
        
        const success = this.inventory.useItem(index, this);
        if (success) {
            game.ui.addMessage(`Used ${item.name}`, '#5f5');
            
            // If it was a healing item, show the amount healed
            if (item.stats && item.stats.healAmount) {
                game.ui.addMessage(`Healed for ${item.stats.healAmount} HP`, '#5f5');
                this.health = Math.min(this.health + item.stats.healAmount, this.maxHealth);
            }
            
            // If it was a mana item, show the amount restored
            if (item.stats && item.stats.manaRestore) {
                game.ui.addMessage(`Restored ${item.stats.manaRestore} MP`, '#55f');
                this.mana = Math.min(this.mana + item.stats.manaRestore, this.maxMana);
            }
            
            return true;
        }
        return false;
    }
    
    // Override attack method to include equipment bonuses
    calculateAttackPower() {
        // Get base attack first
        const baseAttack = super.calculateAttackPower();
        
        // Check if inventory exists before using it
        if (!this.inventory) return baseAttack;
        
        // Get weapon bonus if equipped
        let equipmentBonus = 0;
        try {
            const equippedItems = this.inventory.getAllEquipped();
            
            for (const item of equippedItems) {
                if (item.stats && item.stats.attackPower) {
                    equipmentBonus += item.stats.attackPower;
                }
            }
        } catch (error) {
            console.error("Error calculating attack power:", error);
        }
        
        console.log(`Player: calculateAttackPower: baseAttack: ${baseAttack}, equipmentBonus: ${equipmentBonus}`);
        return baseAttack + equipmentBonus;
    }
    
    // Override defense method to include equipment bonuses
    calculateDefense() {
        const baseDefense = super.calculateDefense();
        
        // Check if inventory exists before using it
        if (!this.inventory) return baseDefense;
        
        // Get armor bonus from all equipped items
        let equipmentBonus = 0;
        try {
            const equippedItems = this.inventory.getAllEquipped();
            
            for (const item of equippedItems) {
                if (item.stats && item.stats.defense) {
                    equipmentBonus += item.stats.defense;
                }
            }
        } catch (error) {
            console.error("Error calculating defense:", error);
        }
        
        return baseDefense + equipmentBonus;
    }
    
    // Override getSummary to include equipment
    getSummary() {
        const summary = super.getSummary();
        
        // Add equipment info if inventory exists
        if (this.inventory) {
            summary.equipment = {};
            for (const [slot, item] of Object.entries(this.inventory.equipment)) {
                summary.equipment[slot] = item ? item.name : 'None';
            }
            
            summary.gold = this.inventory.gold;
            summary.inventoryCount = this.inventory.items.length;
            summary.inventoryMax = this.inventory.maxSize;
        }
        
        return summary;
    }
}