export class InventoryUI {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.selectedItemIndex = -1;
        this.selectedEquipSlot = null;
        this.itemDetailsVisible = false;
        this.dropMode = false;
        
        // Create UI elements
        this.inventoryElement = null;
        this.itemDetailsElement = null;
        this.createInventoryUI();
        
        // Bind methods
        this.handleDropModeKeys = this.handleDropModeKeys.bind(this);
    }
    
    createInventoryUI() {
        const container = document.getElementById('overlay-container');
        
        // Create inventory screen
        this.inventoryElement = document.createElement('div');
        this.inventoryElement.id = 'inventory-screen';
        this.inventoryElement.className = 'inventory-screen';
        this.inventoryElement.style.display = 'none';
        container.appendChild(this.inventoryElement);
        
        // Create item details panel
        this.itemDetailsElement = document.createElement('div');
        this.itemDetailsElement.id = 'item-details';
        this.itemDetailsElement.className = 'item-details';
        this.itemDetailsElement.style.display = 'none';
        container.appendChild(this.itemDetailsElement);
        
        // Add styles
        this.addStyles();
        
        // Add event listeners (Escape, number keys, and action keys)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeInventory();
            } else if (this.isOpen) {
                // E key to equip selected item
                if ((e.key === 'e' || e.key === 'E') && this.selectedItemIndex >= 0) {
                    const item = this.game.player.inventory.items[this.selectedItemIndex];
                    if (item && item.canEquip) {
                        this.handleItemAction('equip', this.selectedItemIndex);
                    }
                }
                // U key to use selected item
                else if ((e.key === 'u' || e.key === 'U') && this.selectedItemIndex >= 0) {
                    const item = this.game.player.inventory.items[this.selectedItemIndex];
                    if (item && item.canUse) {
                        this.handleItemAction('use', this.selectedItemIndex);
                    }
                }
                // Number keys for quick actions when inventory is open
                else {
                    const numKey = parseInt(e.key);
                    if (!isNaN(numKey) && numKey >= 1 && numKey <= 9) {
                        const index = numKey - 1;
                        if (index < this.game.player.inventory.items.length) {
                            this.selectItem(index);
                            const item = this.game.player.inventory.items[index];
                            
                            // If holding Alt, use item
                            if (e.altKey && item.canUse) {
                                this.handleItemAction('use', index);
                            }
                            // If holding Shift, equip item
                            else if (e.shiftKey && item.canEquip) {
                                this.handleItemAction('equip', index);
                            }
                        }
                    }
                }
            }
        });
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .inventory-screen {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: rgba(0, 0, 0, 0.9);
                color: #fff;
                padding: 20px;
                border-radius: 10px;
                font-family: monospace;
                z-index: 100;
                width: 80%;
                max-width: 800px;
                max-height: 85vh;
                overflow-y: auto;
                border: 2px solid #444;
                display: flex;
                flex-direction: column;
            }
            
            .inventory-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                border-bottom: 1px solid #444;
                padding-bottom: 10px;
            }
            
            .inventory-title {
                font-size: 1.4em;
                font-weight: bold;
                color: #ddd;
            }
            
            .inventory-stats {
                font-size: 0.9em;
                color: #999;
            }
            
            .inventory-gold {
                color: gold;
                font-weight: bold;
            }
            
            .inventory-instructions {
                text-align: center;
                font-size: 0.8em;
                color: #888;
                margin-bottom: 10px;
                padding: 5px;
                background-color: rgba(0,0,0,0.3);
                border-radius: 3px;
            }
            
            .inventory-container {
                display: flex;
                gap: 20px;
                flex: 1;
            }
            
            .inventory-items {
                flex: 3;
                overflow-y: auto;
                max-height: 60vh;
            }
            
            .equipment-slots {
                flex: 2;
                display: flex;
                flex-direction: column;
                gap: 10px;
                border-left: 1px solid #444;
                padding-left: 15px;
            }
            
            .equipment-hint {
                text-align: center;
                font-size: 0.8em;
                color: #888;
                margin-bottom: 10px;
            }
            
            .item-slot {
                background-color: rgba(50, 50, 50, 0.5);
                border: 1px solid #666;
                border-radius: 5px;
                padding: 10px;
                display: flex;
                align-items: center;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .item-slot:hover {
                background-color: rgba(70, 70, 70, 0.8);
            }
            
            .item-slot.selected {
                background-color: rgba(60, 100, 60, 0.5);
                border-color: #5a5;
            }
            
            .item-slot-empty {
                opacity: 0.6;
            }
            
            .item-icon {
                font-size: 1.5em;
                margin-right: 10px;
                display: flex;
                justify-content: center;
                align-items: center;
                width: 30px;
                height: 30px;
            }
            
            .item-row {
                display: flex;
                align-items: center;
                padding: 8px;
                margin-bottom: 5px;
                background-color: rgba(40, 40, 40, 0.7);
                border: 1px solid #555;
                border-radius: 5px;
                cursor: pointer;
                transition: background-color 0.2s;
            }
            
            .item-row:hover {
                background-color: rgba(60, 60, 60, 0.8);
            }
            
            .item-row.selected {
                background-color: rgba(60, 100, 60, 0.5);
                border-color: #5a5;
            }
            
            .item-name {
                flex: 1;
            }
            
            .item-info {
                display: flex;
                flex-direction: column;
                margin-left: 10px;
            }
            
            .item-quantity {
                background-color: rgba(0, 0, 0, 0.5);
                border-radius: 10px;
                padding: 2px 6px;
                font-size: 0.8em;
                margin-left: 5px;
            }
            
            .item-type {
                font-size: 0.8em;
                color: #888;
            }
            
            .item-actions {
                display: flex;
                gap: 3px;
            }
            
            .item-button {
                width: 20px;
                height: 20px;
                background-color: #333;
                border: 1px solid #555;
                color: #fff;
                font-size: 10px;
                border-radius: 3px;
                cursor: pointer;
                padding: 0;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .item-button.equip {
                background-color: #22a;
                border-color: #44c;
            }
            
            .item-button.use {
                background-color: #2a2;
                border-color: #4c4;
            }
            
            .item-button.unequip {
                background-color: #a22;
                border-color: #c44;
            }
            
            .item-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .item-details {
                position: absolute;
                background-color: rgba(0, 0, 0, 0.95);
                border: 1px solid #555;
                border-radius: 5px;
                padding: 10px;
                max-width: 300px;
                z-index: 101;
                color: #ddd;
                font-family: monospace;
                pointer-events: none;
            }
            
            .item-details-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                border-bottom: 1px solid #555;
                padding-bottom: 5px;
            }
            
            .item-details-name {
                font-weight: bold;
            }
            
            .item-details-rarity {
                font-style: italic;
                font-size: 0.9em;
            }
            
            .item-details-description {
                margin: 5px 0;
                font-size: 0.9em;
                color: #999;
            }
            
            .item-details-stats {
                margin-top: 10px;
                font-size: 0.9em;
                color: #0f0;
            }
            
            .item-details-actions {
                margin-top: 15px;
                display: flex;
                gap: 5px;
            }
            
            .inventory-button {
                background-color: #333;
                border: 1px solid #555;
                color: #fff;
                padding: 6px 10px;
                border-radius: 5px;
                cursor: pointer;
                font-family: monospace;
                transition: background-color 0.2s;
            }
            
            .inventory-button:hover {
                background-color: #444;
            }
            
            .inventory-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .inventory-button.use {
                background-color: #2a2;
                border-color: #4c4;
            }
            
            .inventory-button.equip {
                background-color: #22a;
                border-color: #44c;
            }
            
            .inventory-button.drop {
                background-color: #a22;
                border-color: #c44;
            }
            
            .inventory-button.unequip {
                background-color: #922;
                border-color: #c44;
                font-size: 14px;
                padding: 2px 8px;
            }
            
            .inventory-footer {
                margin-top: 15px;
                border-top: 1px solid #444;
                padding-top: 10px;
                display: flex;
                justify-content: center;
            }
            
            .close-button {
                background-color: #333;
                border: 1px solid #555;
                color: #fff;
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-family: monospace;
            }
            
            /* Rarity colors */
            .rarity-common {
                color: #aaa;
            }
            
            .rarity-uncommon {
                color: #5d5;
            }
            
            .rarity-rare {
                color: #55d;
            }
            
            .rarity-epic {
                color: #c5c;
            }
            
            .rarity-legendary {
                color: #fb0;
            }
            
            .item-quantity {
                color: #888;
                font-weight: bold;
                font-size: 0.9em;
            }
        `;
        document.head.appendChild(style);
    }
    
    toggleInventory(dropMode = false) {
        console.log(`toggleInventory called, current state: ${this.isOpen ? 'open' : 'closed'}`);
        
        if (this.isOpen) {
            this.closeInventory();
        } else {
            this.openInventory(dropMode);
        }
        
        // After toggle, dump state to console for debugging
        console.log(`Inventory now: ${this.isOpen ? 'open' : 'closed'}`);
        console.log(`Game state: ${this.game.gameState}`);
        console.log(`Inventory element display: ${this.inventoryElement.style.display}`);
    }
    
    openInventory(dropMode = false) {
        console.log("Opening inventory");
        this.isOpen = true;
        this.inventoryElement.style.display = 'flex';
        
        const overlay = document.getElementById('overlay-container');
        if (overlay) {
            overlay.classList.add('active');
            console.log("Overlay container activated");
        } else {
            console.error("Overlay container element not found!");
        }
        
        // If in drop mode, highlight the drop action specifically
        this.dropMode = dropMode;
        
        this.updateInventory();
        
        // Pause game while inventory is open
        this.game.gameState = 'inventory';
    }
    
    closeInventory() {
        console.log("Closing inventory");
        this.isOpen = false;
        this.inventoryElement.style.display = 'none';
        
        const overlay = document.getElementById('overlay-container');
        if (overlay) {
            overlay.classList.remove('active');
            console.log("Overlay container deactivated");
        }
        
        this.hideItemDetails();
        
        // Remove drop mode event listener if it was active
        if (this.dropMode) {
            document.removeEventListener('keydown', this.handleDropModeKeys);
            this.dropMode = false;
        }
        
        // Resume game
        this.game.gameState = 'playing';
    }
    
    updateInventory() {
        if (!this.isOpen) return;
        
        const player = this.game.player;
        const inventory = player.inventory;
        
        // Update inventory UI
        let html = `
            <div class="inventory-header">
                <div class="inventory-title">${this.dropMode ? 'Select Item to Drop' : 'Inventory'}</div>
                <div class="inventory-stats">
                    <span>Space: ${inventory.items.length}/${inventory.maxSize}</span>
                    <span class="inventory-gold">🪙 Gold: ${inventory.gold}</span>
                </div>
            </div>
            <div class="inventory-instructions">
                ${this.dropMode ? 
                'Click item to drop • D key to cancel' : 
                'Click item to select • Number keys (1-9) to select • E to equip • U to use • Shift+Number to equip • Alt+Number to use'}
            </div>
            <div class="inventory-container">
                <div class="inventory-items">
        `;
        
        // Add items
        if (inventory.items.length === 0) {
            html += `<div class="item-row item-slot-empty">No items in inventory</div>`;
        } else {
            for (let i = 0; i < inventory.items.length; i++) {
                const item = inventory.items[i];
                const selected = i === this.selectedItemIndex ? 'selected' : '';
                const rarityClass = `rarity-${item.rarity}`;
                
                // Add additional UI elements based on item type
                let actionButtons = '';
                if (item.canEquip) {
                    actionButtons += `<button class="item-button equip" data-index="${i}" title="Equip">E</button>`;
                }
                if (item.canUse) {
                    actionButtons += `<button class="item-button use" data-index="${i}" title="Use">U</button>`;
                }
                
                html += `
                    <div class="item-row ${selected}" data-index="${i}">
                        <div class="item-icon">${item.icon}</div>
                        <div class="item-info">
                            <div class="item-name ${item.equipped ? 'equipped' : ''} rarity-${item.rarity}">
                                ${item.name} ${item.equipped ? '(E)' : ''}${item.stackable && item.quantity > 1 ? ` <span class="item-quantity">x${item.quantity}</span>` : ''}
                            </div>
                            <div class="item-description">${item.description}</div>
                        </div>
                        <div class="item-actions">
                            ${item.canEquip && item.slot ? 
                                `<button class="item-button equip" data-index="${i}" title="Equip">E</button>` : ''}
                            ${item.canUse ? 
                                `<button class="item-button use" data-index="${i}" title="Use">U</button>` : ''}
                            <button class="item-button drop" data-index="${i}" title="Drop">🗑️</button>
                        </div>
                    </div>
                `;
            }
        }
        
        html += `</div>
                <div class="equipment-slots">
                    <h3>Equipment</h3>
                    <div class="equipment-hint">Click on an equipped item to see its stats</div>`;
        
        // Add equipment slots
        const slots = {
            head: { name: 'Head', icon: '🧢' },
            body: { name: 'Body', icon: '👕' },
            feet: { name: 'Feet', icon: '👢' },
            weapon: { name: 'Weapon', icon: '⚔️' },
            offhand: { name: 'Off-hand', icon: '🛡️' },
            ring: { name: 'Ring', icon: '💍' },
            amulet: { name: 'Amulet', icon: '📿' }
        };
        
        for (const [slotKey, slotInfo] of Object.entries(slots)) {
            const equippedItem = inventory.equipment[slotKey];
            const isEmpty = !equippedItem;
            const selected = slotKey === this.selectedEquipSlot ? 'selected' : '';
            
            html += `
                <div class="item-slot ${isEmpty ? 'item-slot-empty' : ''} ${selected}" data-slot="${slotKey}">
                    <div class="item-icon">${isEmpty ? slotInfo.icon : equippedItem.icon}</div>
                    <div class="item-info">
                        <div class="item-name ${isEmpty ? '' : 'rarity-' + equippedItem.rarity}">
                            ${isEmpty ? `${slotInfo.name}: Empty` : `${slotInfo.name}: ${equippedItem.name}`}
                        </div>
                    </div>
                    ${isEmpty ? '' : `
                        <button class="item-button unequip" data-slot="${slotKey}" title="Unequip"
                        ${inventory.items.length >= inventory.maxSize ? 'disabled' : ''}>
                        X
                        </button>
                    `}
                </div>
            `;
        }
        
        html += `</div>
            </div>
            <div class="inventory-footer">
                <button class="close-button">Close Inventory (I)</button>
            </div>`;
        
        this.inventoryElement.innerHTML = html;
        
        // Add event listeners for items
        const itemRows = this.inventoryElement.querySelectorAll('.item-row');
        itemRows.forEach(row => {
            row.addEventListener('click', () => {
                const index = parseInt(row.getAttribute('data-index'));
                
                // If in drop mode, directly drop the item instead of selecting it
                if (this.dropMode) {
                    this.handleItemAction('drop', index);
                } else {
                    this.selectItem(index);
                }
            });
            
            row.addEventListener('mouseover', (e) => {
                const index = parseInt(row.getAttribute('data-index'));
                const item = inventory.items[index];
                this.showItemDetails(item, e.clientX, e.clientY);
            });
            
            row.addEventListener('mouseout', () => {
                this.hideItemDetails();
            });
        });
        
        // Add event listeners for direct action buttons
        const actionButtons = this.inventoryElement.querySelectorAll('.item-button');
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Stop event from bubbling to parent (which would select the item)
                e.stopPropagation();
                
                const index = parseInt(button.getAttribute('data-index'));
                if (button.classList.contains('equip')) {
                    this.handleItemAction('equip', index);
                } else if (button.classList.contains('use')) {
                    this.handleItemAction('use', index);
                } else if (button.classList.contains('drop')) {
                    this.handleItemAction('drop', index);
                }
            });
        });
        
        // Add event listeners for equipment slots
        const equipSlots = this.inventoryElement.querySelectorAll('.item-slot');
        equipSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                const slotKey = slot.getAttribute('data-slot');
                this.selectEquipSlot(slotKey);
            });
            
            slot.addEventListener('mouseover', (e) => {
                const slotKey = slot.getAttribute('data-slot');
                const item = inventory.equipment[slotKey];
                if (item) {
                    this.showItemDetails(item, e.clientX, e.clientY);
                }
            });
            
            slot.addEventListener('mouseout', () => {
                this.hideItemDetails();
            });
        });
        
        // Add event listeners for unequip buttons in equipment slots
        const unequipButtons = this.inventoryElement.querySelectorAll('.item-button.unequip');
        unequipButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                // Stop event propagation to prevent slot selection
                e.stopPropagation();
                
                const slotKey = button.getAttribute('data-slot');
                if (inventory.items.length < inventory.maxSize) {
                    this.game.player.unequipItem(slotKey, this.game);
                    this.updateInventory();
                } else {
                    this.game.ui.addMessage('Inventory full, cannot unequip item!', '#f55');
                }
            });
        });
        
        // Add event listener for close button
        const closeButton = this.inventoryElement.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            this.closeInventory();
        });
        
        // Add keyboard event listeners for drop mode
        if (this.dropMode) {
            document.addEventListener('keydown', this.handleDropModeKeys);
        }
    }
    
    selectItem(index) {
        const inventory = this.game.player.inventory;
        const item = inventory.items[index];
        
        if (!item) return;
        
        this.selectedItemIndex = index;
        this.selectedEquipSlot = null;
        this.updateInventory();
        
        // Show action buttons
        let actionsHtml = `<div class="item-details-actions">`;
        
        // Add use button for usable items
        if (item.canUse) {
            actionsHtml += `<button class="inventory-button use" data-action="use">Use</button>`;
        }
        
        // Enhanced equip button for equippable items
        if (item.canEquip && item.slot) {
            // Check if there's already an item in that slot
            const equippedInSlot = inventory.equipment[item.slot];
            if (equippedInSlot) {
                actionsHtml += `
                    <button class="inventory-button equip" data-action="equip" title="Replace ${equippedInSlot.name}">
                        Equip (replace)
                    </button>`;
            } else {
                actionsHtml += `<button class="inventory-button equip" data-action="equip">Equip</button>`;
            }
        }
        
        // Always add drop button
        actionsHtml += `<button class="inventory-button drop" data-action="drop">Drop</button>`;
        actionsHtml += `</div>`;
        
        this.itemDetailsElement.insertAdjacentHTML('beforeend', actionsHtml);
        
        // Add event listeners to buttons
        const buttons = this.itemDetailsElement.querySelectorAll('.inventory-button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                this.handleItemAction(action, index);
            });
        });
    }
    
    selectEquipSlot(slot) {
        const inventory = this.game.player.inventory;
        const item = inventory.equipment[slot];
        
        if (!item) return;
        
        this.selectedEquipSlot = slot;
        this.selectedItemIndex = -1;
        this.updateInventory();
        
        // Show action buttons - only if there's inventory space available
        const hasInventorySpace = inventory.items.length < inventory.maxSize;
        const actionsHtml = `
            <div class="item-details-actions">
                <button class="inventory-button unequip" data-action="unequip" ${!hasInventorySpace ? 'disabled' : ''} 
                ${!hasInventorySpace ? 'title="No inventory space available"' : ''}>
                ❌${!hasInventorySpace ? ' (No Space)' : ''}
                </button>
            </div>
        `;
        
        this.itemDetailsElement.insertAdjacentHTML('beforeend', actionsHtml);
        
        // Add event listeners to buttons
        const buttons = this.itemDetailsElement.querySelectorAll('.inventory-button');
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                const action = button.getAttribute('data-action');
                this.handleEquipAction(action, slot);
            });
        });
    }
    
    handleItemAction(action, index) {
        const inventory = this.game.player.inventory;
        const item = inventory.items[index];
        
        if (!item) return;
        
        console.log(`Handling item action: ${action} for item ${item.name} at index ${index}`);
        
        switch (action) {
            case 'use':
                this.game.player.useItemFromInventory(index, this.game);
                break;
                
            case 'equip':
                this.game.player.equipItemFromInventory(index, this.game);
                break;
                
            case 'drop':
                this.dropItem(index);
                break;
        }
        
        // Update the inventory UI after any action
        this.updateInventory();
    }
    
    handleEquipAction(action, slot) {
        const player = this.game.player;
        const inventory = player.inventory;
        
        if (action === 'unequip') {
            // Check if there's inventory space available
            if (inventory.items.length < inventory.maxSize) {
                player.unequipItem(slot, this.game);
            } else {
                this.game.ui.addMessage('Inventory full, cannot unequip item!', '#f55');
            }
        }
        
        // Reset selection and update UI
        this.selectedEquipSlot = null;
        this.updateInventory();
        this.hideItemDetails();
    }
    
    dropItem(index) {
        const item = this.game.player.inventory.items[index];
        if (!item) return;
        
        // Log the action
        console.log(`Dropping item: ${item.name} at position (${this.game.player.x}, ${this.game.player.y})`);
        
        // Add item to the ground at player's position
        this.game.itemManager.addItemToGround(item, this.game.player.x, this.game.player.y);
        
        // Remove from player's inventory
        this.game.player.inventory.items.splice(index, 1);
        
        // Update UI
        this.game.ui.addMessage(`Dropped ${item.name} on the ground.`, '#aaa');
        
        // Check if we need to update equipped items display
        if (item.equipped) {
            this.game.player.unequipItem(item);
        }
        
        // Close inventory if in drop mode
        if (this.dropMode) {
            this.closeInventory();
        }
    }
    
    // Handler for keyboard events in drop mode
    handleDropModeKeys(e) {
        // Exit drop mode if D is pressed again
        if (e.key === 'd' || e.key === 'D' || e.key === 'Escape') {
            this.closeInventory();
        }
        
        // Handle number keys for quick item dropping
        const numKey = parseInt(e.key);
        if (!isNaN(numKey) && numKey >= 1 && numKey <= 9) {
            const index = numKey - 1;
            if (index < this.game.player.inventory.items.length) {
                this.handleItemAction('drop', index);
            }
        }
    }
    
    showItemDetails(item, x, y) {
        if (!item) return;
        
        const rarityClass = `rarity-${item.rarity}`;
        const rarityName = item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1);
        
        let html = `
            <div class="item-details-header">
                <div class="item-details-name ${rarityClass}">${item.name}</div>
                <div class="item-details-rarity ${rarityClass}">${rarityName}</div>
            </div>
        `;
        
        if (item.description) {
            html += `<div class="item-details-description">${item.description}</div>`;
        }
        
        const statDesc = item.getStatDescription();
        if (statDesc) {
            html += `<div class="item-details-stats">${statDesc.replace(/\\n/g, '<br>')}</div>`;
        }
        
        this.itemDetailsElement.innerHTML = html;
        this.itemDetailsElement.style.display = 'block';
        
        // Position tooltip
        const rect = this.inventoryElement.getBoundingClientRect();
        const tooltipWidth = 300; // Max width
        
        let posX = x + 15;
        if (posX + tooltipWidth > window.innerWidth) {
            posX = x - tooltipWidth - 10;
        }
        
        this.itemDetailsElement.style.left = `${posX}px`;
        this.itemDetailsElement.style.top = `${y}px`;
        this.itemDetailsVisible = true;
    }
    
    hideItemDetails() {
        this.itemDetailsElement.style.display = 'none';
        this.itemDetailsVisible = false;
    }
    
    getItemTypeDescription(item) {
        if (!item) return '';
        
        switch(item.type) {
            case 'weapon':
                return `Weapon (${item.slot})`;
            case 'armor':
                return `Armor (${item.slot})`;
            case 'accessory':
                return `Accessory (${item.slot})`;
            case 'potion':
                return 'Consumable';
            case 'scroll':
                return 'Scroll';
            case 'currency':
                return 'Currency';
            case 'key':
                return 'Key Item';
            default:
                return item.type.charAt(0).toUpperCase() + item.type.slice(1);
        }
    }
}