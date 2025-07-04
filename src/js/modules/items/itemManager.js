import { ItemDatabase } from './itemDatabase.js';
import { Item } from './item.js';

export class ItemManager {
    constructor(game) {
        this.game = game;
        this.itemsOnGround = []; // Items in the dungeon
        this.itemDB = new ItemDatabase();
        
        // Debug output about the item database
        if (this.itemDB && this.itemDB.items) {
            console.log(`ItemManager: Item database initialized with ${this.itemDB.items.length} items`);
            
            // Log a few sample items
            if (this.itemDB.items.length > 0) {
                console.log("Sample items:");
                for (let i = 0; i < Math.min(3, this.itemDB.items.length); i++) {
                    const item = this.itemDB.items[i];
                    console.log(`- ${item.name} (${item.type}): ${item.description}`);
                    console.log(`  Icon:`, item.icon);
                }
            }
        } else {
            console.warn("ItemManager: No item database or empty database");
        }
    }
    
    // Create a gold pile item (used when monsters drop loot)
    createGoldPile(amount) {
        return new Item({
            id: 'gold',
            name: `${amount} Gold`,
            description: `A small pile of ${amount} gold coins.`,
            icon: '🪙',
            color: 'gold',
            type: 'currency',
            stackable: true,
            quantity: amount,
            value: amount
        });
    }
    
    // Add an item to the dungeon
    addItemToGround(item, x, y) {
        this.itemsOnGround.push({
            item: item,
            x: x,
            y: y
        });
        // console.log(`ItemManager (addItemToGround): itemsOnGround`, this.itemsOnGround);
    }
    
    // TODO:remove this
    // Generate a random item and place it on the ground
    // TODO: x and y are not being passed!
    // placeRandomItem(x, y, level = 1) {
    //    const item = this.itemDB.getRandomItemByLevel(level);

        // console.log("ItemManager (Y): Placing random item", item, "at", x, y);
        // if (item) {
        //    this.addItemToGround(item, x, y);
        // }
    // \s}
    
    // Create and place a specific gate key
    createGateKey(gateId, x, y) {
        // Get the base gate key template
        const keyTemplate = this.itemDB.getItem('gate_key');
        
        if (!keyTemplate) {
            console.error("Gate key template not found in item database");
            return null;
        }
        
        // Customize for this specific gate
        const gateKey = keyTemplate.clone();
        gateKey.id = `gate_key_${gateId}`;
        gateKey.name = `Gate ${gateId} Key`;
        gateKey.description = `A special key that unlocks Gate ${gateId} in the dungeon.`;
        gateKey.gateId = gateId;
        
        // Make the key visually distinct based on the gate ID
        // Choose a different color for each key based on the gate ID
        const keyColors = [
            '#FFD700', // Gold (default)
            '#FF5733', // Red-orange
            '#33FF57', // Green
            '#3357FF', // Blue
            '#FF33F5', // Pink
            '#33FFF5', // Cyan
            '#F5FF33'  // Yellow
        ];
        
        gateKey.color = keyColors[gateId % keyColors.length];
        
        // Add a visual indicator of which gate this key opens
        gateKey.name = `Key to Gate ${gateId}`;
        gateKey.icon = '🗝️'; // Special key icon
        
        // Place it in the world
        this.addItemToGround(gateKey, x, y);
        
        console.log(`Created key for gate ${gateId} at (${x}, ${y})`);
        return gateKey;
    }
    
    // Spawn items in the dungeon (call after dungeon generation)
    populateDungeon(count) {
        console.log(`ItemManager: Attempting to place ${count} items...`);
        // console.log(`ItemManager: Current floor tiles: ${this.getFloorTileCount()}`);
        
        let itemsPlaced = 0;
        
        for (let i = 0; i < count; i++) {

            // Only placing low level items for now ?
            // const item = this.placeRandomItem(); // x and y are not being passed!
            // const level = 1;
            const item = this.itemDB.getRandomItemByLevel();
            
            const itemName = item.name;
            const position = this.getRandomFloorPosition();
            
            if (position) {
                this.addItemToGround(item, position.x, position.y); // is this redundant?
                //console.log(`ItemManager (X): Placed item ${itemName} at (${position.x}, ${position.y})`);
                itemsPlaced++;
            } else {
                console.warn(`ItemManager: Could not find floor position for item ${i+1}`);
            }
        }
        
        console.log(`ItemManager: Successfully placed ${itemsPlaced} items`);
        return itemsPlaced;
    }
    
    // Helper method to count available floor tiles
    getFloorTileCount() {
        if (!this.game.map || !this.game.map.length) {
            return 0;
        }
        
        let count = 0;
        for (let y = 0; y < this.game.map.length; y++) {
            for (let x = 0; x < this.game.map[y].length; x++) {
                if (this.game.map[y][x] === 'floor') {
                    count++;
                }
            }
        }
        return count;
    }
    
    // Check if there's an item at a position
    getItemsAt(x, y) {
        return this.itemsOnGround.filter(item => item.x === x && item.y === y);
    }
    
    // Remove an item from the ground
    removeItemFromGround(index) {
        if (index >= 0 && index < this.itemsOnGround.length) {
            return this.itemsOnGround.splice(index, 1)[0];
        }
        return null;
    }
    
    // Handle player picking up an item
    playerPickupItem(x, y) {
        const itemsAtPosition = this.getItemsAt(x, y);
        if (itemsAtPosition.length === 0) {
            return false;
        }
        
        // Find the index of the item in the array
        const itemIndex = this.itemsOnGround.findIndex(
            item => item.x === x && item.y === y
        );
        
        if (itemIndex === -1) return false;
        
        // Get the item
        const groundItem = this.itemsOnGround[itemIndex];
        
        // Try to add to player's inventory
        const success = this.game.player.pickupItem(groundItem.item, this.game);
        
        // If success, remove from ground
        if (success) {
            this.removeItemFromGround(itemIndex);
            return true;
        }
        
        return false;
    }

    getRandomFloorPosition() {
        if (!this.game.dungeon || !this.game.map) {
            console.error(`ItemManager: No dungeon or map available for floor position selection`);
            return null;
        }
        
        // Use the dungeon's method if available
        if (typeof this.game.dungeon.getRandomFloorPosition === 'function') {
            const pos = this.game.dungeon.getRandomFloorPosition();
            // console.log(`ItemManager: Got floor position (${pos.x}, ${pos.y}) from dungeon`);
            return pos;
        }
        
        // Otherwise, find one manually
        const floorTiles = [];
        for (let y = 0; y < this.game.map.length; y++) {
            for (let x = 0; x < this.game.map[y].length; x++) {
                if (this.game.map[y][x] === 'floor') {
                    floorTiles.push({x, y});
                }
            }
        }
        
        if (floorTiles.length === 0) {
            console.error(`ItemManager: No floor tiles found in map`);
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * floorTiles.length);
        console.log(`ItemManager: Manually found floor position (${floorTiles[randomIndex].x}, ${floorTiles[randomIndex].y})`);
        return floorTiles[randomIndex];
    }
    
    // Render items on the ground
    render(ctx, mapRevealed = false) {
        // Get the game instance
        const game = this.game;
        
        // Only render items that are within the viewport
        for (const groundItem of this.itemsOnGround) {
            // Calculate item's position in viewport coordinates
            const viewportX = groundItem.x - game.cameraX;
            const viewportY = groundItem.y - game.cameraY;
            
            // Only render if in viewport and visible to player
            if (viewportX >= 0 && viewportX < game.viewportWidth &&
                viewportY >= 0 && viewportY < game.viewportHeight) {
                
                const key = `${groundItem.x},${groundItem.y}`;
                const isVisible = game.fov.visible.has(key) || mapRevealed; // Add mapRevealed check
                
                if (isVisible) {
                    // Render the item - FIX: Use icon instead of symbol
                    ctx.fillStyle = groundItem.item.color || '#ff0';
                    ctx.font = 'bold 16px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const centerX = viewportX * game.tileSize + game.tileSize / 2;
                    const centerY = viewportY * game.tileSize + game.tileSize / 2;
                    ctx.fillText(groundItem.item.icon || '?', centerX, centerY);
                }
            }
        }
    }

    cleanupInvalidItems() {
        if (!this.itemsOnGround || !Array.isArray(this.itemsOnGround)) {
            console.warn("No itemsOnGround array to clean");
            this.itemsOnGround = [];
            return 0;
        }
        
        const originalCount = this.itemsOnGround.length;
        
        // Filter out invalid entries
        this.itemsOnGround = this.itemsOnGround.filter(groundItem => {
            if (!groundItem || !groundItem.item) {
                console.log(`Removing invalid groundItem at position (${groundItem?.x}, ${groundItem?.y})`);
                return false;
            }
            return true;
        });
        
        const removedCount = originalCount - this.itemsOnGround.length;
        if (removedCount > 0) {
            console.log(`Cleaned up ${removedCount} invalid items`);
        }
        
        return removedCount;
    }
}