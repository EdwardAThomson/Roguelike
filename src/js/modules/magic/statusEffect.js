// StatusEffect class - represents buffs, debuffs, DoTs, etc.
export class StatusEffect {
    constructor(config) {
        this.type = config.type; // 'dot', 'buff', 'debuff', 'stun', 'slow', etc.
        this.name = config.name || 'Status Effect';
        this.duration = config.duration || 3; // Turns remaining
        this.power = config.power || 0; // Damage per turn, or stat modifier
        this.icon = config.icon || '•';
        this.color = config.color || '#fff';
        this.ticksRemaining = this.duration;
        
        // Effect-specific properties
        this.damageType = config.damageType || 'arcane'; // For DoTs
        this.statModifier = config.statModifier || {}; // For buffs/debuffs: {attack: +5, defense: -2}
        this.preventAction = config.preventAction || false; // For stun
        this.speedModifier = config.speedModifier || 1.0; // For slow/haste (0.5 = half speed, 2.0 = double speed)
        
        // Visual feedback
        this.message = config.message || '';
        this.tickMessage = config.tickMessage || '';
    }
    
    /**
     * Apply this effect's initial impact
     */
    onApply(entity, game) {
        if (this.message && game && game.ui) {
            const targetName = entity === game.player ? 'You' : entity.name;
            game.ui.addMessage(this.message.replace('{target}', targetName), this.color);
        }
        
        console.log(`Status effect ${this.name} applied to ${entity.name} for ${this.duration} turns`);
    }
    
    /**
     * Process this effect's per-turn effect
     * Returns true if effect should continue, false if it should be removed
     */
    onTick(entity, game) {
        this.ticksRemaining--;
        
        // Apply damage over time
        if (this.type === 'dot' && this.power > 0) {
            entity.health -= this.power;
            
            if (game && game.ui) {
                const targetName = entity === game.player ? 'You' : entity.name;
                const verb = entity === game.player ? 'take' : 'takes';
                game.ui.addMessage(
                    `${targetName} ${verb} ${this.power} ${this.damageType} damage from ${this.name}!`,
                    this.color
                );
            }
            
            // Check for death
            if (entity.health <= 0) {
                if (entity === game.player) {
                    game.stateManager.handlePlayerDeath();
                } else if (entity.die) {
                    entity.die(game);
                }
            }
        }
        
        // Apply healing over time
        if (this.type === 'hot' && this.power > 0) {
            const oldHealth = entity.health;
            entity.health = Math.min(entity.maxHealth, entity.health + this.power);
            const actualHeal = entity.health - oldHealth;
            
            if (actualHeal > 0 && game && game.ui) {
                const targetName = entity === game.player ? 'You' : entity.name;
                const verb = entity === game.player ? 'regenerate' : 'regenerates';
                game.ui.addMessage(
                    `${targetName} ${verb} ${actualHeal} health from ${this.name}!`,
                    this.color
                );
            }
        }
        
        // Show tick message if provided
        if (this.tickMessage && game && game.ui && this.ticksRemaining > 0) {
            const targetName = entity === game.player ? 'You' : entity.name;
            game.ui.addMessage(this.tickMessage.replace('{target}', targetName), this.color);
        }
        
        // Return true if effect should continue
        return this.ticksRemaining > 0;
    }
    
    /**
     * Remove this effect
     */
    onRemove(entity, game) {
        if (game && game.ui) {
            const targetName = entity === game.player ? 'You' : entity.name;
            const verb = entity === game.player ? 'are' : 'is';
            game.ui.addMessage(`${targetName} ${verb} no longer affected by ${this.name}.`, '#aaa');
        }
        
        console.log(`Status effect ${this.name} removed from ${entity.name}`);
    }
    
    /**
     * Check if this effect prevents actions (like stun)
     */
    preventsAction() {
        return this.preventAction && this.ticksRemaining > 0;
    }
    
    /**
     * Get stat modifier for a specific stat
     */
    getStatModifier(statName) {
        return this.statModifier[statName] || 0;
    }
    
    /**
     * Clone this effect (for applying to multiple targets)
     */
    clone() {
        return new StatusEffect({
            type: this.type,
            name: this.name,
            duration: this.duration,
            power: this.power,
            icon: this.icon,
            color: this.color,
            damageType: this.damageType,
            statModifier: { ...this.statModifier },
            preventAction: this.preventAction,
            speedModifier: this.speedModifier,
            message: this.message,
            tickMessage: this.tickMessage
        });
    }
}
