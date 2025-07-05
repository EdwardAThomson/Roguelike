// New module for managing input

export class InputManager {
    constructor(game) {
        this.game = game;
        this.input = game.input;
    }

    handleInput() {
        // Skip input if not in playing state
        if (this.game.stateManager && typeof this.game.stateManager.isPlaying === 'function') {
            if (!this.game.stateManager.isPlaying()) {
                return;
            }
        } else if (this.game.gameState !== 'playing') {
            // Fallback to direct gameState check
            return;
        }
        
        this.handleMovement();
        this.handleItemInteraction();
    }

    handleMovement() {
        if (!this.game.player) return;
        
        let newX = this.game.player.x;
        let newY = this.game.player.y;
        let moved = false;
        
        // Handle movement
        if (this.input.isKeyDown('ArrowUp') || this.input.isKeyDown('w')) {
            newY = Math.max(0, this.game.player.y - 1);
            moved = true;
        } else if (this.input.isKeyDown('ArrowDown') || this.input.isKeyDown('s')) {
            newY = Math.min(this.game.gridHeight - 1, this.game.player.y + 1);
            moved = true;
        } else if (this.input.isKeyDown('ArrowLeft') || this.input.isKeyDown('a')) {
            newX = Math.max(0, this.game.player.x - 1);
            moved = true;
        } else if (this.input.isKeyDown('ArrowRight') || this.input.isKeyDown('d')) {
            newX = Math.min(this.game.gridWidth - 1, this.game.player.x + 1);
            moved = true;
        }
        
        // Try to move the player or attack a monster
        if (moved) {
            // Check if there's a monster at the target position
            const monster = this.getMonsterAt(newX, newY);
            
            // Check if there's a gate at the target position
            const tileType = this.game.map[newY] && this.game.map[newY][newX];
            const isGate = tileType === 'gate';
            
            if (monster) {
                // Attack the monster instead of moving
                this.handlePlayerAttack(newX, newY);
            } else if (isGate) {
                // Handle gate interaction with world gates
                const gate = this.game.dungeon.getGateAt(newX, newY);
                
                if (gate) {
                    // Handle gate transition
                    this.handleGateTransition(gate);
                }
            } else {
                // No monster, try to move
                this.game.player.tryMove(newX, newY, this.game);
            }
        }
    }

    // Helper method to get monster at position
    getMonsterAt(x, y) {
        // Use combat manager if available
        if (this.game.combat && typeof this.game.combat.getMonsterAt === 'function') {
            return this.game.combat.getMonsterAt(x, y);
        }
        // Fallback to game's method
        else if (typeof this.game.getMonsterAt === 'function') {
            return this.game.getMonsterAt(x, y);
        }
        // Direct check as last resort
        else {
            return this.game.monsters.find(monster => monster.x === x && monster.y === y);
        }
    }

    // Helper method to handle player attack
    handlePlayerAttack(x, y) {
        // Use combat manager if available
        if (this.game.combat && typeof this.game.combat.handlePlayerAttack === 'function') {
            this.game.combat.handlePlayerAttack(x, y);
        }
        // Fallback to game's method
        else if (typeof this.game.handlePlayerAttack === 'function') {
            this.game.handlePlayerAttack(x, y);
        }
    }

    handleGateTransition(gate) {
        console.log(`<> We are about to transition. We are in ${this.game.worldManager.currentSectionId}<>`);
        
        let worldX = this.game.worldX;
        let worldY = this.game.worldY;
        
        switch(gate.direction) {
            case 'north': worldY += 1; break;
            case 'east': worldX += 1; break;
            case 'south': worldY -= 1; break;
            case 'west': worldX -= 1; break;
        }
        
        console.log(`Here are the NEW coordinates: ${worldX}, ${worldY}`);
        
        // Use the appropriate transition method
        if (typeof this.game.transitionToWorldSection === 'function') {
            this.game.transitionToWorldSection(worldX, worldY, gate.direction);
        } else if (this.game.worldManager && typeof this.game.worldManager.transitionToSection === 'function') {
            this.game.worldManager.transitionToSection(worldX, worldY, gate.direction);
        }
        
        // Add flavor text
        this.game.ui.addMessage(`You step through the gate into a new area!`, "#0ff");
    }

    handleItemInteraction() {
        // Check for item pickup
        if (this.input.isKeyPressed('g')) {
            const itemsAtPosition = this.game.itemManager.getItemsAt(this.game.player.x, this.game.player.y);
            if (itemsAtPosition.length > 0) {
                this.game.itemManager.playerPickupItem(this.game.player.x, this.game.player.y);
            } else {
                this.game.ui.addMessage('There is nothing here to pick up.', '#aaa');
            }
        }
        
        // Check for pickup and equip in one action
        if (this.input.isKeyPressed('p')) {
            this.handleEquipItem();
        }
        
        // Check for using item (u key)
        if (this.input.isKeyPressed('u')) {
            // Show a message about using items from inventory
            this.game.ui.addMessage('Open inventory (I) to use items', '#aaa');
        }
        
        // Check for dropping item (d key)
        if (this.input.isKeyPressed('d')) {
            // Open the inventory in drop mode
            if (this.game.ui && this.game.ui.inventoryUI) {
                this.game.ui.inventoryUI.toggleInventory(true);
                this.game.ui.addMessage('Select an item to drop', '#aaa');
            } else {
                this.game.ui.addMessage('Open inventory (I) to drop items', '#aaa');
            }
        }
        
        // Map reveal toggle
        if (this.input.isKeyPressed('m')) {
            this.game.mapRevealed = !this.game.mapRevealed;
            this.game.ui.addMessage(this.game.mapRevealed ? 
                'Full map revealed (cheat mode).' : 
                'Map reveal disabled.', 
                this.game.mapRevealed ? '#ff0' : '#aaa');
        }
    }

    handleEquipItem() {
        const itemsAtPosition = this.game.itemManager.getItemsAt(this.game.player.x, this.game.player.y);
        if (itemsAtPosition.length > 0) {
            const groundItem = itemsAtPosition[0];
            
            // Only try to equip if the item is equippable
            if (groundItem.item.canEquip && groundItem.item.slot) {
                // First, add to inventory (will remove from ground if successful)
                const addSuccess = this.game.player.pickupItem(groundItem.item, this.game);
                
                if (addSuccess) {
                    // Find the item in the inventory (it'll be the last one added)
                    const inventoryIndex = this.game.player.inventory.items.length - 1;
                    
                    // Try to equip it
                    const equipSuccess = this.game.player.equipItemFromInventory(inventoryIndex, this.game);
                    
                    if (equipSuccess) {
                        this.game.ui.addMessage(`Picked up and equipped ${groundItem.item.name}`, '#5f5');
                    }
                    
                    // Remove from ground
                    const itemIndex = this.game.itemManager.itemsOnGround.findIndex(
                        item => item.x === this.game.player.x && item.y === this.game.player.y
                    );
                    if (itemIndex !== -1) {
                        this.game.itemManager.removeItemFromGround(itemIndex);
                    }
                }
            } else {
                this.game.ui.addMessage(`${groundItem.item.name} cannot be equipped`, '#f55');
            }
        } else {
            this.game.ui.addMessage('There is nothing here to pick up and equip.', '#aaa');
        }
    }
    
    // Handle UI-related key presses (can be called even when not in playing state)
    handleUIInput() {
        // Inventory toggle
        if (this.input.isKeyPressed('i')) {
            if (this.game.ui && this.game.ui.inventoryUI) {
                this.game.ui.inventoryUI.toggleInventory();
            }
        }
        
        // Character screen toggle
        if (this.input.isKeyPressed('c')) {
            if (this.game.ui && this.game.ui.gameUI) {
                this.game.ui.gameUI.toggleCharacterScreen();
            }
        }
        
        // Help screen toggle
        if (this.input.isKeyPressed('h')) {
            if (this.game.ui && this.game.ui.helpScreen) {
                this.game.ui.helpScreen.toggleHelpScreen();
            }
        }
    }
} 