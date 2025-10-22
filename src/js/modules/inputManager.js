// New module for managing input

export class InputManager {
    constructor(game) {
        this.game = game;
        this.input = game.input;
        this.lastSpellCast = 0;
        this.spellCooldown = 300; // ms between spell casts
        
        // Track last key states for item interaction keys
        this.itemKeyStates = {
            g: false,
            p: false,
            u: false,
            z: false  // Z for drop (D conflicts with movement)
        };
        
        // Track Space bar state for ranged weapon firing
        this.spaceKeyState = false;
    }

    handleInput() {
        // console.log('🎮 InputManager.handleInput: CALLED');
        
        // Skip input if not in playing state
        if (this.game.stateManager && typeof this.game.stateManager.isPlaying === 'function') {
            const isPlaying = this.game.stateManager.isPlaying();
            //console.log(`🎮 InputManager.handleInput: isPlaying = ${isPlaying}`);
            if (!isPlaying) {
                console.log('🎮 InputManager.handleInput: NOT PLAYING - returning early');
                return;
            }
        } else if (this.game.gameState !== 'playing') {
            // Fallback to direct gameState check
            console.log(`🎮 InputManager.handleInput: gameState = ${this.game.gameState} - returning early`);
            return;
        }
        
        // SPELL HOTKEYS (Q, R, F, V, X) - Cast spells from spellbook
        const spellKeys = ['q', 'r', 'f', 'v', 'x'];
        for (let i = 0; i < spellKeys.length; i++) {
            if (this.input.isKeyDown(spellKeys[i])) {
                const now = Date.now();
                if (now - this.lastSpellCast >= this.spellCooldown) {
                    this.castSpellFromSlot(i);
                    this.lastSpellCast = now;
                    return;
                }
            }
        }
        
        // SPACE BAR - Fire ranged weapon (with edge detection)
        const spaceDown = this.input.isKeyDown(' ');
        const spacePressed = spaceDown && !this.spaceKeyState;
        this.spaceKeyState = spaceDown;
        
        if (spacePressed) {
            this.handleRangedWeaponFire();
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
        // Get key states with manual edge detection
        const gDown = this.input.isKeyDown('g');
        const pDown = this.input.isKeyDown('p');
        const uDown = this.input.isKeyDown('u');
        const zDown = this.input.isKeyDown('z');
        
        // Detect rising edge (key just pressed)
        const gPressed = gDown && !this.itemKeyStates.g;
        const pPressed = pDown && !this.itemKeyStates.p;
        const uPressed = uDown && !this.itemKeyStates.u;
        const zPressed = zDown && !this.itemKeyStates.z;
        
        // Update last states
        this.itemKeyStates.g = gDown;
        this.itemKeyStates.p = pDown;
        this.itemKeyStates.u = uDown;
        this.itemKeyStates.z = zDown;
        
        // Check for item pickup
        if (gPressed) {
            console.log('✅ G key pressed for pickup');
            const itemsAtPosition = this.game.itemManager.getItemsAt(this.game.player.x, this.game.player.y);
            if (itemsAtPosition.length > 0) {
                this.game.itemManager.playerPickupItem(this.game.player.x, this.game.player.y);
            } else {
                this.game.ui.addMessage('There is nothing here to pick up.', '#aaa');
            }
        }
        
        // Check for pickup and equip in one action
        if (pPressed) {
            this.handleEquipItem();
        }
        
        // Check for using item (u key)
        if (uPressed) {
            // Show a message about using items from inventory
            this.game.ui.addMessage('Open inventory (I) to use items', '#aaa');
        }
        
        // Check for dropping item (Z key)
        if (zPressed) {
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
    
    // Cast spell from spellbook slot (0-8 for keys 1-9)
    castSpellFromSlot(slotIndex) {
        console.log(`✨ castSpellFromSlot: Slot ${slotIndex + 1} pressed`);
        
        if (!this.game.player || !this.game.player.spellbook) {
            console.log('❌ castSpellFromSlot: No player or spellbook found!');
            return;
        }
        
        // Get spell from slot
        const spell = this.game.player.spellbook.getSpellInSlot(slotIndex);
        
        if (!spell) {
            console.log(`❌ castSpellFromSlot: No spell in slot ${slotIndex + 1}`);
            if (this.game.ui) {
                this.game.ui.addMessage(`No spell in slot ${slotIndex + 1}!`, '#f55');
            }
            return;
        }
        
        console.log(`✨ castSpellFromSlot: Casting ${spell.name}`);
        
        // Check mana cost
        if (this.game.player.mana < spell.manaCost) {
            console.log(`❌ castSpellFromSlot: Not enough mana! Need ${spell.manaCost}, have ${this.game.player.mana}`);
            if (this.game.ui) {
                this.game.ui.addMessage(`Not enough mana! (Need ${spell.manaCost})`, '#f55');
            }
            return;
        }
        
        // Cast based on spell type
        if (spell.type === 'healing' || (spell.targetType === 'self')) {
            this.castHealingSpell(spell);
        } else if (spell.type === 'offensive' || spell.type === 'damage') {
            // Use proper Spell.cast() method for visual projectiles
            if (spell.cast) {
                // Find nearest monster as target
                const nearestMonster = this.findNearestMonster(spell.range || 10);
                
                if (!nearestMonster) {
                    console.log('❌ castDamageSpell: No monsters in range!');
                    if (this.game.ui) {
                        this.game.ui.addMessage('No targets in range!', '#f55');
                    }
                    return;
                }
                
                console.log(`✨ Casting ${spell.name} at ${nearestMonster.name} (${nearestMonster.x}, ${nearestMonster.y})`);
                spell.cast(this.game.player, nearestMonster.x, nearestMonster.y, this.game);
            } else {
                // Fallback to old instant damage method
                this.castDamageSpell(spell);
            }
        } else {
            console.warn(`⚠️ Unknown spell type: ${spell.type}`);
            if (this.game.ui) {
                this.game.ui.addMessage(`Cannot cast ${spell.name} - unknown spell type!`, '#f55');
            }
        }
    }
    
    // Cast healing spell on self
    castHealingSpell(spell) {
        console.log(`✨ castHealingSpell: Casting ${spell.name}`);
        
        // Check mana (should already be checked, but double-check)
        if (this.game.player.mana < spell.manaCost) {
            if (this.game.ui) {
                this.game.ui.addMessage(`Not enough mana! (Need ${spell.manaCost})`, '#f55');
            }
            return;
        }
        
        // Calculate healing amount using Spell's calculateDamage method
        // (negative damage = healing)
        let healing;
        if (spell.calculateDamage) {
            // New Spell class format
            healing = Math.abs(spell.calculateDamage(this.game.player));
        } else if (spell.healing && spell.healing.min !== undefined && spell.healing.max !== undefined) {
            // Old format fallback
            healing = Math.floor(Math.random() * (spell.healing.max - spell.healing.min + 1)) + spell.healing.min;
        } else {
            console.error('❌ castHealingSpell: Spell has no healing data!', spell);
            healing = 10; // Fallback
        }
        
        // Heal player
        const oldHealth = this.game.player.health;
        this.game.player.heal(healing);
        const actualHealing = this.game.player.health - oldHealth;
        
        // Spend mana
        this.game.player.mana -= spell.manaCost;
        
        console.log(`✨ castHealingSpell: Healed ${actualHealing} HP, spent ${spell.manaCost} mana`);
        
        if (this.game.ui) {
            this.game.ui.addMessage(`${spell.icon} ${spell.name} heals you for ${actualHealing} HP!`, '#0f0');
        }
    }
    
    // Cast damage spell at nearest monster
    castDamageSpell(spell) {
        console.log(`✨ castDamageSpell: Casting ${spell.name}`);
        
        // Find nearest monster
        const nearestMonster = this.findNearestMonster(spell.range || 10);
        
        if (!nearestMonster) {
            console.log('❌ castDamageSpell: No monsters in range!');
            if (this.game.ui) {
                this.game.ui.addMessage('No targets in range!', '#f55');
            }
            return;
        }
        
        console.log(`✨ castDamageSpell: Targeting ${nearestMonster.name} at (${nearestMonster.x}, ${nearestMonster.y})`);
        
        // Calculate damage - support both old and new spell formats
        let damage;
        if (spell.baseDamage !== undefined) {
            // New SpellDatabase format: baseDamage with scaling
            const scaling = spell.damageScaling || 0;
            const playerLevel = this.game.player.level || 1;
            const variance = 0.2; // ±20% variance
            const baseWithScaling = spell.baseDamage + (spell.baseDamage * scaling * (playerLevel - 1));
            damage = Math.floor(baseWithScaling * (1 + (Math.random() * variance * 2 - variance)));
        } else if (spell.damage && spell.damage.min !== undefined && spell.damage.max !== undefined) {
            // Old format: damage.min and damage.max
            damage = Math.floor(Math.random() * (spell.damage.max - spell.damage.min + 1)) + spell.damage.min;
        } else {
            console.error('❌ castDamageSpell: Spell has no damage data!', spell);
            damage = 1; // Fallback
        }
        console.log(`✨ castDamageSpell: Dealing ${damage} damage to ${nearestMonster.name}`);
        
        // Deal damage
        const result = nearestMonster.takeDamage(damage);
        
        // Spend mana
        this.game.player.mana -= spell.manaCost;
        
        if (this.game.ui) {
            this.game.ui.addMessage(`${spell.icon} ${spell.name} hits ${nearestMonster.name} for ${damage} damage!`, '#0af');
        }
        
        // Check if monster died
        if (result.isDead) {
            console.log(`✨ castDamageSpell: ${nearestMonster.name} was killed!`);
            if (this.game.ui) {
                this.game.ui.addMessage(`${nearestMonster.name} is defeated!`, '#0f0');
            }
            
            // Remove dead monster
            const monsterIndex = this.game.monsters.indexOf(nearestMonster);
            if (monsterIndex !== -1) {
                this.game.monsters.splice(monsterIndex, 1);
            }
        }
        
        console.log(`✨ castDamageSpell: Cast complete! Mana: ${this.game.player.mana}/${this.game.player.maxMana}`);
    }
    
    // Find nearest visible monster within range
    findNearestMonster(maxRange = 10) {
        if (!this.game.player || !this.game.monsters) {
            return null;
        }
        
        let nearestMonster = null;
        let nearestDistance = Infinity;
        
        for (const monster of this.game.monsters) {
            if (monster.health <= 0) continue;
            
            // Calculate distance
            const dx = monster.x - this.game.player.x;
            const dy = monster.y - this.game.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check range
            if (distance > maxRange) continue;
            
            // Check if visible (FOV) - FOV uses Set with "x,y" keys
            if (this.game.fov && this.game.fov.visible) {
                const visibleKey = `${monster.x},${monster.y}`;
                if (!this.game.fov.visible.has(visibleKey)) {
                    continue;
                }
            }
            
            // Track nearest
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestMonster = monster;
            }
        }
        
        if (nearestMonster) {
            console.log(`🎯 findNearestMonster: Found ${nearestMonster.name} at distance ${Math.floor(nearestDistance)} tiles`);
        } else {
            console.log('🎯 findNearestMonster: No monsters found in range or visible');
        }
        
        return nearestMonster;
    }
    
    // Handle UI-related key presses (can be called even when not in playing state)
    handleUIInput() {
        if (!this.game.ui) return;
        
        // Track last key states for debouncing
        if (!this.uiKeyStates) {
            this.uiKeyStates = {
                i: false,
                c: false,
                h: false,
                b: false
            };
        }
        
        // Get key states with manual edge detection
        const iDown = this.input.isKeyDown('i');
        const cDown = this.input.isKeyDown('c');
        const hDown = this.input.isKeyDown('h');
        const bDown = this.input.isKeyDown('b');
        
        // Detect rising edge (key just pressed)
        const iPressed = iDown && !this.uiKeyStates.i;
        const cPressed = cDown && !this.uiKeyStates.c;
        const hPressed = hDown && !this.uiKeyStates.h;
        const bPressed = bDown && !this.uiKeyStates.b;
        
        // Update last states
        this.uiKeyStates.i = iDown;
        this.uiKeyStates.c = cDown;
        this.uiKeyStates.h = hDown;
        this.uiKeyStates.b = bDown;
        
        // Handle UI keys
        if (iPressed) {
            console.log('✅ I key pressed, toggling inventory');
            this.game.ui.inventoryUI.toggleInventory();
        }
        
        if (cPressed) {
            console.log('✅ C key pressed, toggling character screen');
            this.game.ui.gameUI.toggleCharacterScreen();
        }
        
        if (hPressed) {
            console.log('✅ H key pressed, toggling help screen');
            this.game.ui.helpScreen.toggleHelpScreen();
        }
        
        if (bPressed) {
            console.log('✅ B key pressed, toggling spellbook');
            if (this.game.ui.spellbookUI) {
                this.game.ui.spellbookUI.toggleSpellbook();
            }
        }
    }
    
    handleRangedWeaponFire() {
        // Check if player has a ranged weapon equipped
        const weapon = this.game.player.inventory?.getEquippedWeapon();
        
        if (!weapon) {
            this.game.ui.addMessage('No weapon equipped!', '#f55');
            return;
        }
        
        if (!weapon.isRanged()) {
            this.game.ui.addMessage('You need a ranged weapon equipped! (Bow, Crossbow, etc.)', '#f55');
            return;
        }
        
        // Find nearest monster in range
        const nearestMonster = this.findNearestMonster(weapon.range);
        
        if (!nearestMonster) {
            this.game.ui.addMessage(`No targets in range! (${weapon.name} range: ${weapon.range} tiles)`, '#f55');
            return;
        }
        
        // Fire at nearest monster
        this.handlePlayerAttack(nearestMonster.x, nearestMonster.y);
    }
} 