import { Item } from './item.js';
import { Weapon, Armor, Accessory } from './equipment.js';
import { HealthPotion, ManaPotion, Scroll } from './consumable.js';

// Item database - centralized location for all item definitions
export class ItemDatabase {
    constructor() {
        this.items = {};
        this.initializeItems();
    }
    
    initializeItems() {
        // WEAPONS
        this.registerItem(new Weapon({
            id: 'dagger',
            name: 'Dagger',
            description: 'A small, sharp blade for quick strikes.',
            icon: '🗡️',
            value: 10,
            stats: { attackPower: 3, dexterity: 1 }
        }));
        
        this.registerItem(new Weapon({
            id: 'short_sword',
            name: 'Short Sword',
            description: 'A balanced one-handed sword.',
            icon: '🗡️',
            value: 25,
            stats: { attackPower: 5 }
        }));
        
        this.registerItem(new Weapon({
            id: 'long_sword',
            name: 'Long Sword',
            description: 'A versatile double-edged sword.',
            icon: '⚔️',
            value: 50,
            rarity: 'uncommon',
            stats: { attackPower: 8, strength: 1 }
        }));
        
        this.registerItem(new Weapon({
            id: 'battle_axe',
            name: 'Battle Axe',
            description: 'A heavy axe that deals devastating blows.',
            icon: '🪓',
            value: 65,
            rarity: 'uncommon',
            stats: { attackPower: 10, strength: 2, dexterity: -1 }
        }));
        
        this.registerItem(new Weapon({
            id: 'staff',
            name: 'Wooden Staff',
            description: 'A wooden staff that enhances magical abilities.',
            icon: '🪄',
            value: 40,
            stats: { attackPower: 4, intelligence: 2, maxMana: 10 }
        }));
        
        // ARMOR
        this.registerItem(new Armor({
            id: 'leather_cap',
            name: 'Leather Cap',
            description: 'A simple leather cap offering minimal protection.',
            slot: 'head',
            icon: '🧢',
            value: 15,
            stats: { defense: 1 }
        }));
        
        this.registerItem(new Armor({
            id: 'iron_helmet',
            name: 'Iron Helmet',
            description: 'A sturdy iron helmet.',
            slot: 'head',
            icon: '⛑️',
            value: 40,
            rarity: 'uncommon',
            stats: { defense: 3, constitution: 1 }
        }));
        
        this.registerItem(new Armor({
            id: 'leather_armor',
            name: 'Leather Armor',
            description: 'Light armor made from tanned hides.',
            slot: 'body',
            icon: '👕',
            value: 25,
            stats: { defense: 2, dexterity: 1 }
        }));
        
        this.registerItem(new Armor({
            id: 'chainmail',
            name: 'Chainmail',
            description: 'Interlocking metal rings providing good protection.',
            slot: 'body',
            icon: '🥋',
            value: 60,
            rarity: 'uncommon',
            stats: { defense: 4, constitution: 1, dexterity: -1 }
        }));
        
        this.registerItem(new Armor({
            id: 'plate_armor',
            name: 'Plate Armor',
            description: 'Heavy armor offering excellent protection.',
            slot: 'body',
            icon: '👕',
            value: 100,
            rarity: 'rare',
            stats: { defense: 7, constitution: 2, strength: 1, dexterity: -2 }
        }));
        
        this.registerItem(new Armor({
            id: 'leather_boots',
            name: 'Leather Boots',
            description: 'Comfortable boots for long journeys.',
            slot: 'feet',
            icon: '👢',
            value: 20,
            stats: { defense: 1, dexterity: 1 }
        }));
        
        this.registerItem(new Armor({
            id: 'iron_boots',
            name: 'Iron Boots',
            description: 'Heavy boots that protect your feet.',
            slot: 'feet',
            icon: '👢',
            value: 35,
            rarity: 'uncommon',
            stats: { defense: 2, constitution: 1, dexterity: -1 }
        }));
        
        // ACCESSORIES
        this.registerItem(new Accessory({
            id: 'amulet_of_health',
            name: 'Amulet of Health',
            description: 'An amulet that enhances vitality.',
            slot: 'amulet',
            icon: '📿',
            value: 75,
            rarity: 'uncommon',
            stats: { maxHealth: 15, constitution: 1 }
        }));
        
        this.registerItem(new Accessory({
            id: 'ring_of_protection',
            name: 'Ring of Protection',
            description: 'A ring that wards off harm.',
            slot: 'ring',
            icon: '💍',
            value: 80,
            rarity: 'uncommon',
            stats: { defense: 2 }
        }));
        
        this.registerItem(new Accessory({
            id: 'ring_of_strength',
            name: 'Ring of Strength',
            description: 'A ring that enhances physical power.',
            slot: 'ring',
            icon: '💍',
            value: 80,
            rarity: 'uncommon',
            stats: { strength: 2 }
        }));
        
        // OFF-HAND ITEMS
        this.registerItem(new Armor({
            id: 'wooden_shield',
            name: 'Wooden Shield',
            description: 'A simple wooden shield that provides basic protection.',
            slot: 'offhand',
            icon: '🛡️',
            value: 25,
            stats: { defense: 2 }
        }));
        
        this.registerItem(new Armor({
            id: 'iron_shield',
            name: 'Iron Shield',
            description: 'A sturdy shield made of iron.',
            slot: 'offhand',
            icon: '🛡️',
            value: 60,
            rarity: 'uncommon',
            stats: { defense: 4, constitution: 1 }
        }));
        
        this.registerItem(new Armor({
            id: 'tower_shield',
            name: 'Tower Shield',
            description: 'A massive shield that provides excellent protection but is heavy to carry.',
            slot: 'offhand',
            icon: '🛡️',
            value: 120,
            rarity: 'rare',
            stats: { defense: 7, constitution: 2, dexterity: -1 }
        }));
        
        this.registerItem(new Item({
            id: 'spell_tome',
            name: 'Spell Tome',
            description: 'An ancient book containing magical knowledge.',
            type: 'accessory',
            slot: 'offhand',
            icon: '📕',
            canEquip: true,
            value: 85,
            rarity: 'uncommon',
            stats: { intelligence: 3, maxMana: 15 }
        }));
        
        // POTIONS
        this.registerItem(new HealthPotion({
            healAmount: 20,
            value: 15
        }));
        
        this.registerItem(new HealthPotion({
            id: 'greater_health_potion',
            name: 'Greater Health Potion',
            description: 'A potion that restores a significant amount of health.',
            healAmount: 50,
            rarity: 'uncommon',
            value: 40
        }));
        
        this.registerItem(new ManaPotion({
            manaRestore: 15,
            value: 15
        }));
        
        this.registerItem(new ManaPotion({
            id: 'greater_mana_potion',
            name: 'Greater Mana Potion',
            description: 'A potion that restores a significant amount of mana.',
            manaRestore: 40,
            rarity: 'uncommon',
            value: 40
        }));
        
        // SCROLLS
        this.registerItem(new Scroll({
            id: 'scroll_of_identify',
            name: 'Scroll of Identify',
            description: 'Reveals the properties of an unidentified item.',
            effect: 'identify',
            value: 25
        }));
        
        this.registerItem(new Scroll({
            id: 'scroll_of_teleport',
            name: 'Scroll of Teleport',
            description: 'Teleports you to a random location in the dungeon.',
            effect: 'teleport',
            value: 30
        }));
        
        // MISCELLANEOUS
        this.registerItem(new Item({
            id: 'gold',
            name: 'Gold',
            description: 'Shiny coins that can be used for trading.',
            type: 'currency',
            icon: '💰',
            stackable: true,
            quantity: 1
        }));
        
        // Generic gate key template (will be customized when created)
        this.registerItem(new Item({
            id: 'gate_key',
            name: 'Gate Key',
            description: 'A key that unlocks a gate in the dungeon.',
            type: 'key',
            icon: '🔑',
            color: '#FFD700', // Gold color
            value: 50,
            canUse: true, // Allow using the key on gates
            rarity: 'rare', // Make it rare so it doesn't spawn randomly
            gateId: 0 // This will be set when the specific key is created
        }));
    }
    
    registerItem(item) {
        this.items[item.id] = item;
    }
    
    getItem(id) {
        if (!this.items[id]) {
            console.warn(`Item with id '${id}' not found in database`);
            return null;
        }
        
        // Return a clone to avoid modifying the template
        return this.items[id].clone();
    }
    
    getRandomItem(options = {}) {
        const { rarity, type, slot } = options;
        
        // Filter items based on criteria
        const filteredItems = Object.values(this.items).filter(item => {
            if (rarity && item.rarity !== rarity) return false;
            if (type && item.type !== type) return false;
            if (slot && item.slot !== slot) return false;
            return true;
        });
        
        if (filteredItems.length === 0) {
            console.warn('No items match the criteria');
            return null;
        }
        
        // Select random item from filtered list
        const randomIndex = Math.floor(Math.random() * filteredItems.length);
        return filteredItems[randomIndex].clone();
    }
    
    getRandomItemByLevel(level, options = {}) {
        // Determine rarity based on level
        let rarity;
        const rarityRoll = Math.random();
        
        if (level >= 10 && rarityRoll < 0.05) {
            rarity = 'legendary';
        } else if (level >= 7 && rarityRoll < 0.15) {
            rarity = 'epic';
        } else if (level >= 5 && rarityRoll < 0.30) {
            rarity = 'rare';
        } else if (level >= 3 && rarityRoll < 0.50) {
            rarity = 'uncommon';
        } else {
            rarity = 'common';
        }
        
        return this.getRandomItem({...options, rarity});
    }
    
    getRandomEquipment() {
        // Filter for equipment items only (weapons, armor, accessories)
        const equipmentItems = Object.values(this.items).filter(item => {
            return item.canEquip && 
                   item.type !== 'key' && 
                   item.id !== 'gate_key' && 
                   (item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory');
        });
        
        if (equipmentItems.length === 0) {
            console.warn('No equipment items found');
            return null;
        }
        
        // Select random equipment item
        const randomIndex = Math.floor(Math.random() * equipmentItems.length);
        return equipmentItems[randomIndex].clone();
    }
}