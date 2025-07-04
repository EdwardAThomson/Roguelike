import { GameUI } from './gameUI.js';
import { InventoryUI } from './inventoryUI.js';
import { EquipmentDisplay } from './equipmentDisplay.js';
import { HelpScreen } from './helpScreen.js';

export class UI {
    constructor(game) {
        this.game = game;
        
        // Initialize UI components
        this.gameUI = new GameUI(game);
        this.inventoryUI = new InventoryUI(game);
        this.equipmentDisplay = new EquipmentDisplay(game);
        this.helpScreen = new HelpScreen(game);
        
        // Create backup UI buttons
        this.createEmergencyButtons();
    }
    
    initialize() {
        this.gameUI.initialize();
    }
    
    createEmergencyButtons() {
        const container = document.getElementById('ui-container');
        if (!container) return;
        
        // Create emergency button container
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'position: relative; margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;';
        container.appendChild(buttonContainer);
        
        // Create inventory button
        const invButton = document.createElement('button');
        invButton.textContent = 'Inventory';
        invButton.style.cssText = 'padding: 8px 16px; background: #22a; color: white; border: none; border-radius: 4px; cursor: pointer;';
        invButton.onclick = () => {
            console.log('Emergency inventory button clicked');
            this.inventoryUI.toggleInventory();
        };
        buttonContainer.appendChild(invButton);
        
        // Create character button
        const charButton = document.createElement('button');
        charButton.textContent = 'Character';
        charButton.style.cssText = 'padding: 8px 16px; background: #2a2; color: white; border: none; border-radius: 4px; cursor: pointer;';
        charButton.onclick = () => {
            console.log('Emergency character button clicked');
            this.gameUI.toggleCharacterScreen();
        };
        buttonContainer.appendChild(charButton);
        
        // Create pickup button
        const pickupButton = document.createElement('button');
        pickupButton.textContent = 'Pickup (G)';
        pickupButton.style.cssText = 'padding: 8px 16px; background: #a22; color: white; border: none; border-radius: 4px; cursor: pointer;';
        pickupButton.onclick = () => {
            console.log('Emergency pickup button clicked');
            if (this.game.player) {
                const itemsAtPosition = this.game.itemManager.getItemsAt(this.game.player.x, this.game.player.y);
                if (itemsAtPosition && itemsAtPosition.length > 0) {
                    this.game.itemManager.playerPickupItem(this.game.player.x, this.game.player.y);
                } else {
                    this.addMessage('There is nothing here to pick up.', '#aaa');
                }
            }
        };
        buttonContainer.appendChild(pickupButton);
        
        // Create equip button
        const equipButton = document.createElement('button');
        equipButton.textContent = 'Equip (E)';
        equipButton.style.cssText = 'padding: 8px 16px; background: #aa2; color: white; border: none; border-radius: 4px; cursor: pointer;';
        equipButton.onclick = () => {
            console.log('Emergency equip button clicked');
            if (this.game.player) {
                const itemsAtPosition = this.game.itemManager.getItemsAt(this.game.player.x, this.game.player.y);
                if (itemsAtPosition && itemsAtPosition.length > 0) {
                    const groundItem = itemsAtPosition[0];
                    
                    // Only try to equip if the item is equippable
                    if (groundItem.item.canEquip && groundItem.item.slot) {
                        // Find the index of the item in the ground items array
                        const itemIndex = this.game.itemManager.itemsOnGround.findIndex(
                            item => item.x === this.game.player.x && item.y === this.game.player.y
                        );
                        
                        if (itemIndex !== -1) {
                            // First, add to inventory
                            const addSuccess = this.game.player.pickupItem(groundItem.item, this.game);
                            
                            if (addSuccess) {
                                // Remove from ground AFTER successful pickup
                                this.game.itemManager.removeItemFromGround(itemIndex);
                                
                                // Find the item in the inventory (it'll be the last one added)
                                const inventoryIndex = this.game.player.inventory.items.length - 1;
                                
                                // Try to equip it
                                this.game.player.equipItemFromInventory(inventoryIndex, this.game);
                            }
                        }
                    } else {
                        this.addMessage('This item cannot be equipped.', '#f55');
                    }
                } else {
                    this.addMessage('There is nothing here to equip.', '#aaa');
                }
            }
        };
        buttonContainer.appendChild(equipButton);
    }
    
    addMessage(message, color = '#fff') {
        this.gameUI.addMessage(message, color);
    }
    
    update() {
        this.gameUI.update();
        this.equipmentDisplay.update();
        
        // Process key presses for UI elements
        if (this.game.input) {
            // this console log spams the console with a lot of messages.
            // console.log("UI update checking for key presses");
            
            // Get key states directly
            const iPressed = this.game.input.isKeyPressed('i');
            const cPressed = this.game.input.isKeyPressed('c');
            const hPressed = this.game.input.isKeyPressed('h');
            
            // Handle each key separately
            if (iPressed) {
                console.log('I key pressed, toggling inventory');
                this.inventoryUI.toggleInventory();
                this.game.input.resetKey('i');
            }
            
            if (cPressed) {
                console.log('C key pressed, toggling character screen');
                this.gameUI.toggleCharacterScreen();
                this.game.input.resetKey('c');
            }
            
            if (hPressed) {
                console.log('H key pressed, toggling help screen');
                this.helpScreen.toggleHelpScreen();
                this.game.input.resetKey('h');
            }
        }
    }
    
    toggleInventory() {
        this.inventoryUI.toggleInventory();
    }
    
    get showCharacterScreen() {
        return this.gameUI.showCharacterScreen;
    }
}