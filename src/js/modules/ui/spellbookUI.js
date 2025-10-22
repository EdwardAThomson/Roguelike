// SpellbookUI - standalone modal for spell management
export class SpellbookUI {
    constructor(game) {
        this.game = game;
        this.spellbookElement = null;
        this.selectedSpellId = null;
        this.isOpen = false;
        this.initialize();
    }
    
    initialize() {
        // Create spellbook modal in overlay container
        const container = document.getElementById('overlay-container');
        this.spellbookElement = document.createElement('div');
        this.spellbookElement.id = 'spellbook-modal';
        this.spellbookElement.className = 'spellbook-modal';
        this.spellbookElement.style.display = 'none';
        container.appendChild(this.spellbookElement);
        
        this.addStyles();
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .spellbook-modal {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: rgba(0, 0, 0, 0.95);
                color: #fff;
                padding: 20px;
                border-radius: 10px;
                font-family: monospace;
                z-index: 100;
                width: 90%;
                max-width: 1200px;
                max-height: 85vh;
                overflow-y: auto;
                border: 2px solid #0af;
                box-shadow: 0 0 20px rgba(0, 170, 255, 0.3);
            }
            
            .spellbook-container {
                display: flex;
                gap: 20px;
                height: 100%;
            }
            
            .spell-slots-panel {
                flex: 0 0 250px;
                background-color: rgba(20, 20, 20, 0.8);
                border-radius: 8px;
                padding: 15px;
            }
            
            .spell-slots-panel h3 {
                margin: 0 0 15px 0;
                color: #0af;
                font-size: 16px;
                border-bottom: 1px solid #444;
                padding-bottom: 8px;
            }
            
            .spell-slot {
                background-color: rgba(40, 40, 40, 0.9);
                border: 2px solid #555;
                border-radius: 6px;
                padding: 10px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: all 0.2s;
                min-height: 60px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .spell-slot:hover {
                border-color: #0af;
                background-color: rgba(50, 50, 50, 0.9);
            }
            
            .spell-slot.empty {
                border-style: dashed;
                border-color: #333;
                justify-content: center;
                color: #666;
            }
            
            .spell-slot.empty:hover {
                border-color: #555;
            }
            
            .spell-slot-key {
                font-size: 20px;
                font-weight: bold;
                color: #0af;
                background-color: rgba(0, 170, 255, 0.2);
                border: 1px solid #0af;
                border-radius: 4px;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            
            .spell-slot-info {
                flex: 1;
            }
            
            .spell-slot-name {
                font-weight: bold;
                color: #fff;
                margin-bottom: 2px;
            }
            
            .spell-slot-mana {
                font-size: 12px;
                color: #0af;
            }
            
            .spell-list-panel {
                flex: 1;
                background-color: rgba(20, 20, 20, 0.8);
                border-radius: 8px;
                padding: 15px;
                overflow-y: auto;
                overflow-x: visible;
            }
            
            .spell-list-panel h3 {
                margin: 0 0 15px 0;
                color: #0af;
                font-size: 16px;
                border-bottom: 1px solid #444;
                padding-bottom: 8px;
            }
            
            .spell-item {
                background-color: rgba(40, 40, 40, 0.9);
                border: 2px solid #555;
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: all 0.2s;
                overflow: visible;
            }
            
            .spell-item:hover {
                border-color: #0af;
                background-color: rgba(50, 50, 50, 0.9);
            }
            
            .spell-item.locked {
                opacity: 0.5;
                border-color: #333;
                cursor: not-allowed;
            }
            
            .spell-item.locked:hover {
                border-color: #444;
                background-color: rgba(40, 40, 40, 0.9);
            }
            
            .spell-item.selected {
                border-color: #0f0;
                background-color: rgba(0, 255, 0, 0.1);
            }
            
            .spell-item-header {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 8px;
            }
            
            .spell-item-icon {
                font-size: 24px;
            }
            
            .spell-item-title {
                flex: 1;
            }
            
            .spell-item-name {
                font-weight: bold;
                color: #fff;
                margin-bottom: 2px;
            }
            
            .spell-item-mana {
                font-size: 12px;
                color: #0af;
            }
            
            .spell-item-lock {
                color: #f55;
                font-size: 18px;
            }
            
            .spell-item-desc {
                color: #aaa;
                font-size: 13px;
                margin-bottom: 8px;
            }
            
            .spell-item-stats {
                display: flex;
                gap: 15px;
                font-size: 12px;
                color: #888;
            }
            
            .spell-item-stat {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .spell-assign-button {
                background-color: #0a5;
                border: 2px solid #0f0;
                color: #fff;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
                font-family: monospace;
                font-size: 14px;
                font-weight: bold;
                margin-top: 10px;
                width: 100%;
                transition: background-color 0.2s;
                display: block;
            }
            
            .spell-assign-button:hover {
                background-color: #0c7;
                border-color: #0ff;
            }
            
            .spell-assign-button:disabled {
                background-color: #333;
                color: #666;
                cursor: not-allowed;
            }
            
            .spellbook-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #0af;
            }
            
            .spellbook-header h2 {
                margin: 0;
                color: #0af;
                font-size: 24px;
            }
            
            .spellbook-close-btn {
                background-color: #333;
                border: 2px solid #0af;
                color: #fff;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                font-family: monospace;
                font-size: 14px;
                transition: all 0.2s;
            }
            
            .spellbook-close-btn:hover {
                background-color: #0af;
                color: #000;
            }
        `;
        document.head.appendChild(style);
    }
    
    toggleSpellbook() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }
    
    open() {
        if (!this.spellbookElement) return;
        this.isOpen = true;
        this.spellbookElement.style.display = 'block';
        
        const overlay = document.getElementById('overlay-container');
        if (overlay) {
            overlay.classList.add('active');
        }
        
        // Pause game while spellbook is open
        this.game.gameState = 'spellbook';
        this.render();
    }
    
    close() {
        if (!this.spellbookElement) return;
        this.isOpen = false;
        this.spellbookElement.style.display = 'none';
        
        const overlay = document.getElementById('overlay-container');
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        // Resume game
        this.game.gameState = 'playing';
    }
    
    render() {
        if (!this.game.player || !this.game.player.spellbook) {
            this.spellbookElement.innerHTML = '<p style="color: #f55;">No spellbook available!</p>';
            return;
        }
        
        const spellbook = this.game.player.spellbook;
        const summary = spellbook.getSummary();
        
        // Build HTML with header and close button
        let html = `
            <div class="spellbook-header">
                <h2>📖 Spellbook</h2>
                <button class="spellbook-close-btn">Close (B)</button>
            </div>
        `;
        html += '<div class="spellbook-container">';
        
        // Left panel: Spell slots (hotbar)
        html += '<div class="spell-slots-panel">';
        html += '<h3>🔥 Spell Hotbar</h3>';
        
        for (const slot of summary.spellSlots) {
            if (slot.spell) {
                html += `
                    <div class="spell-slot" data-slot="${slot.slotIndex}">
                        <div class="spell-slot-key">${slot.key}</div>
                        <div class="spell-slot-info">
                            <div class="spell-slot-name">${slot.spell.icon} ${slot.spell.name}</div>
                            <div class="spell-slot-mana">💧 ${slot.spell.manaCost} mana</div>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="spell-slot empty" data-slot="${slot.slotIndex}">
                        <div class="spell-slot-key">${slot.key}</div>
                        <div style="color: #666;">Empty Slot</div>
                    </div>
                `;
            }
        }
        
        html += '</div>';
        
        // Right panel: All spells
        html += '<div class="spell-list-panel">';
        html += `<h3>📖 Known Spells (${summary.knownSpellCount})</h3>`;
        
        // Get all possible spells (including locked ones)
        const allSpells = this.getAllSpellDefinitions();
        
        for (const spell of allSpells) {
            const isUnlocked = spellbook.isSpellUnlocked(spell.id);
            const isSelected = this.selectedSpellId === spell.id;
            console.log(`📖 Spell ${spell.name} (${spell.id}): unlocked=${isUnlocked}`);
            const classes = ['spell-item'];
            if (!isUnlocked) classes.push('locked');
            if (isSelected) classes.push('selected');
            
            html += `
                <div class="spell-item ${classes.join(' ')}" data-spell-id="${spell.id}">
                    <div class="spell-item-header">
                        <div class="spell-item-icon">${spell.icon}</div>
                        <div class="spell-item-title">
                            <div class="spell-item-name">${spell.name}</div>
                            <div class="spell-item-mana">💧 ${spell.manaCost} mana</div>
                        </div>
                        ${!isUnlocked ? '<div class="spell-item-lock">🔒</div>' : ''}
                    </div>
                    <div class="spell-item-desc">${spell.description}</div>
                    <div class="spell-item-stats">
                        ${spell.baseDamage ? `<div class="spell-item-stat">⚔️ ${spell.baseDamage} base dmg</div>` : ''}
                        ${spell.damage ? `<div class="spell-item-stat">⚔️ ${spell.damage.min}-${spell.damage.max}</div>` : ''}
                        ${spell.healing ? `<div class="spell-item-stat">💚 ${spell.healing.min}-${spell.healing.max}</div>` : ''}
                        <div class="spell-item-stat">📏 Range: ${spell.range}</div>
                        ${spell.damageType ? `<div class="spell-item-stat">🔮 ${spell.damageType}</div>` : ''}
                        ${spell.element ? `<div class="spell-item-stat">🔮 ${spell.element}</div>` : ''}
                    </div>
                    ${isUnlocked ? `<button class="spell-assign-button" data-spell-id="${spell.id}">⚡ Assign to Hotkey</button>` : '<div style="color: #666; font-size: 12px; margin-top: 8px;">🔒 Find a scroll to unlock</div>'}
                </div>
            `;
        }
        
        html += '</div>';
        html += '</div>';
        
        this.spellbookElement.innerHTML = html;
        
        // Add event listeners
        this.attachEventListeners();
        
        // Add close button listener
        const closeBtn = this.spellbookElement.querySelector('.spellbook-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
    }
    
    attachEventListeners() {
        // Click on spell items to select them
        const spellItems = this.spellbookElement.querySelectorAll('.spell-item:not(.locked)');
        spellItems.forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('spell-assign-button')) return;
                const spellId = item.getAttribute('data-spell-id');
                this.selectSpell(spellId);
            });
        });
        
        // Click assign buttons
        const assignButtons = this.spellbookElement.querySelectorAll('.spell-assign-button');
        assignButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const spellId = button.getAttribute('data-spell-id');
                this.showSlotSelector(spellId);
            });
        });
        
        // Click on spell slots to unassign
        const spellSlots = this.spellbookElement.querySelectorAll('.spell-slot:not(.empty)');
        spellSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                const slotIndex = parseInt(slot.getAttribute('data-slot'));
                this.unassignSlot(slotIndex);
            });
        });
    }
    
    selectSpell(spellId) {
        this.selectedSpellId = spellId;
        this.render();
    }
    
    showSlotSelector(spellId) {
        const spell = this.game.player.spellbook.getSpellData(spellId);
        if (!spell) return;
        
        // Simple prompt for now - could be improved with a modal
        const slotKey = prompt(`Assign ${spell.name} to which slot? (Q/R/F/V/X)`);
        if (!slotKey) return;
        
        const slotIndex = ['Q', 'R', 'F', 'V', 'X'].indexOf(slotKey.toUpperCase());
        if (slotIndex === -1) {
            this.game.ui.addMessage('Invalid slot! Use Q, R, F, V, or X', '#f55');
            return;
        }
        
        this.game.player.spellbook.assignSpellToSlot(spellId, slotIndex);
        this.game.ui.addMessage(`Assigned ${spell.name} to ${slotKey.toUpperCase()} key`, '#0f0');
        this.render();
    }
    
    unassignSlot(slotIndex) {
        const spell = this.game.player.spellbook.getSpellInSlot(slotIndex);
        if (!spell) return;
        
        if (confirm(`Remove ${spell.name} from this slot?`)) {
            this.game.player.spellbook.spellSlots[slotIndex] = null;
            this.game.ui.addMessage(`Removed ${spell.name} from slot`, '#aaa');
            this.render();
        }
    }
    
    getAllSpellDefinitions() {
        // Return all possible spells in order
        return [
            this.game.player.spellbook.getSpellData('magic_dart'),
            this.game.player.spellbook.getSpellData('magic_missile'),
            this.game.player.spellbook.getSpellData('fireball'),
            this.game.player.spellbook.getSpellData('ice_shard'),
            this.game.player.spellbook.getSpellData('heal'),
            this.game.player.spellbook.getSpellData('lightning_bolt')
        ].filter(spell => spell !== null);
    }
}
