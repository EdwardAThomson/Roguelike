import { Character } from './character.js';

export class Monster extends Character {
    constructor(x, y, type) {
        super();
        
        this.x = x;
        this.y = y;
        this.type = type;
        this.symbol = 'M'; // Default symbol, will be overridden
        this.color = '#f00'; // Default color
        this.name = 'Unknown Monster'; // Default name
        this.description = 'An unidentified creature';
        this.lastMove = 0;
        this.moveDelay = 300; // Slower than player
        this.lastAttack = 0;
        this.attackDelay = 1000; // 1 second between attacks
        this.aggressive = true; // Whether monster will pursue player
        this.awareOfPlayer = false; // Whether monster has seen player
        this.detectionRange = 5; // How far monster can see
        this.xpValue = 10; // XP given when defeated
        
        // Apply type-specific properties
        if (type) {
            this.applyMonsterType(type);
        }
    }
    
    applyMonsterType(type) {
        // This will be implemented in child classes or set in the monster database
    }
    
    update(game, deltaTime) {
        // Update timers
        this.lastMove += deltaTime;
        this.lastAttack += deltaTime;
        
        if (!game.player) return;
        
        // Check if player is in detection range
        const distance = this.getDistanceToPlayer(game.player);
        
        // Check if player is visible
        const key = `${this.x},${this.y}`;
        const playerKey = `${game.player.x},${game.player.y}`;
        const canSeePlayer = game.fov.visible.has(playerKey);
        
        // Become aware of player if in range and visible
        if (distance <= this.detectionRange && canSeePlayer) {
            this.awareOfPlayer = true;
        }
        
        // If aware of player and aggressive, attempt to move toward player
        if (this.awareOfPlayer && this.aggressive) {
            // Only move if enough time has passed
            if (this.lastMove >= this.moveDelay) {
                this.moveTowardPlayer(game);
                this.lastMove = 0;
            }
            
            // Try to attack player if adjacent
            if (this.isAdjacentToPlayer(game.player) && this.lastAttack >= this.attackDelay) {
                this.attackPlayer(game);
                this.lastAttack = 0;
            }
        } else if (this.lastMove >= this.moveDelay) {
            // Random movement when not pursuing
            this.moveRandomly(game);
            this.lastMove = 0;
        }
    }
    
    getDistanceToPlayer(player) {
        // Manhattan distance
        return Math.abs(this.x - player.x) + Math.abs(this.y - player.y);
    }
    
    isAdjacentToPlayer(player) {
        // Check if monster is adjacent to player (including diagonals)
        const dx = Math.abs(this.x - player.x);
        const dy = Math.abs(this.y - player.y);
        return dx <= 1 && dy <= 1 && !(dx === 0 && dy === 0);
    }
    
    moveTowardPlayer(game) {
        // Simple A* pathfinding toward player
        const player = game.player;
        
        // Determine best direction to move
        let bestX = this.x;
        let bestY = this.y;
        let bestDistance = this.getDistanceToPlayer(player);
        
        // Check all adjacent tiles
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue; // Skip current position
                
                const newX = this.x + dx;
                const newY = this.y + dy;
                
                // Check if tile is walkable
                if (this.canMoveTo(newX, newY, game)) {
                    // Calculate new distance to player
                    const newDistance = Math.abs(newX - player.x) + Math.abs(newY - player.y);
                    
                    // Choose this tile if it gets us closer to the player
                    if (newDistance < bestDistance) {
                        bestX = newX;
                        bestY = newY;
                        bestDistance = newDistance;
                    }
                }
            }
        }
        
        // Move to the best position if it's not our current position
        if (bestX !== this.x || bestY !== this.y) {
            this.x = bestX;
            this.y = bestY;
        }
    }
    
    moveRandomly(game) {
        // Move in a random direction
        const dx = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        const dy = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        if (this.canMoveTo(newX, newY, game)) {
            this.x = newX;
            this.y = newY;
        }
    }
    
    canMoveTo(x, y, game) {
        // Check if the tile is within bounds
        if (x < 0 || x >= game.gridWidth || y < 0 || y >= game.gridHeight) {
            return false;
        }
        
        // Check if the tile is walkable (floor)
        if (game.map[y][x] !== 'floor') {
            return false;
        }
        
        // Check if the tile is occupied by player
        if (game.player && game.player.x === x && game.player.y === y) {
            return false;
        }
        
        // Check if the tile is occupied by another monster
        for (const monster of game.monsters) {
            if (monster !== this && monster.x === x && monster.y === y) {
                return false;
            }
        }
        
        return true;
    }
    
    attackPlayer(game) {
        // Calculate damage
        let damage = this.calculateDamage();
        
        // Check if player has dodge chance from quick reflexes skill
        const playerDodgeChance = this.calculatePlayerDodgeChance(game.player);
        
        // Check for dodge
        if (Math.random() < playerDodgeChance) {
            game.ui.addMessage(`The ${this.name} attacks but you dodge!`, '#aaa');
            return;
        }
        
        // Player takes damage
        const result = game.player.takeDamage(damage);
        
        // Display message
        game.ui.addMessage(`The ${this.name} attacks for ${result.damage} damage!`, '#f55');
        
        // Check if player died
        if (result.isDead) {
            game.ui.addMessage('You have been defeated!', '#f00');
            // Handle player death
            game.stateManager.handlePlayerDeath();
        }
    }
    
    calculateDamage() {
        // Base damage calculation
        const baseDamage = this.attackPower;
        
        // Critical hit chance
        const criticalHit = Math.random() < this.criticalChance / 100;
        
        // Critical multiplier (1.5x damage)
        const criticalMultiplier = criticalHit ? 1.5 : 1;
        
        // Random variance (90% to 110% of base damage)
        const variance = 0.9 + Math.random() * 0.2;
        
        // Calculate final damage
        const finalDamage = Math.floor(baseDamage * variance * criticalMultiplier);
        
        return finalDamage;
    }
    
    calculatePlayerDodgeChance(player) {
        // Base dodge chance
        let dodgeChance = 0.05; // 5% base dodge
        
        // Dodge from dexterity (each point gives 0.5% dodge)
        dodgeChance += player.dexterity * 0.005;
        
        // Dodge from quick reflexes skill (5% per level)
        const quickReflexesLevel = player.getSkillLevel('quick_reflexes');
        dodgeChance += quickReflexesLevel * 0.05;
        
        // Cap dodge chance at 50%
        return Math.min(0.5, dodgeChance);
    }
    
    takeDamageFromPlayer(damage, game) {
        // Take damage
        const result = this.takeDamage(damage); // this is called from character.js
        // console.log(`Monster: takeDamageFromPlayer: damage: ${damage}, result: ${result}`);

        // Check if monster died
        if (result.isDead) {
            // Grant experience to player
            const xpGained = this.calculateXPValue();
            const leveled = game.player.gainExperience(xpGained);
            
            // Display message
            game.ui.addMessage(`${this.name} is defeated! Gained ${xpGained} XP.`, '#5f5');
            
            // Display level up message if player leveled up
            if (leveled) {
                game.ui.addMessage(`Level up! You are now level ${game.player.level}`, '#0ff');
            }
            
            // Drop loot
            this.dropLoot(game);
            
            // Remove monster from game
            const index = game.monsters.indexOf(this);
            if (index !== -1) {
                game.monsters.splice(index, 1);
            }
        } else {
            // Display damage message
            game.ui.addMessage(`${this.name} takes ${result.damage} damage.`, '#fff');
        }
    }
    
    calculateXPValue() {
        // Base XP value
        return this.xpValue;
    }
    
    dropLoot(game) {
        // Defensive check for game dependencies
        if (!game || !game.itemManager || !game.itemManager.itemDB) {
            console.warn('Monster dropLoot: Missing game dependencies');
            return;
        }
        
        // Determine loot quality based on monster level/difficulty
        const monsterLevel = this.level || 1;
        const isElite = this.name.includes('Elite');
        
        // Base drop chance
        let dropChance = 0.25; // 25% base chance
        if (isElite) dropChance += 0.15; // +15% for elite monsters
        
        // Roll for loot drop
        if (Math.random() > dropChance) return;
        
        // Determine what type of loot to drop
        const lootRoll = Math.random();
        
        if (lootRoll < 0.5) {
            // Gold (50% of drops)
            const goldAmount = Math.floor(Math.random() * 10) + 1 + (isElite ? 5 : 0);
            const gold = game.itemManager.createGoldPile(goldAmount);
            game.itemManager.addItemToGround(gold, this.x, this.y);
            
        } else if (lootRoll < 0.75) {
            // Health Potion (25% of drops)
            const potion = game.itemManager.itemDB.getItem('health_potion');
            if (potion) {
                game.itemManager.addItemToGround(potion, this.x, this.y);
                game.ui.addMessage(`${this.name} dropped a ${potion.name}!`, '#5f5');
            }
            
        } else if (lootRoll < 0.85) {
            // Mana Potion (10% of drops)
            const manaPotion = game.itemManager.itemDB.getItem('mana_potion');
            if (manaPotion) {
                game.itemManager.addItemToGround(manaPotion, this.x, this.y);
                game.ui.addMessage(`${this.name} dropped a ${manaPotion.name}!`, '#5f5');
            }
            
        } else if (lootRoll < 0.95) {
            // Scroll (10% of drops)
            const scrolls = ['scroll_of_identify', 'scroll_of_teleport'];
            const randomScroll = scrolls[Math.floor(Math.random() * scrolls.length)];
            const scroll = game.itemManager.itemDB.getItem(randomScroll);
            if (scroll) {
                game.itemManager.addItemToGround(scroll, this.x, this.y);
                game.ui.addMessage(`${this.name} dropped a ${scroll.name}!`, '#5f5');
            }
            
        } else {
            // Equipment (5% of drops, more likely for elite monsters)
            const equipmentChance = isElite ? 0.75 : 0.5;
            if (Math.random() < equipmentChance) {
                // Try to get a random equipment item
                const equipment = game.itemManager.itemDB.getRandomEquipment();
                if (equipment) {
                    game.itemManager.addItemToGround(equipment, this.x, this.y);
                    game.ui.addMessage(`${this.name} dropped ${equipment.name}!`, '#ff5');
                }
            } else {
                // Fallback to gold if no equipment available
                const goldAmount = Math.floor(Math.random() * 15) + 5;
                const gold = game.itemManager.createGoldPile(goldAmount);
                game.itemManager.addItemToGround(gold, this.x, this.y);
            }
        }
    }
    
    getSummary() {
        const baseSummary = super.getSummary();
        return {
            ...baseSummary,
            name: this.name,
            type: this.type
        };
    }
}