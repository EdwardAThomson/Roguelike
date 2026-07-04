// SpellbookUI - the spellbook tab of the game modal
export class SpellbookUI {
    constructor(game) {
        this.game = game;
        this.selectedSpellId = null;
        this.panelEl = null; // spellbook tab panel inside the game modal
        this.hintEl = null; // capture-mode hint strip
        this.contentEl = null; // scrolling spell layout host
        // Spell id currently waiting for a hotkey press, or null.
        this.captureSpellId = null;
        this.addStyles();
    }

    // GameModal provider interface: the spellbook tab.
    mountPanel(panelEl) {
        this.panelEl = panelEl;

        // Hint strip is always present (visibility toggles) so entering
        // capture mode never reflows the layout.
        this.hintEl = document.createElement('div');
        this.hintEl.className = 'sb-hint';
        this.hintEl.innerHTML = '&nbsp;';
        panelEl.appendChild(this.hintEl);

        this.contentEl = document.createElement('div');
        this.contentEl.className = 'sb-content';
        panelEl.appendChild(this.contentEl);

        // Clicking anything that is not a slot or an assign button cancels
        // an active capture.
        panelEl.addEventListener('click', (e) => {
            if (this.isCapturing() && !e.target.closest('.spell-slot, .spell-assign-button')) {
                this.cancelCapture();
            }
        });
    }

    onShow() {
        this.render();
    }

    onHide() {
        this.cancelCapture();
        this.selectedSpellId = null;
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .sb-hint {
                flex: 0 0 auto;
                padding: 8px 12px;
                margin-bottom: 12px;
                border: 1px solid #0af;
                border-radius: 5px;
                color: #0ff;
                background-color: rgba(0, 170, 255, 0.12);
                font-weight: bold;
                text-align: center;
                visibility: hidden; /* keeps its space; zero reflow when shown */
            }

            .sb-hint.active {
                visibility: visible;
            }

            .sb-content {
                flex: 1 1 auto;
                min-height: 0;
                overflow: hidden;
            }

            .spell-slot.capturing {
                border-color: #0af;
                animation: sb-pulse 0.8s infinite alternate;
            }

            @keyframes sb-pulse {
                from { box-shadow: 0 0 4px rgba(0, 170, 255, 0.4); }
                to { box-shadow: 0 0 14px rgba(0, 170, 255, 0.9); }
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
            
        `;
        document.head.appendChild(style);
    }

    render() {
        if (!this.contentEl) return;
        if (!this.game.player || !this.game.player.spellbook) {
            this.contentEl.innerHTML = '<p style="color: #f55;">No spellbook available!</p>';
            return;
        }

        const spellbook = this.game.player.spellbook;
        const summary = spellbook.getSummary();

        let html = '<div class="spellbook-container">';
        
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

        this.contentEl.innerHTML = html;

        // Add event listeners
        this.attachEventListeners();

        // A render mid-capture (e.g. picking a different spell to assign)
        // wipes the slot classes; restore the visuals.
        this.updateCaptureVisuals();
    }

    attachEventListeners() {
        // Click on spell items to select them
        const spellItems = this.contentEl.querySelectorAll('.spell-item:not(.locked)');
        spellItems.forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.classList.contains('spell-assign-button')) return;
                const spellId = item.getAttribute('data-spell-id');
                this.selectSpell(spellId);
            });
        });

        // Click assign buttons: enter hotkey capture mode
        const assignButtons = this.contentEl.querySelectorAll('.spell-assign-button');
        assignButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const spellId = button.getAttribute('data-spell-id');
                this.startCapture(spellId);
            });
        });

        // Click on spell slots: bind while capturing, unassign otherwise
        const spellSlots = this.contentEl.querySelectorAll('.spell-slot');
        spellSlots.forEach(slot => {
            slot.addEventListener('click', () => {
                const slotIndex = parseInt(slot.getAttribute('data-slot'));
                if (this.isCapturing()) {
                    this.completeCapture(slotIndex);
                } else if (!slot.classList.contains('empty')) {
                    this.unassignSlot(slotIndex);
                }
            });
        });
    }

    selectSpell(spellId) {
        this.selectedSpellId = spellId;
        this.render();
    }

    // Hotkey capture mode: replaces the old window.prompt() flow. The
    // GameModal keydown handler feeds Q/R/F/V/X presses to completeCapture
    // and Escape to cancelCapture while isCapturing() is true.
    isCapturing() {
        return this.captureSpellId !== null;
    }

    startCapture(spellId) {
        const spell = this.game.player.spellbook.getSpellData(spellId);
        if (!spell) return;
        this.captureSpellId = spellId;
        this.updateCaptureVisuals();
        console.log(`✨ SpellbookUI: capturing hotkey for ${spell.name}`);
    }

    completeCapture(slotIndex) {
        if (!this.isCapturing()) return;
        const spellbook = this.game.player.spellbook;
        const spellId = this.captureSpellId;
        const spell = spellbook.getSpellData(spellId);
        this.captureSpellId = null;

        spellbook.assignSpellToSlot(spellId, slotIndex);
        this.game.ui.addMessage(`Assigned ${spell.name} to ${spellbook.slotKeys[slotIndex]} key`, '#0f0');
        this.render();
    }

    cancelCapture() {
        if (!this.isCapturing()) return;
        this.captureSpellId = null;
        this.updateCaptureVisuals();
    }

    updateCaptureVisuals() {
        if (!this.hintEl || !this.contentEl) return;
        const capturing = this.isCapturing();

        if (capturing) {
            const spell = this.game.player.spellbook.getSpellData(this.captureSpellId);
            const keys = this.game.player.spellbook.slotKeys.join(', ');
            this.hintEl.textContent = `Press ${keys} to bind ${spell ? spell.name : 'spell'} (Esc to cancel)`;
            this.hintEl.classList.add('active');
        } else {
            this.hintEl.innerHTML = '&nbsp;';
            this.hintEl.classList.remove('active');
        }

        this.contentEl.querySelectorAll('.spell-slot').forEach(slot => {
            slot.classList.toggle('capturing', capturing);
        });
    }

    unassignSlot(slotIndex) {
        const spellbook = this.game.player.spellbook;
        const spell = spellbook.getSpellInSlot(slotIndex);
        if (!spell) return;

        spellbook.spellSlots[slotIndex] = null;
        this.game.ui.addMessage(`Removed ${spell.name} from slot ${spellbook.slotKeys[slotIndex]} (click Assign to rebind)`, '#aaa');
        this.render();
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
