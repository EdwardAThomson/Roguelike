// Spell class - represents a castable spell
export class Spell {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.description = config.description || '';
        this.icon = config.icon || '✨';
        
        // Casting requirements
        this.manaCost = config.manaCost || 0;
        this.minLevel = config.minLevel || 1;
        this.minIntelligence = config.minIntelligence || 0;
        
        // Spell properties
        this.type = config.type || 'offensive'; // 'offensive', 'defensive', 'utility', 'healing'
        this.targetType = config.targetType || 'single'; // 'single', 'self', 'aoe', 'direction'
        this.range = config.range || 10; // Maximum range in tiles
        this.requiresLineOfSight = config.requiresLineOfSight !== false; // Default true
        
        // Damage/healing properties
        this.baseDamage = config.baseDamage || 0;
        this.damageType = config.damageType || 'arcane'; // 'fire', 'ice', 'lightning', 'arcane', 'physical'
        this.damageScaling = config.damageScaling || 0; // Scales with intelligence
        
        // Projectile properties
        this.projectileSpeed = config.projectileSpeed || 1;
        this.projectileSymbol = config.projectileSymbol || '•';
        this.projectileColor = config.projectileColor || '#fff';
        this.piercing = config.piercing || false;
        this.homing = config.homing || false;
        
        // Area of effect
        this.aoeRadius = config.aoeRadius || 0;
        
        // Status effects
        this.effects = config.effects || []; // Array of status effect configs
        
        // Cooldown (turns)
        this.cooldown = config.cooldown || 0;
        this.currentCooldown = 0;
    }
    
    /**
     * Check if caster can cast this spell
     */
    canCast(caster) {
        // Check mana
        if (caster.mana < this.manaCost) {
            return { canCast: false, reason: 'Not enough mana' };
        }
        
        // Check level
        if (caster.level < this.minLevel) {
            return { canCast: false, reason: `Requires level ${this.minLevel}` };
        }
        
        // Check intelligence (include equipment bonuses)
        let totalIntelligence = caster.intelligence;
        if (caster.getSummary) {
            const summary = caster.getSummary();
            totalIntelligence = summary.intelligence + (summary.intelligence_bonus || 0);
        }
        
        if (totalIntelligence < this.minIntelligence) {
            return { canCast: false, reason: `Requires ${this.minIntelligence} intelligence` };
        }
        
        // Check cooldown
        if (this.currentCooldown > 0) {
            return { canCast: false, reason: `On cooldown (${this.currentCooldown} turns)` };
        }
        
        return { canCast: true };
    }
    
    /**
     * Calculate actual damage based on caster's stats
     */
    calculateDamage(caster) {
        let damage = this.baseDamage;
        
        // Add intelligence scaling
        if (this.damageScaling > 0 && caster.intelligence) {
            damage += Math.floor(caster.intelligence * this.damageScaling);
        }
        
        // Add level-based bonus (+5% per level above 1)
        if (caster.level && caster.level > 1) {
            const levelBonus = 1 + ((caster.level - 1) * 0.05);
            damage = Math.floor(damage * levelBonus);
        }
        
        // Add random variance (90-110%)
        const variance = 0.9 + Math.random() * 0.2;
        damage = Math.floor(damage * variance);
        
        return damage;
    }
    
    /**
     * Cast this spell
     */
    cast(caster, targetX, targetY, game) {
        // Check if can cast
        const canCastResult = this.canCast(caster);
        if (!canCastResult.canCast) {
            if (game && game.ui) {
                game.ui.addMessage(canCastResult.reason, '#f55');
            }
            return false;
        }
        
        // Consume mana
        caster.mana -= this.manaCost;
        
        // Set cooldown
        this.currentCooldown = this.cooldown;
        
        // Calculate damage
        const damage = this.calculateDamage(caster);
        
        // Create projectile config
        const projectileConfig = {
            sourceX: caster.x,
            sourceY: caster.y,
            targetX: targetX,
            targetY: targetY,
            source: caster,
            type: 'magical',
            damageType: this.damageType,
            damage: damage,
            symbol: this.projectileSymbol,
            color: this.projectileColor,
            name: this.name,
            aoeRadius: this.aoeRadius,
            piercing: this.piercing,
            homing: this.homing,
            speed: this.projectileSpeed,
            effects: this.effects
        };
        
        // Create projectile
        if (game && game.projectileManager) {
            game.projectileManager.createProjectile(projectileConfig);
        }
        
        // Show cast message
        if (game && game.ui) {
            const casterName = caster === game.player ? 'You' : caster.name;
            const verb = caster === game.player ? 'cast' : 'casts';
            game.ui.addMessage(`${casterName} ${verb} ${this.name}!`, this.projectileColor);
        }
        
        console.log(`${caster.name} cast ${this.name} for ${damage} damage`);
        
        return true;
    }
    
    /**
     * Reduce cooldown (called each turn)
     */
    tickCooldown() {
        if (this.currentCooldown > 0) {
            this.currentCooldown--;
        }
    }
    
    /**
     * Clone this spell
     */
    clone() {
        return new Spell({
            id: this.id,
            name: this.name,
            description: this.description,
            icon: this.icon,
            manaCost: this.manaCost,
            minLevel: this.minLevel,
            minIntelligence: this.minIntelligence,
            type: this.type,
            targetType: this.targetType,
            range: this.range,
            requiresLineOfSight: this.requiresLineOfSight,
            baseDamage: this.baseDamage,
            damageType: this.damageType,
            damageScaling: this.damageScaling,
            projectileSpeed: this.projectileSpeed,
            projectileSymbol: this.projectileSymbol,
            projectileColor: this.projectileColor,
            piercing: this.piercing,
            homing: this.homing,
            aoeRadius: this.aoeRadius,
            effects: this.effects.map(e => ({ ...e })),
            cooldown: this.cooldown
        });
    }
}
