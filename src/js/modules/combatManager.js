// New module for managing combat

export class CombatManager {
    constructor(game) {
        this.game = game;
    }

    getMonsterAt(x, y) {
        return this.game.monsters.find(monster => monster.x === x && monster.y === y);
    }
    
    handlePlayerAttack(targetX, targetY) {
        const monster = this.getMonsterAt(targetX, targetY);
        
        if (!monster) return false;
        
        // Defensive checks
        if (!this.game.player || !this.game.ui) {
            console.error('Combat: Missing game player or UI');
            return false;
        }
        
        // Calculate base damage
        const baseDamage = this.game.player.calculateAttackPower();
        
        // Add hit chance system - higher defense makes it harder to land effective hits
        const defenseRatio = monster.defense / (baseDamage + monster.defense);
        const missChance = Math.min(0.25, defenseRatio * 0.4); // Max 25% miss chance
        
        // Check for complete miss
        if (Math.random() < missChance) {
            this.game.ui.addMessage(`You swing at the ${monster.name} but can't penetrate its defenses!`, '#aaa');
            return true; // Attack happened, just didn't connect
        }
        
        // Critical hit chance
        const criticalHit = Math.random() < this.game.player.criticalChance / 100;
        
        // Critical multiplier (1.5x damage)
        const criticalMultiplier = criticalHit ? 1.5 : 1;
        
        // Random variance (80% to 120% of base damage)
        const variance = 0.8 + Math.random() * 0.4;
        console.log(`CombatManager: Variance: ${variance}`);

        // Calculate final damage - can now be 0 if defense is high enough
        const rawDamage = Math.floor(baseDamage * variance * criticalMultiplier);
        const finalDamage = Math.max(0, rawDamage - monster.defense);
        
        // Display attack message
        if (finalDamage > 0) {
            this.game.ui.addMessage(`You attack the ${monster.name} for ${finalDamage} damage!`, '#fff');
        } else {
            this.game.ui.addMessage(`Your attack bounces off the ${monster.name}'s armor!`, '#aaa');
        }
        
        // Display critical hit message
        if (criticalHit && finalDamage > 0) {
            this.game.ui.addMessage(`Critical hit!`, '#ff0');
        }
        
        // Apply damage to monster only if damage > 0
        if (finalDamage > 0) {
            monster.takeDamageFromPlayer(finalDamage, this.game);
        }
        
        return true;
    }

    spawnMonsters(count, difficultyLevel = 1) {
        for (let i = 0; i < count; i++) {
            let position;
            let isTooCloseToPlayer = true;
            
            // Find a position that's not too close to the player
            while (isTooCloseToPlayer) {
                position = this.game.dungeon.getRandomFloorPosition();
                
                // Make sure monster is not spawned too close to player
                const distanceToPlayer = 
                    Math.abs(position.x - this.game.player.x) + 
                    Math.abs(position.y - this.game.player.y);
                
                isTooCloseToPlayer = distanceToPlayer < 10;
            }
            
            // Create a random monster at this position with the appropriate difficulty
            const monster = this.game.monsterDB.createRandomMonster(position.x, position.y, difficultyLevel);
            
            // Scale monster with difficulty
            if (difficultyLevel > 1) {
                monster.health = Math.floor(monster.health * (1 + (difficultyLevel - 1) * 0.4));
                monster.maxHealth = monster.health;
                monster.strength = Math.floor(monster.strength * (1 + (difficultyLevel - 1) * 0.3));
                
                // Add a visual indicator of stronger monsters
                monster.name = `${difficultyLevel > 3 ? 'Elite ' : ''}${monster.name}`;
                
               // Make the hardest monsters more visually distinct
               if (difficultyLevel >= 7) {
                    monster.symbol = '👹'; // Different symbol for elite monsters
               }
            }
            
            this.game.monsters.push(monster);
        }
        
        console.log(`Spawned ${count} monsters at difficulty level ${difficultyLevel}`);
    }
} 