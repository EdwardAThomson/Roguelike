// StatusEffectManager - manages all status effects on all entities
import { StatusEffect } from './statusEffect.js';

export class StatusEffectManager {
    constructor(game) {
        this.game = game;
        // Map of entity -> array of status effects
        this.entityEffects = new Map();
    }
    
    /**
     * Apply a status effect to an entity
     */
    applyEffect(entity, effectConfig) {
        // Create the effect
        const effect = effectConfig instanceof StatusEffect ? 
            effectConfig.clone() : 
            new StatusEffect(effectConfig);
        
        // Get or create effect array for this entity
        if (!this.entityEffects.has(entity)) {
            this.entityEffects.set(entity, []);
        }
        
        const effects = this.entityEffects.get(entity);
        
        // Check if entity already has this effect type
        const existingEffect = effects.find(e => e.name === effect.name);
        
        if (existingEffect) {
            // Refresh duration or stack effect
            if (effect.duration > existingEffect.ticksRemaining) {
                existingEffect.ticksRemaining = effect.duration;
                console.log(`Refreshed ${effect.name} on ${entity.name}`);
            }
            // Could add stacking logic here if desired
        } else {
            // Add new effect
            effects.push(effect);
            effect.onApply(entity, this.game);
        }
    }
    
    /**
     * Process all status effects (called each turn)
     */
    processTurn() {
        // Process effects for all entities
        this.entityEffects.forEach((effects, entity) => {
            // Process each effect
            for (let i = effects.length - 1; i >= 0; i--) {
                const effect = effects[i];
                
                // Tick the effect
                const shouldContinue = effect.onTick(entity, this.game);
                
                // Remove if expired
                if (!shouldContinue) {
                    effect.onRemove(entity, this.game);
                    effects.splice(i, 1);
                }
            }
            
            // Clean up empty effect arrays
            if (effects.length === 0) {
                this.entityEffects.delete(entity);
            }
        });
    }
    
    /**
     * Get all effects on an entity
     */
    getEffects(entity) {
        return this.entityEffects.get(entity) || [];
    }
    
    /**
     * Check if entity has a specific effect
     */
    hasEffect(entity, effectName) {
        const effects = this.getEffects(entity);
        return effects.some(e => e.name === effectName);
    }
    
    /**
     * Check if entity is stunned (cannot act)
     */
    isStunned(entity) {
        const effects = this.getEffects(entity);
        return effects.some(e => e.preventsAction());
    }
    
    /**
     * Get total stat modifier from all effects
     */
    getStatModifier(entity, statName) {
        const effects = this.getEffects(entity);
        return effects.reduce((total, effect) => {
            return total + effect.getStatModifier(statName);
        }, 0);
    }
    
    /**
     * Get speed modifier from all effects
     */
    getSpeedModifier(entity) {
        const effects = this.getEffects(entity);
        return effects.reduce((multiplier, effect) => {
            return multiplier * effect.speedModifier;
        }, 1.0);
    }
    
    /**
     * Remove all effects from an entity
     */
    clearEffects(entity) {
        const effects = this.getEffects(entity);
        effects.forEach(effect => {
            effect.onRemove(entity, this.game);
        });
        this.entityEffects.delete(entity);
    }
    
    /**
     * Remove a specific effect from an entity
     */
    removeEffect(entity, effectName) {
        const effects = this.getEffects(entity);
        const index = effects.findIndex(e => e.name === effectName);
        
        if (index !== -1) {
            const effect = effects[index];
            effect.onRemove(entity, this.game);
            effects.splice(index, 1);
            
            if (effects.length === 0) {
                this.entityEffects.delete(entity);
            }
        }
    }
    
    /**
     * Clean up effects for dead/removed entities
     */
    cleanupDeadEntities() {
        const entitiesToRemove = [];
        
        this.entityEffects.forEach((effects, entity) => {
            // Check if entity is dead or no longer exists
            if (!entity || entity.health <= 0) {
                entitiesToRemove.push(entity);
            }
        });
        
        entitiesToRemove.forEach(entity => {
            this.entityEffects.delete(entity);
        });
    }
    
    /**
     * Get a summary of effects for UI display
     */
    getEffectsSummary(entity) {
        const effects = this.getEffects(entity);
        return effects.map(effect => ({
            name: effect.name,
            icon: effect.icon,
            color: effect.color,
            duration: effect.ticksRemaining
        }));
    }
}
