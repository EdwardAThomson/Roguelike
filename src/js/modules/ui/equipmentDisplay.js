export class EquipmentDisplay {
    constructor(game) {
        this.game = game;
        this.equipmentElement = null;
        this.createEquipmentDisplay();
    }
    
    createEquipmentDisplay() {
        const container = document.getElementById('equipment-area');
        
        // Create equipment display
        this.equipmentElement = document.createElement('div');
        this.equipmentElement.id = 'equipment-display';
        this.equipmentElement.className = 'equipment-display';
        container.appendChild(this.equipmentElement);
        
        // Add styles
        this.addStyles();
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .equipment-display {
                width: 100%;
                background-color: transparent;
                color: #fff;
                font-family: monospace;
            }
            
            .equipment-title {
                font-weight: bold;
                margin-bottom: 8px;
                border-bottom: 1px solid #444;
                padding-bottom: 5px;
                text-align: center;
            }
            
            .equipment-slot {
                display: flex;
                align-items: center;
                margin-bottom: 5px;
                padding: 3px;
                border-radius: 3px;
            }
            
            .equipment-slot:hover {
                background-color: rgba(60, 60, 60, 0.7);
            }
            
            .equipment-icon {
                width: 20px;
                height: 20px;
                display: flex;
                justify-content: center;
                align-items: center;
                margin-right: 8px;
                font-size: 16px;
            }
            
            .equipment-name {
                flex: 1;
                font-size: 12px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            .equipment-slot-empty .equipment-name {
                color: #888;
                font-style: italic;
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
            
            .equipment-tooltip {
                position: absolute;
                background-color: rgba(0, 0, 0, 0.9);
                border: 1px solid #444;
                border-radius: 5px;
                padding: 8px;
                z-index: 100;
                max-width: 200px;
                font-size: 12px;
                pointer-events: none;
                visibility: hidden;
                opacity: 0;
                transition: opacity 0.2s;
            }
            
            .equipment-tooltip-title {
                font-weight: bold;
                margin-bottom: 5px;
                border-bottom: 1px solid #555;
                padding-bottom: 3px;
            }
            
            .equipment-tooltip-stats {
                color: #0c0;
                margin-top: 5px;
                font-size: 11px;
            }
            
            .equipment-instructions {
                font-size: 0.8em;
                color: #888;
                margin-bottom: 10px;
                text-align: center;
            }
            
            /* Removed equipment-unequip-button styles as we no longer use them */
        `;
        document.head.appendChild(style);
    }
    
    update() {
        if (!this.game.player || !this.game.player.inventory) return;
        
        const equipment = this.game.player.inventory.equipment;
        
        // Create HTML for equipment slots
        let html = `
            <div class="equipment-title">Equipment</div>
            <div class="equipment-instructions">Click item to view details</div>
        `;
        
        // Define slot info
        const slots = {
            head: { name: 'Head', icon: '🧢' },
            body: { name: 'Body', icon: '👕' },
            feet: { name: 'Feet', icon: '👢' },
            weapon: { name: 'Weapon', icon: '⚔️' },
            offhand: { name: 'Off-hand', icon: '🛡️' },
            ring: { name: 'Ring', icon: '💍' },
            amulet: { name: 'Amulet', icon: '📿' }
        };
        
        // Add each equipment slot
        for (const [slotKey, slotInfo] of Object.entries(slots)) {
            const item = equipment[slotKey];
            const isEmpty = !item;
            
            if (isEmpty) {
                html += `
                    <div class="equipment-slot equipment-slot-empty" data-slot="${slotKey}">
                        <div class="equipment-icon">${slotInfo.icon}</div>
                        <div class="equipment-name">
                            ${slotInfo.name}: Empty
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="equipment-slot" data-slot="${slotKey}">
                        <div class="equipment-icon">${item.icon}</div>
                        <div class="equipment-name rarity-${item.rarity}">
                            ${item.name}
                        </div>
                    </div>
                `;
            }
        }
        
        // Update the element
        this.equipmentElement.innerHTML = html;
        
        // Add tooltip functionality for equipment slots
        const slotElements = this.equipmentElement.querySelectorAll('.equipment-slot');
        slotElements.forEach(slot => {
            const slotKey = slot.getAttribute('data-slot');
            const item = equipment[slotKey];
            
            if (item) {
                // Create tooltip on mouseover
                slot.addEventListener('mouseover', (e) => {
                    this.showItemTooltip(item, e.clientX, e.clientY);
                });
                
                slot.addEventListener('mousemove', (e) => {
                    const tooltip = document.getElementById('equipment-tooltip');
                    if (tooltip) {
                        tooltip.style.left = (e.clientX + 15) + 'px';
                        tooltip.style.top = (e.clientY + 15) + 'px';
                    }
                });
                
                slot.addEventListener('mouseout', () => {
                    this.hideItemTooltip();
                });
            }
        });
        
        // Removed unequip buttons functionality - unequipping now only happens in inventory
    }
    
    showItemTooltip(item, x, y) {
        // Remove any existing tooltips
        this.hideItemTooltip();
        
        const tooltip = document.createElement('div');
        tooltip.id = 'equipment-tooltip';
        tooltip.className = 'equipment-tooltip';
        
        const rarityClass = `rarity-${item.rarity}`;
        const statsHtml = item.getStatDescription().replace(/\n/g, '<br>');
        
        tooltip.innerHTML = `
            <div class="equipment-tooltip-title ${rarityClass}">${item.name}</div>
            <div>${item.description}</div>
            <div class="equipment-tooltip-stats">${statsHtml}</div>
            <div style="margin-top: 5px; font-size: 11px; color: #aaa;">Open inventory (I) to unequip</div>
        `;
        
        document.body.appendChild(tooltip);
        
        // Position the tooltip
        tooltip.style.left = (x + 15) + 'px';
        tooltip.style.top = (y + 15) + 'px';
        
        // Make it visible
        setTimeout(() => {
            tooltip.style.visibility = 'visible';
            tooltip.style.opacity = 1;
        }, 10);
    }
    
    hideItemTooltip() {
        const tooltip = document.getElementById('equipment-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }
}