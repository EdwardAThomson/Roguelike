// ProjectileManager - manages all active projectiles in the game
import { Projectile } from './projectile.js';

export class ProjectileManager {
    constructor(game) {
        this.game = game;
        this.projectiles = [];
        this.animationSpeed = 100; // ms between projectile movements
        this.lastUpdate = 0;
    }
    
    /**
     * Create and launch a new projectile
     */
    createProjectile(config) {
        const projectile = new Projectile(config);
        projectile.calculatePath();
        this.projectiles.push(projectile);
        
        console.log(`Projectile created: ${projectile.name} from (${projectile.sourceX},${projectile.sourceY}) to (${projectile.targetX},${projectile.targetY})`);
        
        return projectile;
    }
    
    /**
     * Update all active projectiles
     */
    update(deltaTime) {
        this.lastUpdate += deltaTime;
        
        // Only update at animation speed intervals
        if (this.lastUpdate < this.animationSpeed) {
            return;
        }
        
        this.lastUpdate = 0;
        
        // Update each projectile
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            if (!projectile.active) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Move projectile
            const stillActive = projectile.update();
            
            if (!stillActive) {
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Check for collisions at current position
            this.checkCollisions(projectile);
        }
    }
    
    /**
     * Check if projectile hits anything at its current position
     */
    checkCollisions(projectile) {
        const pos = projectile.getPosition();
        
        // Check for wall collision
        if (this.game.map[pos.y] && this.game.map[pos.y][pos.x] === 'wall') {
            this.handleWallHit(projectile, pos);
            return;
        }
        
        // Check for monster collision
        const monster = this.game.monsters.find(m => m.x === pos.x && m.y === pos.y && m.health > 0);
        if (monster && !projectile.hasHitTarget(monster)) {
            this.handleMonsterHit(projectile, monster);
            return;
        }
        
        // Check for player collision (for enemy projectiles in the future)
        if (this.game.player && this.game.player.x === pos.x && this.game.player.y === pos.y) {
            if (projectile.source !== this.game.player && !projectile.hasHitTarget(this.game.player)) {
                this.handlePlayerHit(projectile, this.game.player);
                return;
            }
        }
        
        // Check if projectile reached target position (for AoE spells)
        if (projectile.hasReachedTarget() && projectile.aoeRadius > 0) {
            this.handleAoEEffect(projectile);
        }
    }
    
    /**
     * Handle projectile hitting a wall
     */
    handleWallHit(projectile, pos) {
        // AoE spells explode on walls
        if (projectile.aoeRadius > 0) {
            this.handleAoEEffect(projectile);
        } else {
            // Regular projectiles just stop
            projectile.deactivate();
        }
    }
    
    /**
     * Handle projectile hitting a monster
     */
    handleMonsterHit(projectile, monster) {
        projectile.markTargetHit(monster);
        
        // Apply damage
        if (projectile.damage > 0) {
            this.applyDamage(monster, projectile);
        }
        
        // Apply status effects
        if (projectile.effects && projectile.effects.length > 0) {
            this.applyStatusEffects(monster, projectile.effects);
        }
        
        // Check if projectile should continue (piercing) or stop
        if (!projectile.piercing) {
            // Check for AoE explosion
            if (projectile.aoeRadius > 0) {
                this.handleAoEEffect(projectile);
            } else {
                projectile.deactivate();
            }
        }
    }
    
    /**
     * Handle projectile hitting the player
     */
    handlePlayerHit(projectile, player) {
        projectile.markTargetHit(player);
        
        // Apply damage (negative damage = healing)
        if (projectile.damage !== 0) {
            this.applyDamage(player, projectile);
        }
        
        // Apply status effects
        if (projectile.effects && projectile.effects.length > 0) {
            this.applyStatusEffects(player, projectile.effects);
        }
        
        // Projectiles targeting player always stop
        if (!projectile.piercing) {
            projectile.deactivate();
        }
    }
    
    /**
     * Handle area-of-effect explosion
     */
    handleAoEEffect(projectile) {
        const pos = projectile.getPosition();
        const radius = projectile.aoeRadius;
        
        console.log(`AoE effect at (${pos.x},${pos.y}) with radius ${radius}`);
        
        // Find all entities within radius
        const affectedEntities = [];
        
        // Check monsters
        this.game.monsters.forEach(monster => {
            const distance = Math.sqrt(
                Math.pow(monster.x - pos.x, 2) + 
                Math.pow(monster.y - pos.y, 2)
            );
            
            if (distance <= radius && monster.health > 0) {
                affectedEntities.push(monster);
            }
        });
        
        // Check player (if projectile is from enemy)
        if (projectile.source !== this.game.player) {
            const playerDistance = Math.sqrt(
                Math.pow(this.game.player.x - pos.x, 2) + 
                Math.pow(this.game.player.y - pos.y, 2)
            );
            
            if (playerDistance <= radius) {
                affectedEntities.push(this.game.player);
            }
        }
        
        // Apply effects to all entities in radius
        affectedEntities.forEach(entity => {
            if (projectile.damage > 0) {
                // AoE damage is often reduced
                const aoeDamage = Math.floor(projectile.damage * 0.8);
                this.applyDamage(entity, { ...projectile, damage: aoeDamage });
            }
            
            if (projectile.effects && projectile.effects.length > 0) {
                this.applyStatusEffects(entity, projectile.effects);
            }
        });
        
        // Show AoE message
        if (affectedEntities.length > 0) {
            this.game.ui.addMessage(
                `${projectile.name} hits ${affectedEntities.length} target${affectedEntities.length > 1 ? 's' : ''}!`,
                projectile.color
            );
        }
        
        // Deactivate projectile after AoE
        projectile.deactivate();
    }
    
    /**
     * Apply damage to an entity
     */
    applyDamage(entity, projectile) {
        let damage = projectile.damage;
        
        // Apply defense reduction for physical projectiles
        if (projectile.type === 'physical' && entity.calculateDefense) {
            const defense = entity.calculateDefense();
            damage = Math.max(1, damage - defense);
        }
        
        // Healing is negative damage
        if (damage < 0) {
            const healAmount = Math.abs(damage);
            const oldHealth = entity.health;
            entity.health = Math.min(entity.maxHealth, entity.health + healAmount);
            const actualHeal = entity.health - oldHealth;
            
            if (entity === this.game.player) {
                this.game.ui.addMessage(`You are healed for ${actualHeal} health!`, '#0f0');
            } else {
                this.game.ui.addMessage(`${entity.name} is healed for ${actualHeal} health!`, '#0f0');
            }
        } else {
            // Use takeDamage method which returns proper result
            const result = entity.takeDamage(damage);
            
            // Show damage message
            const damageColor = this.getDamageColor(projectile.damageType);
            if (entity === this.game.player) {
                this.game.ui.addMessage(`You take ${result.damage} ${projectile.damageType} damage!`, damageColor);
            } else {
                this.game.ui.addMessage(`${entity.name} takes ${result.damage} ${projectile.damageType} damage!`, damageColor);
            }
            
            // Check for death
            if (result.isDead) {
                if (entity === this.game.player) {
                    this.game.stateManager.handlePlayerDeath();
                } else {
                    // Handle monster death
                    if (entity.calculateXPValue && entity.dropLoot) {
                        // Grant XP to player
                        const xpGained = entity.calculateXPValue();
                        const leveled = this.game.player.gainExperience(xpGained);
                        
                        this.game.ui.addMessage(`${entity.name} is defeated! Gained ${xpGained} XP.`, '#5f5');
                        
                        if (leveled) {
                            this.game.ui.addMessage(`Level up! You are now level ${this.game.player.level}`, '#0ff');
                        }
                        
                        // Drop loot
                        entity.dropLoot(this.game);
                    }
                    
                    // Remove monster from game
                    const index = this.game.monsters.indexOf(entity);
                    if (index !== -1) {
                        this.game.monsters.splice(index, 1);
                    }
                }
            }
        }
    }
    
    /**
     * Apply status effects to an entity
     */
    applyStatusEffects(entity, effects) {
        // This will be implemented when we create the StatusEffectManager
        // For now, just log
        console.log(`Applying ${effects.length} status effects to ${entity.name}`);
        
        // If status effect manager exists, use it
        if (this.game.statusEffectManager) {
            effects.forEach(effect => {
                this.game.statusEffectManager.applyEffect(entity, effect);
            });
        }
    }
    
    /**
     * Get color for damage type
     */
    getDamageColor(damageType) {
        const colors = {
            fire: '#ff4500',
            ice: '#00bfff',
            lightning: '#ffff00',
            arcane: '#9370db',
            physical: '#fff',
            poison: '#00ff00',
            healing: '#0f0'
        };
        
        return colors[damageType] || '#fff';
    }
    
    /**
     * Get all active projectiles (for rendering)
     */
    getActiveProjectiles() {
        return this.projectiles.filter(p => p.active);
    }
    
    /**
     * Clear all projectiles
     */
    clear() {
        this.projectiles = [];
    }
}
