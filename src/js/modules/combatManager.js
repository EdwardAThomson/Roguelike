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
        
        // Check if player has a ranged weapon equipped
        const weapon = this.game.player.inventory?.getEquippedWeapon();
        
        if (weapon && weapon.isRanged()) {
            // Use ranged attack
            return this.handleRangedAttack(weapon, targetX, targetY);
        } else {
            // Use melee attack
            return this.handleMeleeAttack(monster);
        }
    }
    
    handleRangedAttack(weapon, targetX, targetY) {
        // Calculate distance
        const dx = targetX - this.game.player.x;
        const dy = targetY - this.game.player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check range
        if (distance > weapon.range) {
            this.game.ui.addMessage(`Target out of range! (Max: ${weapon.range} tiles)`, '#f55');
            return false;
        }
        
        // Check line of sight
        if (!this.game.fov.isTileVisible(targetX, targetY)) {
            this.game.ui.addMessage('Cannot see target!', '#f55');
            return false;
        }
        
        // Calculate damage
        const damage = this.game.player.calculateAttackPower();
        
        // Create projectile using existing projectile system
        const projectileConfig = {
            sourceX: this.game.player.x,
            sourceY: this.game.player.y,
            targetX: targetX,
            targetY: targetY,
            damage: damage,
            damageType: weapon.damageType,
            symbol: weapon.projectile.symbol,
            color: weapon.projectile.color,
            speed: weapon.projectile.speed,
            piercing: weapon.projectile.piercing || false,
            effects: weapon.projectile.effects || [],
            name: weapon.name,
            caster: this.game.player
        };
        
        this.game.projectileManager.createProjectile(projectileConfig);
        
        // Message
        this.game.ui.addMessage(`You fire ${weapon.name}!`, '#ff0');
        
        return true;
    }
    
    handleMeleeAttack(monster) {
        // Calculate base damage (includes equipment via the player override)
        const baseDamage = this.game.player.calculateAttackPower();

        // Critical hit chance
        const criticalHit = Math.random() < this.game.player.criticalChance / 100;
        const criticalMultiplier = criticalHit ? 1.5 : 1;

        // Random variance (80% to 120% of base damage)
        const variance = 0.8 + Math.random() * 0.4;

        // Raw damage; the monster's defense is applied once, as percentage
        // mitigation, inside takeDamage (via takeDamageFromPlayer).
        const rawDamage = Math.max(1, Math.floor(baseDamage * variance * criticalMultiplier));

        this.game.ui.addMessage(`You attack the ${monster.name}!`, '#fff');
        if (criticalHit) {
            this.game.ui.addMessage(`Critical hit!`, '#ff0');
        }

        // Applies mitigation and prints the actual damage / defeat message.
        monster.takeDamageFromPlayer(rawDamage, this.game);

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

            this.applyDifficultyScaling(monster, difficultyLevel);

            this.game.monsters.push(monster);
        }

        console.log(`Spawned ${count} monsters at difficulty level ${difficultyLevel}`);
    }

    // Scale a monster's combat stats with section difficulty. Boosts the stats
    // monsters actually use in combat (attackPower for damage, defense for
    // mitigation, maxHealth for durability) plus its XP reward. Pure aside from
    // mutating the passed monster, so it can be unit-tested without a game.
    applyDifficultyScaling(monster, difficultyLevel) {
        if (difficultyLevel <= 1) return monster;

        const d = difficultyLevel - 1;
        monster.maxHealth = Math.floor(monster.maxHealth * (1 + d * 0.3));
        monster.health = monster.maxHealth;
        monster.attackPower = Math.floor(monster.attackPower * (1 + d * 0.2));
        monster.defense = monster.defense + d;
        monster.xpValue = Math.floor(monster.xpValue * (1 + d * 0.25));

        // Visually flag tougher monsters.
        monster.name = `${difficultyLevel > 3 ? 'Elite ' : ''}${monster.name}`;
        if (difficultyLevel >= 7) {
            monster.symbol = '👹';
        }

        return monster;
    }
} 