export class Inventory {
    constructor(size = 20) {
        this.maxSize = size;
        this.items = [];
        this.gold = 0;
        this.equipment = {
            head: null,
            body: null,
            feet: null,
            weapon: null,
            offhand: null,
            ring: null,
            amulet: null
        };
    }
    
    // Add an item to the inventory
    addItem(item) {
        // Handle stackable items
        if (item.stackable) {
            const existingItem = this.items.find(i => i.id === item.id);
            if (existingItem) {
                existingItem.quantity += item.quantity;
                return true;
            }
        }
        
        // Check if inventory is full
        if (this.items.length >= this.maxSize) {
            console.log('Inventory is full!');
            return false;
        }
        
        this.items.push(item);
        return true;
    }
    
    // Remove an item from the inventory
    removeItem(index) {
        if (index < 0 || index >= this.items.length) {
            console.log('Invalid item index');
            return null;
        }
        
        return this.items.splice(index, 1)[0];
    }
    
    // Get an item at a specific index
    getItem(index) {
        if (index < 0 || index >= this.items.length) {
            return null;
        }
        
        return this.items[index];
    }
    
    // Use an item at a specific index
    useItem(index, entity, game) {
        const item = this.getItem(index);
        if (!item) return false;
        
        if (!item.canUse) {
            console.log(`${item.name} cannot be used`);
            return false;
        }
        
        // Pass game object for spell scrolls that need targeting
        const used = item.use(entity, game);
        
        // If item was used and quantity is now 0, remove it
        if (used && item.quantity <= 0) {
            this.removeItem(index);
        }
        
        return used;
    }
    
    // Equip an item at a specific index
    equipItem(index, entity) {
        const item = this.getItem(index);
        if (!item) return false;
        
        if (!item.canEquip || !item.slot) {
            console.log(`${item.name} cannot be equipped`);
            return false;
        }
        
        // Unequip current item in that slot if exists
        if (this.equipment[item.slot]) {
            this.unequipItem(item.slot, entity);
        }
        
        // Remove from inventory and add to equipment
        this.removeItem(index);
        this.equipment[item.slot] = item;
        
        // Apply item effects
        item.equip(entity);
        
        return true;
    }
    
    // Unequip an item from a specific slot
    unequipItem(slot, entity) {
        const item = this.equipment[slot];
        if (!item) return false;
        
        // Check if inventory has space - this is now also checked in the UI
        if (this.items.length >= this.maxSize) {
            console.log('Inventory is full, cannot unequip');
            return false;
        }
        
        // Remove from equipment and add to inventory
        this.equipment[slot] = null;
        this.items.push(item);
        
        // Remove item effects
        item.unequip(entity);
        
        return true;
    }
    
    // Drop an item from inventory
    dropItem(index) {
        return this.removeItem(index);
    }
    
    // Get total weight of inventory
    getTotalWeight() {
        return this.items.reduce((total, item) => {
            const itemWeight = item.weight || 0;
            return total + (itemWeight * (item.quantity || 1));
        }, 0);
    }
    
    // Find an item by ID
    findItem(id) {
        return this.items.findIndex(item => item.id === id);
    }
    
    // Find the index of an item by ID (alias for findItem for clarity)
    findItemIndex(id) {
        return this.findItem(id);
    }
    
    // Check if inventory has item of a specific type
    hasItemOfType(itemId) {
        return this.items.some(item => item.id === itemId);
    }
    
    // Get all equipped items
    getAllEquipped() {
        return Object.values(this.equipment).filter(item => item !== null);
    }
    
    // Get equipped weapon
    getEquippedWeapon() {
        return this.equipment.weapon;
    }
    
    // Sort inventory by type
    sortInventory() {
        this.items.sort((a, b) => {
            // First sort by type
            if (a.type !== b.type) {
                const typeOrder = ['weapon', 'armor', 'potion', 'scroll', 'misc', 'currency'];
                return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
            }
            
            // Then by rarity
            const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
            return rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
        });
    }
    
    // Clear inventory
    clear() {
        this.items = [];
        this.equipment = {
            head: null,
            body: null,
            feet: null,
            weapon: null,
            offhand: null,
            ring: null,
            amulet: null
        };
    }
}