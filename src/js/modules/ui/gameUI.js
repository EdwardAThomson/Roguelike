export class GameUI {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.canvas = game.canvas;
        this.messageLog = []; // newest first; the HUD renders it
        this.logVersion = 0;
        this.maxMessages = 40;
        this.selectedStatTab = 'attributes'; // 'attributes' or 'skills'
        this.panelEl = null; // character tab panel inside the game modal
    }
    
    initialize() {
        // The HUD (hud.js) shows the bars and the message log; this class
        // keeps the log data and provides the character tab of the modal.
        this.addStyles();
    }

    // GameModal provider interface: the character tab.
    mountPanel(panelEl) {
        this.panelEl = panelEl;

        // Sub-tabs (Attributes / Skills) inside the character panel. Scoped
        // classes + data attributes; never use global .tab selectors here.
        const subTabBar = document.createElement('div');
        subTabBar.className = 'cs-subtabs';
        const subTabs = [['attributes', 'Attributes'], ['skills', 'Skills']];
        for (const [id, label] of subTabs) {
            const el = document.createElement('div');
            el.className = 'cs-subtab' + (id === this.selectedStatTab ? ' active' : '');
            el.dataset.subtab = id;
            el.textContent = label;
            el.addEventListener('click', () => this.switchTab(id));
            subTabBar.appendChild(el);
        }
        panelEl.appendChild(subTabBar);

        this.characterContent = document.createElement('div');
        this.characterContent.className = 'character-content';
        panelEl.appendChild(this.characterContent);
    }

    onShow() {
        this.updateCharacterScreen();
    }

    onHide() {
        // Nothing transient to clean up on the character tab.
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .cs-subtabs {
                display: flex;
                border-bottom: 1px solid var(--ui-line);
                margin-bottom: 15px;
            }

            .cs-subtab {
                padding: 8px 15px;
                cursor: pointer;
                margin-right: 5px;
                border-radius: 3px 3px 0 0;
                color: var(--ui-muted);
            }

            .cs-subtab.active {
                background-color: var(--ui-panel-2);
                border: 1px solid var(--ui-line);
                border-bottom: none;
                color: var(--ui-gold);
            }

            .character-content {
                margin-bottom: 20px;
            }
            
            .stat-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                border-bottom: 1px solid var(--ui-line);
                padding-bottom: 4px;
            }
            
            .stat-label {
                color: var(--ui-muted);
            }
            
            .skill-item {
                margin-bottom: 15px;
                padding: 10px;
                background-color: var(--ui-inset);
                border-radius: 3px;
                border: 1px solid var(--ui-line);
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
                background-color: var(--ui-gold);
            }
            
            .skill-description {
                color: #999;
                font-size: 0.9em;
                margin-bottom: 5px;
            }
            
            .skill-button {
                background-color: var(--ui-panel-2);
                border: 1px solid var(--ui-line-strong);
                color: var(--ui-gold);
                padding: 3px 8px;
                border-radius: 3px;
                cursor: pointer;
                margin-top: 5px;
                font-family: inherit;
            }
            
            .skill-button:disabled {
                color: #555;
                cursor: not-allowed;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background-color: #2a2433;
                border: 1px solid #000;
                margin-top: 3px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background-color: var(--ui-gold);
                width: 0%;
            }
            
            .health-bar .progress-fill {
                background: linear-gradient(#e0574e, #a93129);
            }
            
            .mana-bar .progress-fill {
                background: linear-gradient(#5d97ec, #2f63b9);
            }
            
            .exp-bar .progress-fill {
                background-color: var(--ui-gold);
            }
            
            .stat-button {
                background-color: var(--ui-gold);
                border: 1px solid var(--ui-gold-bright);
                color: #1a1408;
                padding: 2px 8px;
                border-radius: 3px;
                cursor: pointer;
                font-family: inherit;
                font-size: 14px;
                font-weight: bold;
                transition: background-color 0.2s;
            }
            
            .stat-button:hover {
                background-color: var(--ui-gold-bright);
            }
        `;
        document.head.appendChild(style);
    }
    
    // Kept for callers that want an immediate refresh after a stat change.
    updateStats() {
        if (this.game.ui && this.game.ui.hud) this.game.ui.hud.update();
    }
    
    switchTab(tab) {
        this.selectedStatTab = tab;
        // Scoped to this panel's sub-tabs; matched by data attribute.
        if (this.panelEl) {
            this.panelEl.querySelectorAll('.cs-subtab').forEach(t => {
                t.classList.toggle('active', t.dataset.subtab === tab);
            });
        }

        this.updateCharacterScreen();
    }
    
    updateCharacterScreen() {
        if (!this.game.player) return;
        
        const stats = this.game.player.getSummary();
        
        // Update the content based on selected tab
        if (this.selectedStatTab === 'attributes') {
            this.characterContent.innerHTML = `
                <h2>Character sheet</h2>
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
                    <div style="color: var(--ui-gold-bright); font-weight: bold;">${stats.statPoints || 0}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Strength:</div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span>${stats.strength} ${stats.strength_bonus ? `<span style="color: var(--ui-good)">(+${stats.strength_bonus})</span>` : ''}</span>
                        ${stats.statPoints > 0 ? `<button class="stat-button" data-stat="strength">+</button>` : ''}
                    </div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Dexterity:</div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span>${stats.dexterity} ${stats.dexterity_bonus ? `<span style="color: var(--ui-good)">(+${stats.dexterity_bonus})</span>` : ''}</span>
                        ${stats.statPoints > 0 ? `<button class="stat-button" data-stat="dexterity">+</button>` : ''}
                    </div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Constitution:</div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span>${stats.constitution} ${stats.constitution_bonus ? `<span style="color: var(--ui-good)">(+${stats.constitution_bonus})</span>` : ''}</span>
                        ${stats.statPoints > 0 ? `<button class="stat-button" data-stat="constitution">+</button>` : ''}
                    </div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Intelligence:</div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <span>${stats.intelligence} ${stats.intelligence_bonus ? `<span style="color: var(--ui-good)">(+${stats.intelligence_bonus})</span>` : ''}</span>
                        ${stats.statPoints > 0 ? `<button class="stat-button" data-stat="intelligence">+</button>` : ''}
                    </div>
                </div>
                
                <h3>Derived Stats</h3>
                <div class="stat-row">
                    <div class="stat-label">Health:</div>
                    <div>${stats.health} / ${stats.maxHealth} ${stats.maxHealth_bonus ? `<span style="color: var(--ui-good)">(+${stats.maxHealth_bonus})</span>` : ''}</div>
                </div>
                <div class="progress-bar health-bar">
                    <div class="progress-fill" style="width: ${(stats.health / stats.maxHealth) * 100}%"></div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Mana:</div>
                    <div>${stats.mana} / ${stats.maxMana} ${stats.maxMana_bonus ? `<span style="color: var(--ui-good)">(+${stats.maxMana_bonus})</span>` : ''}</div>
                </div>
                <div class="progress-bar mana-bar">
                    <div class="progress-fill" style="width: ${(stats.mana / stats.maxMana) * 100}%"></div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Attack Power:</div>
                    <div>${stats.attackPower} ${stats.attackPower_bonus ? `<span style="color: var(--ui-good)">(+${stats.attackPower_bonus})</span>` : ''}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Defense:</div>
                    <div>${stats.defense} ${stats.defense_bonus ? `<span style="color: var(--ui-good)">(+${stats.defense_bonus})</span>` : ''}</div>
                </div>
                <div class="stat-row">
                    <div class="stat-label">Critical Chance:</div>
                    <div>${stats.criticalChance}% ${stats.criticalChance_bonus ? `<span style="color: var(--ui-good)">(+${stats.criticalChance_bonus}%)</span>` : ''}</div>
                </div>
            `;
            
            // Add event listeners to stat buttons
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
    
    addMessage(message, color = '#fff') {
        this.messageLog.unshift({ text: message, color });
        if (this.messageLog.length > this.maxMessages) {
            this.messageLog.pop();
        }
        this.logVersion++;
    }
    
    update() {
        // The HUD refreshes itself every frame (UI.update).
    }
}