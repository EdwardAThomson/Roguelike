export class GameUI {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.canvas = game.canvas;
        this.messageLog = [];
        this.maxMessages = 5;
        this.showCharacterScreen = false;
        this.selectedStatTab = 'attributes'; // 'attributes' or 'skills'
    }
    
    initialize() {
        // Create HTML elements for stats display
        this.createStatDisplay();
        
        // Note: Key handlers moved to UI.update() to avoid duplicates
    }
    
    createStatDisplay() {
        // Create stats element inside stats-area
        const statsContainer = document.getElementById('stats-area');
        this.statsElement = document.createElement('div');
        this.statsElement.id = 'stats-display';
        this.statsElement.className = 'stats-bar';
        statsContainer.appendChild(this.statsElement);
        
        // Create message log inside message-area
        const messageContainer = document.getElementById('message-area');
        this.logElement = document.createElement('div');
        this.logElement.id = 'message-log';
        this.logElement.className = 'message-log';
        messageContainer.appendChild(this.logElement);
        
        // Create character screen in overlay container
        const overlayContainer = document.getElementById('overlay-container');
        this.characterScreen = document.createElement('div');
        this.characterScreen.id = 'character-screen';
        this.characterScreen.className = 'character-screen';
        this.characterScreen.style.display = 'none';
        overlayContainer.appendChild(this.characterScreen);
        
        // Create tabs for character screen
        const tabContainer = document.createElement('div');
        tabContainer.className = 'tab-container';
        this.characterScreen.appendChild(tabContainer);
        
        // Attributes tab
        const attributesTab = document.createElement('div');
        attributesTab.className = 'tab active';
        attributesTab.textContent = 'Attributes';
        attributesTab.addEventListener('click', () => this.switchTab('attributes'));
        tabContainer.appendChild(attributesTab);
        
        // Skills tab
        const skillsTab = document.createElement('div');
        skillsTab.className = 'tab';
        skillsTab.textContent = 'Skills';
        skillsTab.addEventListener('click', () => this.switchTab('skills'));
        tabContainer.appendChild(skillsTab);
        
        // Content area
        this.characterContent = document.createElement('div');
        this.characterContent.className = 'character-content';
        this.characterScreen.appendChild(this.characterContent);
        
        // Close button
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button';
        closeButton.textContent = 'Close (C)';
        closeButton.addEventListener('click', () => this.toggleCharacterScreen());
        this.characterScreen.appendChild(closeButton);
        
        // Add styles
        this.addStyles();
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .stats-bar {
                width: 100%;
                color: #fff;
                font-family: monospace;
            }
            
            .message-log {
                width: 100%;
                color: #fff;
                font-family: monospace;
                max-height: 100%;
                overflow-y: auto;
            }
            
            .message-log p {
                margin: 2px 0;
            }
            
            .character-screen {
                background-color: rgba(20, 20, 20, 0.95);
                color: #fff;
                padding: 20px;
                border-radius: 10px;
                font-family: monospace;
                width: 90%;
                max-width: 900px;
                max-height: 80vh;
                overflow-y: auto;
                border: 2px solid #444;
                margin: 0 auto;
            }
            
            .tab-container {
                display: flex;
                border-bottom: 1px solid #444;
                margin-bottom: 15px;
            }
            
            .tab {
                padding: 8px 15px;
                cursor: pointer;
                margin-right: 5px;
                border-radius: 5px 5px 0 0;
            }
            
            .tab.active {
                background-color: #333;
                border: 1px solid #444;
                border-bottom: none;
            }
            
            .character-content {
                margin-bottom: 20px;
            }
            
            .stat-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                border-bottom: 1px solid #333;
                padding-bottom: 3px;
            }
            
            .stat-label {
                color: #aaa;
            }
            
            .skill-item {
                margin-bottom: 15px;
                padding: 10px;
                background-color: #222;
                border-radius: 5px;
                border-left: 3px solid #555;
            }
            
            .skill-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
            }
            
            .skill-level {
                display: flex;
            }
            
            .skill-point {
                width: 12px;
                height: 12px;
                margin-right: 3px;
                border: 1px solid #666;
                border-radius: 50%;
            }
            
            .skill-point.filled {
                background-color: #0c0;
            }
            
            .skill-description {
                color: #999;
                font-size: 0.9em;
                margin-bottom: 5px;
            }
            
            .skill-button {
                background-color: #2a2a2a;
                border: 1px solid #555;
                color: #0c0;
                padding: 3px 8px;
                border-radius: 3px;
                cursor: pointer;
                margin-top: 5px;
                font-family: monospace;
            }
            
            .skill-button:disabled {
                color: #555;
                cursor: not-allowed;
            }
            
            .close-button {
                background-color: #333;
                border: 1px solid #555;
                color: #fff;
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-family: monospace;
                display: block;
                margin: 0 auto;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background-color: #222;
                border-radius: 4px;
                margin-top: 3px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background-color: #0c0;
                width: 0%;
            }
            
            .health-bar .progress-fill {
                background-color: #c00;
            }
            
            .mana-bar .progress-fill {
                background-color: #00c;
            }
            
            .exp-bar .progress-fill {
                background-color: #cc0;
            }
            
            .stat-button {
                background-color: #0a5;
                border: 1px solid #0f0;
                color: #fff;
                padding: 2px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-family: monospace;
                font-size: 14px;
                font-weight: bold;
                transition: background-color 0.2s;
            }
            
            .stat-button:hover {
                background-color: #0c7;
            }
        `;
        document.head.appendChild(style);
    }
    
    updateStats() {
        if (!this.game.player) return;
        
        const stats = this.game.player.getSummary();
        
        // Debug logging for mana values specifically
        // const now = Date.now();
        // if (!this.lastManaDebugLog || now - this.lastManaDebugLog > 3000) {
        //    console.log(`🎮 GameUI: updateStats: mana=${stats.mana}, maxMana=${stats.maxMana}, maxMana_bonus=${stats.maxMana_bonus}`);
        //    this.lastManaDebugLog = now;
        //}
        
        // ALWAYS log this for debugging
        // console.log(`🎮 GameUI: updateStats: mana=${stats.mana}, maxMana=${stats.maxMana}, maxMana_bonus=${stats.maxMana_bonus}`);
        
        // Test direct calculation
        // const testMaxMana = this.game.player.calculateMaxMana();
        // console.log(`🎮 GameUI: updateStats: direct calculateMaxMana() = ${testMaxMana}`);
        // console.log(`🎮 GameUI: updateStats: cached this.maxMana = ${this.game.player.maxMana}`);
        
        
        // Update the basic stats display
        this.statsElement.innerHTML = `
            <div>Level: ${stats.level}</div>
            <div>HP: ${stats.health}/${stats.maxHealth}</div>
            <div class="progress-bar health-bar">
                <div class="progress-fill" style="width: ${(stats.health / stats.maxHealth) * 100}%"></div>
            </div>
            <div>MP: ${stats.mana}/${stats.maxMana}</div>
            <div class="progress-bar mana-bar">
                <div class="progress-fill" style="width: ${(stats.mana / stats.maxMana) * 100}%"></div>
            </div>
            <div>XP: ${stats.experience}/${stats.experienceToNextLevel}</div>
            <div class="progress-bar exp-bar">
                <div class="progress-fill" style="width: ${(stats.experience / stats.experienceToNextLevel) * 100}%"></div>
            </div>
            <div style="margin-top: 5px; font-size: 0.8em; color: #aaa;">Press 'C' for character | 'B' for spellbook</div>
        `;
    }
    
    switchTab(tab) {
        this.selectedStatTab = tab;
        // Update tab classes
        const tabs = document.querySelectorAll('.tab');
        tabs.forEach(t => {
            t.classList.remove('active');
            // Match by tab name (handle emoji in spellbook tab)
            const tabText = t.textContent.toLowerCase().replace(/[^\w\s]/g, '').trim();
            if (tabText === tab || t.textContent.toLowerCase().includes(tab)) {
                t.classList.add('active');
            }
        });
        
        this.updateCharacterScreen();
    }
    
    updateCharacterScreen() {
        if (!this.game.player) return;
        
        const stats = this.game.player.getSummary();
        
        // Update the content based on selected tab
        if (this.selectedStatTab === 'attributes') {
            this.characterContent.innerHTML = `
                <h2>Character Sheet</h2>
                <div class="stat-row">
                    <div class="stat-label">Level:</div>
                    <div>${stats.level}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Experience:</div>
                    <div>${stats.experience} / ${stats.experienceToNextLevel}</div>
                </div>
                <div class="progress-bar exp-bar">
                    <div class="progress-fill" style="width: ${(stats.experience / stats.experienceToNextLevel) * 100}%"></div>
                </div>
                
                <h3>Attributes</h3>
                <div class="stat-row">
                    <div class="stat-label">Stat Points Available:</div>
                    <div style="color: #0ff; font-weight: bold;">${stats.statPoints || 0}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Strength:</div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span>${stats.strength} ${stats.strength_bonus ? `<span style="color: #5f5">(+${stats.strength_bonus})</span>` : ''}</span>
                        ${stats.statPoints > 0 ? `<button class="stat-button" data-stat="strength">+</button>` : ''}
                    </div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Dexterity:</div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span>${stats.dexterity} ${stats.dexterity_bonus ? `<span style="color: #5f5">(+${stats.dexterity_bonus})</span>` : ''}</span>
                        ${stats.statPoints > 0 ? `<button class="stat-button" data-stat="dexterity">+</button>` : ''}
                    </div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Constitution:</div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span>${stats.constitution} ${stats.constitution_bonus ? `<span style="color: #5f5">(+${stats.constitution_bonus})</span>` : ''}</span>
                        ${stats.statPoints > 0 ? `<button class="stat-button" data-stat="constitution">+</button>` : ''}
                    </div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Intelligence:</div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span>${stats.intelligence} ${stats.intelligence_bonus ? `<span style="color: #5f5">(+${stats.intelligence_bonus})</span>` : ''}</span>
                        ${stats.statPoints > 0 ? `<button class="stat-button" data-stat="intelligence">+</button>` : ''}
                    </div>
                </div>
                
                <h3>Derived Stats</h3>
                <div class="stat-row">
                    <div class="stat-label">Health:</div>
                    <div>${stats.health} / ${stats.maxHealth} ${stats.maxHealth_bonus ? `<span style="color: #5f5">(+${stats.maxHealth_bonus})</span>` : ''}</div>
                </div>
                <div class="progress-bar health-bar">
                    <div class="progress-fill" style="width: ${(stats.health / stats.maxHealth) * 100}%"></div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Mana:</div>
                    <div>${stats.mana} / ${stats.maxMana} ${stats.maxMana_bonus ? `<span style="color: #5f5">(+${stats.maxMana_bonus})</span>` : ''}</div>
                </div>
                <div class="progress-bar mana-bar">
                    <div class="progress-fill" style="width: ${(stats.mana / stats.maxMana) * 100}%"></div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Attack Power:</div>
                    <div>${stats.attackPower} ${stats.attackPower_bonus ? `<span style="color: #5f5">(+${stats.attackPower_bonus})</span>` : ''}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Defense:</div>
                    <div>${stats.defense} ${stats.defense_bonus ? `<span style="color: #5f5">(+${stats.defense_bonus})</span>` : ''}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Critical Chance:</div>
                    <div>${stats.criticalChance}% ${stats.criticalChance_bonus ? `<span style="color: #5f5">(+${stats.criticalChance_bonus}%)</span>` : ''}</div>
                </div>
            `;
            
            // Add event listeners to stat buttons
            this.characterContent.innerHTML = this.characterContent.innerHTML;
            const statButtons = this.characterContent.querySelectorAll('.stat-button');
            statButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const stat = button.getAttribute('data-stat');
                    this.allocateStat(stat);
                });
            });
        } else if (this.selectedStatTab === 'skills') {
            // Get skills from player
            const skills = this.game.player.availableSkills;
            
            let skillsHtml = `
                <h2>Skills</h2>
                <div class="stat-row">
                    <div class="stat-label">Skill Points:</div>
                    <div>${stats.skillPoints}</div>
                </div>
            `;
            
            // Add each skill
            for (const skill of skills) {
                const skillPointsHtml = Array(skill.maxLevel)
                    .fill()
                    .map((_, i) => `<div class="skill-point ${i < skill.level ? 'filled' : ''}"></div>`)
                    .join('');
                
                skillsHtml += `
                    <div class="skill-item">
                        <div class="skill-header">
                            <div><strong>${skill.name}</strong></div>
                            <div class="skill-level">${skillPointsHtml}</div>
                        </div>
                        <div class="skill-description">${skill.description}</div>
                        <button class="skill-button" 
                                data-skill-id="${skill.id}"
                                ${stats.skillPoints <= 0 || skill.level >= skill.maxLevel ? 'disabled' : ''}>
                            Learn
                        </button>
                    </div>
                `;
            }
            
            this.characterContent.innerHTML = skillsHtml;
            
            // Add event listeners to skill buttons
            const skillButtons = this.characterContent.querySelectorAll('.skill-button');
            skillButtons.forEach(button => {
                if (!button.disabled) {
                    button.addEventListener('click', () => {
                        const skillId = button.getAttribute('data-skill-id');
                        this.learnSkill(skillId);
                    });
                }
            });
        }
    }
    
    // Removed renderSpellbookTab() - spellbook now has its own modal
    
    renderSpellbookTab_DEPRECATED() {
        if (!this.game.player || !this.game.player.spellbook) {
            this.characterContent.innerHTML = '<p style="color: #f55;">No spellbook available!</p>';
            return;
        }
        
        const spellbook = this.game.player.spellbook;
        const summary = spellbook.getSummary();
        
        // Build HTML (similar to SpellbookUI but adapted for character screen)
        let html = '<h2>📖 Spellbook</h2>';
        html += '<div style="display: flex; gap: 20px;">';
        
        // Left panel: Spell slots
        html += '<div style="flex: 0 0 200px;">';
        html += '<h3 style="color: #0af; font-size: 14px; margin-bottom: 10px;">Spell Hotbar</h3>';
        
        for (const slot of summary.spellSlots) {
            if (slot.spell) {
                html += `
                    <div style="background: rgba(40,40,40,0.9); border: 2px solid #555; border-radius: 6px; padding: 8px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                        <div style="font-size: 16px; font-weight: bold; color: #0af; background: rgba(0,170,255,0.2); border: 1px solid #0af; border-radius: 4px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">${slot.key}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: bold; font-size: 12px;">${slot.spell.icon} ${slot.spell.name}</div>
                            <div style="font-size: 10px; color: #0af;">💧 ${slot.spell.manaCost}</div>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div style="background: rgba(40,40,40,0.9); border: 2px dashed #333; border-radius: 6px; padding: 8px; margin-bottom: 8px; display: flex; align-items: center; gap: 8px; color: #666;">
                        <div style="font-size: 16px; font-weight: bold; color: #0af; background: rgba(0,170,255,0.2); border: 1px solid #0af; border-radius: 4px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">${slot.key}</div>
                        <div>Empty</div>
                    </div>
                `;
            }
        }
        
        html += '</div>';
        
        // Right panel: All spells
        html += '<div style="flex: 1; max-height: 400px; overflow-y: auto;">';
        html += `<h3 style="color: #0af; font-size: 14px; margin-bottom: 10px;">Known Spells (${summary.knownSpellCount})</h3>`;
        
        // Get all possible spells
        const allSpells = this.getAllSpellDefinitions(spellbook);
        
        for (const spell of allSpells) {
            const isUnlocked = spellbook.isSpellUnlocked(spell.id);
            
            html += `
                <div style="background: rgba(40,40,40,0.9); border: 2px solid ${isUnlocked ? '#555' : '#333'}; border-radius: 6px; padding: 10px; margin-bottom: 8px; opacity: ${isUnlocked ? '1' : '0.5'};">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <div style="font-size: 20px;">${spell.icon}</div>
                        <div style="flex: 1;">
                            <div style="font-weight: bold; font-size: 13px;">${spell.name}</div>
                            <div style="font-size: 11px; color: #0af;">💧 ${spell.manaCost} mana</div>
                        </div>
                        ${!isUnlocked ? '<div style="color: #f55; font-size: 16px;">🔒</div>' : ''}
                    </div>
                    <div style="color: #aaa; font-size: 11px; margin-bottom: 6px;">${spell.description}</div>
                    <div style="display: flex; gap: 12px; font-size: 10px; color: #888;">
                        ${spell.damage ? `<div>⚔️ ${spell.damage.min}-${spell.damage.max}</div>` : ''}
                        ${spell.healing ? `<div>💚 ${spell.healing.min}-${spell.healing.max}</div>` : ''}
                        <div>📏 ${spell.range}</div>
                        ${spell.element ? `<div>🔮 ${spell.element}</div>` : ''}
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        html += '</div>';
        
        this.characterContent.innerHTML = html;
    }
    
    // Deprecated - spellbook now has its own modal
    getAllSpellDefinitions_DEPRECATED(spellbook) {
        return [
            spellbook.getSpellData('magic_dart'),
            spellbook.getSpellData('magic_missile'),
            spellbook.getSpellData('fireball'),
            spellbook.getSpellData('ice_shard'),
            spellbook.getSpellData('heal'),
            spellbook.getSpellData('lightning_bolt')
        ].filter(spell => spell !== null);
    }
    
    allocateStat(stat) {
        // Call the player's allocateStatPoint method
        const success = this.game.player.allocateStatPoint(stat);
        
        if (success) {
            // Update UI
            this.updateStats();
            this.updateCharacterScreen();
            this.addMessage(`Increased ${stat}!`, '#0ff');
        }
    }
    
    learnSkill(skillId) {
        // Call the player's spendSkillPoint method
        const success = this.game.player.spendSkillPoint(skillId);
        
        if (success) {
            // Update UI
            this.updateStats();
            this.updateCharacterScreen();
            this.addMessage(`Learned new skill level!`);
        }
    }
    
    toggleCharacterScreen() {
        this.showCharacterScreen = !this.showCharacterScreen;
        
        if (this.showCharacterScreen) {
            this.characterScreen.style.display = 'block';
            document.getElementById('overlay-container').classList.add('active');
            this.updateCharacterScreen();
            
            // Pause game while character screen is open
            this.game.gameState = 'characterScreen';
        } else {
            this.characterScreen.style.display = 'none';
            document.getElementById('overlay-container').classList.remove('active');
            
            // Resume game
            this.game.gameState = 'playing';
        }
    }
    
    addMessage(message, color = '#fff') {
        // Add message to log
        this.messageLog.unshift({ text: message, color });
        
        // Limit log size
        if (this.messageLog.length > this.maxMessages) {
            this.messageLog.pop();
        }
        
        // Update display
        this.updateMessageLog();
    }
    
    updateMessageLog() {
        // Clear log
        this.logElement.innerHTML = '';
        
        // Add messages
        for (const message of this.messageLog) {
            const p = document.createElement('p');
            p.textContent = message.text;
            p.style.color = message.color;
            this.logElement.appendChild(p);
        }
    }
    
    update() {
        // Update stats every frame
        this.updateStats();
    }
}