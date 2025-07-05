export class HelpScreen {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.helpElement = null;
        this.currentPage = 'controls';
        this.createHelpScreen();
    }
    
    createHelpScreen() {
        const container = document.getElementById('overlay-container');
        
        // Create help screen
        this.helpElement = document.createElement('div');
        this.helpElement.id = 'help-screen';
        this.helpElement.className = 'help-screen';
        this.helpElement.style.display = 'none';
        container.appendChild(this.helpElement);
        
        // Add styles
        this.addStyles();
        
        // Add event listener only for escape key (H key is handled in UI.update)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeHelpScreen();
            }
        });
    }
    
    addStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .help-screen {
                background-color: rgba(0, 0, 0, 0.9);
                color: #fff;
                padding: 20px;
                border-radius: 10px;
                font-family: monospace;
                width: 80%;
                max-width: 800px;
                max-height: 85vh;
                overflow-y: auto;
                border: 2px solid #444;
                margin: 0 auto;
            }
            
            .help-title {
                font-size: 1.5em;
                text-align: center;
                margin-bottom: 15px;
                color: #0c0;
                border-bottom: 1px solid #444;
                padding-bottom: 10px;
            }
            
            .help-tabs {
                display: flex;
                margin-bottom: 15px;
                border-bottom: 1px solid #333;
                padding-bottom: 10px;
            }
            
            .help-tab {
                padding: 5px 15px;
                cursor: pointer;
                border-radius: 5px;
                margin-right: 10px;
            }
            
            .help-tab:hover {
                background-color: #333;
            }
            
            .help-tab.active {
                background-color: #444;
                color: #0c0;
            }
            
            .help-content {
                margin-bottom: 20px;
            }
            
            .help-section {
                margin-bottom: 20px;
            }
            
            .help-section-title {
                font-size: 1.2em;
                color: #0c0;
                margin-bottom: 10px;
                border-bottom: 1px solid #333;
                padding-bottom: 5px;
            }
            
            .help-controls-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
            }
            
            .help-controls-table th, .help-controls-table td {
                padding: 8px;
                text-align: left;
                border-bottom: 1px solid #333;
            }
            
            .help-controls-table th {
                color: #0c0;
            }
            
            .help-key {
                display: inline-block;
                background-color: #333;
                border: 1px solid #555;
                border-radius: 4px;
                padding: 2px 6px;
                font-family: monospace;
                margin: 0 2px;
            }
            
            .help-footer {
                margin-top: 20px;
                border-top: 1px solid #444;
                padding-top: 10px;
                display: flex;
                justify-content: center;
            }
            
            .help-close-button {
                background-color: #333;
                border: 1px solid #555;
                color: #fff;
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-family: monospace;
            }
            
            .rarity-display {
                display: flex;
                align-items: center;
                margin-bottom: 5px;
            }
            
            .rarity-name {
                width: 100px;
                margin-right: 10px;
            }
            
            .rarity-common { color: #aaa; }
            .rarity-uncommon { color: #5d5; }
            .rarity-rare { color: #55d; }
            .rarity-epic { color: #c5c; }
            .rarity-legendary { color: #fb0; }
            
            .item-example {
                display: flex;
                align-items: center;
                background-color: rgba(40, 40, 40, 0.7);
                border: 1px solid #555;
                border-radius: 5px;
                padding: 8px;
                margin-bottom: 10px;
            }
            
            .item-example-icon {
                font-size: 1.5em;
                margin-right: 10px;
                display: flex;
                justify-content: center;
                align-items: center;
                width: 30px;
            }
            
            .item-example-name {
                flex: 1;
            }
            
            .item-example-buttons {
                display: flex;
                gap: 5px;
            }
            
            .item-example-button {
                width: 20px;
                height: 20px;
                background-color: #333;
                border: 1px solid #555;
                color: #fff;
                font-size: 10px;
                border-radius: 3px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .item-example-button.equip {
                background-color: #22a;
                border-color: #44c;
            }
            
            .item-example-button.use {
                background-color: #2a2;
                border-color: #4c4;
            }
        `;
        document.head.appendChild(style);
    }
    
    toggleHelpScreen() {
        if (this.isOpen) {
            this.closeHelpScreen();
        } else {
            this.openHelpScreen();
        }
    }
    
    openHelpScreen() {
        this.isOpen = true;
        this.helpElement.style.display = 'block';
        document.getElementById('overlay-container').classList.add('active');
        this.updateContent();
        
        // Pause game while help is open
        this.previousGameState = this.game.gameState;
        this.game.gameState = 'help';
    }
    
    closeHelpScreen() {
        this.isOpen = false;
        this.helpElement.style.display = 'none';
        document.getElementById('overlay-container').classList.remove('active');
        
        // Resume previous game state
        if (this.previousGameState) {
            this.game.gameState = this.previousGameState;
        } else {
            this.game.gameState = 'playing';
        }
    }
    
    updateContent() {
        let content = `
            <div class="help-title">Modern Rogue - Help</div>
            
            <div class="help-tabs">
                <div class="help-tab ${this.currentPage === 'controls' ? 'active' : ''}" data-page="controls">Controls</div>
                <div class="help-tab ${this.currentPage === 'items' ? 'active' : ''}" data-page="items">Items & Inventory</div>
                <div class="help-tab ${this.currentPage === 'stats' ? 'active' : ''}" data-page="stats">Character Stats</div>
                <div class="help-tab ${this.currentPage === 'about' ? 'active' : ''}" data-page="about">About</div>
            </div>
            
            <div class="help-content">
        `;
        
        // Add content based on current page
        switch (this.currentPage) {
            case 'controls':
                content += this.getControlsContent();
                break;
            case 'items':
                content += this.getItemsContent();
                break;
            case 'stats':
                content += this.getStatsContent();
                break;
            case 'about':
                content += this.getAboutContent();
                break;
        }
        
        content += `
            </div>
            
            <div class="help-footer">
                <button class="help-close-button">Close Help (H)</button>
            </div>
        `;
        
        this.helpElement.innerHTML = content;
        
        // Add event listeners to tabs
        const tabs = this.helpElement.querySelectorAll('.help-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentPage = tab.getAttribute('data-page');
                this.updateContent();
            });
        });
        
        // Add event listener to close button
        const closeButton = this.helpElement.querySelector('.help-close-button');
        closeButton.addEventListener('click', () => {
            this.closeHelpScreen();
        });
    }
    
    getControlsContent() {
        return `
            <div class="help-section">
                <div class="help-section-title">Movement Controls</div>
                <table class="help-controls-table">
                    <tr>
                        <th>Action</th>
                        <th>Keys</th>
                    </tr>
                    <tr>
                        <td>Move Up</td>
                        <td><span class="help-key">↑</span> or <span class="help-key">W</span></td>
                    </tr>
                    <tr>
                        <td>Move Down</td>
                        <td><span class="help-key">↓</span> or <span class="help-key">S</span></td>
                    </tr>
                    <tr>
                        <td>Move Left</td>
                        <td><span class="help-key">←</span> or <span class="help-key">A</span></td>
                    </tr>
                    <tr>
                        <td>Move Right</td>
                        <td><span class="help-key">→</span> or <span class="help-key">D</span></td>
                    </tr>
                </table>
            </div>
            
            <div class="help-section">
                <div class="help-section-title">Game Controls</div>
                <table class="help-controls-table">
                    <tr>
                        <th>Action</th>
                        <th>Key</th>
                        <th>Description</th>
                    </tr>
                    <tr>
                        <td>Pick Up Item</td>
                        <td><span class="help-key">G</span></td>
                        <td>Pick up items on the ground</td>
                    </tr>
                    <tr>
                        <td>Pick Up & Equip</td>
                        <td><span class="help-key">P</span></td>
                        <td>Pick up and immediately equip items</td>
                    </tr>
                    <tr>
                        <td>Open Inventory</td>
                        <td><span class="help-key">I</span></td>
                        <td>Open inventory to manage items</td>
                    </tr>
                    <tr>
                        <td>Character Screen</td>
                        <td><span class="help-key">C</span></td>
                        <td>Open character sheet with stats and skills</td>
                    </tr>
                    <tr>
                        <td>Help Screen</td>
                        <td><span class="help-key">H</span></td>
                        <td>Open this help screen</td>
                    </tr>
                    <tr>
                        <td>Close Screen</td>
                        <td><span class="help-key">Esc</span></td>
                        <td>Close any open screen</td>
                    </tr>
                </table>
            </div>
            
            <div class="help-section">
                <div class="help-section-title">Inventory Shortcuts</div>
                <table class="help-controls-table">
                    <tr>
                        <th>Action</th>
                        <th>Keys</th>
                        <th>Description</th>
                    </tr>
                    <tr>
                        <td>Select Item</td>
                        <td><span class="help-key">1</span> - <span class="help-key">9</span></td>
                        <td>Select items in inventory by position</td>
                    </tr>
                    <tr>
                        <td>Quick Equip</td>
                        <td><span class="help-key">Shift</span> + <span class="help-key">1</span>-<span class="help-key">9</span></td>
                        <td>Equip item at position without opening menu</td>
                    </tr>
                    <tr>
                        <td>Quick Use</td>
                        <td><span class="help-key">Alt</span> + <span class="help-key">1</span>-<span class="help-key">9</span></td>
                        <td>Use item at position without opening menu</td>
                    </tr>
                    <tr>
                        <td>Equip Selected</td>
                        <td><span class="help-key">E</span></td>
                        <td>Equip the currently selected item</td>
                    </tr>
                    <tr>
                        <td>Use Selected</td>
                        <td><span class="help-key">U</span></td>
                        <td>Use the currently selected item</td>
                    </tr>
                </table>
            </div>
        `;
    }
    
    getItemsContent() {
        return `
            <div class="help-section">
                <div class="help-section-title">Item Rarities</div>
                <p>Items come in five different rarities, each with increasingly better stats:</p>
                
                <div class="rarity-display">
                    <div class="rarity-name rarity-common">Common</div>
                    <div>Basic items with minimal bonuses (70% chance)</div>
                </div>
                <div class="rarity-display">
                    <div class="rarity-name rarity-uncommon">Uncommon</div>
                    <div>Slightly better items (20% chance, level 3+)</div>
                </div>
                <div class="rarity-display">
                    <div class="rarity-name rarity-rare">Rare</div>
                    <div>Powerful items with good bonuses (7% chance, level 5+)</div>
                </div>
                <div class="rarity-display">
                    <div class="rarity-name rarity-epic">Epic</div>
                    <div>Very powerful items (2% chance, level 7+)</div>
                </div>
                <div class="rarity-display">
                    <div class="rarity-name rarity-legendary">Legendary</div>
                    <div>Extremely powerful items (1% chance, level 10+)</div>
                </div>
            </div>
            
            <div class="help-section">
                <div class="help-section-title">Item Types</div>
                
                <div class="item-example">
                    <div class="item-example-icon rarity-rare">⚔️</div>
                    <div class="item-example-name">
                        <div class="rarity-rare">Battle Axe</div>
                        <div style="font-size: 0.8em; color: #888;">Weapon (weapon)</div>
                    </div>
                    <div class="item-example-buttons">
                        <div class="item-example-button equip">E</div>
                    </div>
                </div>
                <p><strong>Weapons</strong>: Increase your Attack Power and sometimes other attributes. Equip in weapon slot.</p>
                
                <div class="item-example">
                    <div class="item-example-icon rarity-uncommon">👕</div>
                    <div class="item-example-name">
                        <div class="rarity-uncommon">Chainmail</div>
                        <div style="font-size: 0.8em; color: #888;">Armor (body)</div>
                    </div>
                    <div class="item-example-buttons">
                        <div class="item-example-button equip">E</div>
                    </div>
                </div>
                <p><strong>Armor</strong>: Increases your Defense and sometimes other attributes. Comes in head, body, and feet slots.</p>
                
                <div class="item-example">
                    <div class="item-example-icon rarity-common">🧪</div>
                    <div class="item-example-name">
                        <div class="rarity-common">Health Potion</div>
                        <div style="font-size: 0.8em; color: #888;">Consumable</div>
                    </div>
                    <div class="item-example-buttons">
                        <div class="item-example-button use">U</div>
                    </div>
                </div>
                <p><strong>Consumables</strong>: One-time use items like potions that can restore health, mana, or provide other effects.</p>
                
                <div class="item-example">
                    <div class="item-example-icon rarity-epic">💍</div>
                    <div class="item-example-name">
                        <div class="rarity-epic">Ring of Strength</div>
                        <div style="font-size: 0.8em; color: #888;">Accessory (ring)</div>
                    </div>
                    <div class="item-example-buttons">
                        <div class="item-example-button equip">E</div>
                    </div>
                </div>
                <p><strong>Accessories</strong>: Rings and amulets that provide special bonuses to attributes.</p>
            </div>
            
            <div class="help-section">
                <div class="help-section-title">Managing Your Inventory</div>
                <p>Your inventory has limited space. To manage it:</p>
                <ul>
                    <li>Press <span class="help-key">I</span> to open your inventory screen</li>
                    <li>Click the <strong>E</strong> button next to an item to equip it</li>
                    <li>Click the <strong>U</strong> button to use a consumable item</li>
                    <li>Click the <strong>U</strong> button next to equipped items to unequip them</li>
                    <li>Remember that higher-rarity items are generally more powerful</li>
                </ul>
            </div>
        `;
    }
    
    getStatsContent() {
        return `
            <div class="help-section">
                <div class="help-section-title">Character Attributes</div>
                <table class="help-controls-table">
                    <tr>
                        <th>Attribute</th>
                        <th>Description</th>
                        <th>Effects</th>
                    </tr>
                    <tr>
                        <td>Strength</td>
                        <td>Physical power</td>
                        <td>Increases Attack Power and carrying capacity</td>
                    </tr>
                    <tr>
                        <td>Dexterity</td>
                        <td>Agility and precision</td>
                        <td>Improves hit chance and dodge ability</td>
                    </tr>
                    <tr>
                        <td>Constitution</td>
                        <td>Physical toughness</td>
                        <td>Increases Max Health and damage resistance</td>
                    </tr>
                    <tr>
                        <td>Intelligence</td>
                        <td>Mental acuity</td>
                        <td>Increases Max Mana and improves magic abilities</td>
                    </tr>
                </table>
            </div>
            
            <div class="help-section">
                <div class="help-section-title">Derived Stats</div>
                <table class="help-controls-table">
                    <tr>
                        <th>Stat</th>
                        <th>Description</th>
                        <th>Calculation</th>
                    </tr>
                    <tr>
                        <td>Max Health</td>
                        <td>How much damage you can take</td>
                        <td>20 + (Constitution × 5) + ((Level - 1) × 10)</td>
                    </tr>
                    <tr>
                        <td>Max Mana</td>
                        <td>Energy for special abilities</td>
                        <td>10 + (Intelligence × 3) + ((Level - 1) × 5)</td>
                    </tr>
                    <tr>
                        <td>Attack Power</td>
                        <td>Base damage you deal</td>
                        <td>Strength + Floor(Level ÷ 2) + Weapon Bonus</td>
                    </tr>
                    <tr>
                        <td>Defense</td>
                        <td>Damage reduction</td>
                        <td>Floor(Constitution ÷ 2) + Floor(Level ÷ 3) + Armor Bonus</td>
                    </tr>
                    <tr>
                        <td>Critical Chance</td>
                        <td>Chance to deal extra damage</td>
                        <td>5% + Floor(Dexterity ÷ 5)</td>
                    </tr>
                </table>
            </div>
            
            <div class="help-section">
                <div class="help-section-title">Character Skills</div>
                <p>As you level up, you'll gain skill points to spend on special abilities:</p>
                <ul>
                    <li><strong>Power Strike</strong>: Increases damage by 20% per level (max 3)</li>
                    <li><strong>Toughness</strong>: Increases max health by 10% per level (max 3)</li>
                    <li><strong>Quick Reflexes</strong>: Improves dodge chance by 5% per level (max 3)</li>
                    <li><strong>Keen Eye</strong>: Increases critical hit chance by 3% per level (max 2)</li>
                </ul>
                <p>Press <span class="help-key">C</span> to open your character screen and spend skill points when you level up.</p>
            </div>
        `;
    }
    
    getAboutContent() {
        return `
            <div class="help-section">
                <div class="help-section-title">About Modern Rogue</div>
                <p>Modern Rogue is a browser-based roguelike game inspired by the original Rogue, with improved 2D graphics.</p>
                <p>The game features procedurally generated dungeons, character progression, an inventory system, and much more.</p>
            </div>
            
            <div class="help-section">
                <div class="help-section-title">How to Play</div>
                <p>Your goal is to explore the dungeon, find valuable items, increase your character's power, and survive as long as possible.</p>
                <ol>
                    <li>Move through the dungeon using arrow keys or WASD</li>
                    <li>Collect items by pressing G while standing on them</li>
                    <li>Equip better gear to increase your stats</li>
                    <li>Gain experience to level up and become stronger</li>
                    <li>Spend skill points to develop special abilities</li>
                </ol>
            </div>
            
            <div class="help-section">
                <div class="help-section-title">Tips for Success</div>
                <ul>
                    <li>Always keep an eye out for better equipment</li>
                    <li>Pay attention to item rarities - higher rarity items are more powerful</li>
                    <li>Use potions when your health is low</li>
                    <li>Explore thoroughly to find the best items</li>
                    <li>Press H anytime to open this help screen</li>
                </ul>
            </div>
        `;
    }
}