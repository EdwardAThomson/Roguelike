// SpellDatabase - centralized location for all spell definitions
import { Spell } from './spell.js';

export class SpellDatabase {
    constructor() {
        this.spells = {};
        this.initializeSpells();
    }
    
    initializeSpells() {
        // ===== OFFENSIVE SPELLS =====
        
        // Magic Dart - Basic cantrip for testing (very low cost)
        this.registerSpell(new Spell({
            id: 'magic_dart',
            name: 'Magic Dart',
            description: 'A simple magical projectile. Perfect for practice.',
            icon: '🎯',
            manaCost: 2,
            minLevel: 1,
            type: 'offensive',
            targetType: 'single',
            range: 6,
            baseDamage: 4,
            damageType: 'arcane',
            damageScaling: 0.3,
            projectileSymbol: '→',
            projectileColor: '#00ffff',
            projectileSpeed: 2
        }));
        
        // Magic Missile - Basic single-target spell
        this.registerSpell(new Spell({
            id: 'magic_missile',
            name: 'Magic Missile',
            description: 'A bolt of magical energy that never misses.',
            icon: '✨',
            manaCost: 5,
            minLevel: 1,
            type: 'offensive',
            targetType: 'single',
            range: 8,
            baseDamage: 8,
            damageType: 'arcane',
            damageScaling: 0.5,
            projectileSymbol: '•',
            projectileColor: '#9370db',
            projectileSpeed: 1
        }));
        
        // Fireball - AoE damage spell
        this.registerSpell(new Spell({
            id: 'fireball',
            name: 'Fireball',
            description: 'A ball of fire that explodes on impact.',
            icon: '🔥',
            manaCost: 12,
            minLevel: 3,
            minIntelligence: 12,
            type: 'offensive',
            targetType: 'aoe',
            range: 10,
            baseDamage: 12,
            damageType: 'fire',
            damageScaling: 0.7,
            projectileSymbol: '●',
            projectileColor: '#ff4500',
            projectileSpeed: 1,
            aoeRadius: 2,
            effects: [
                {
                    type: 'dot',
                    name: 'Burning',
                    duration: 3,
                    power: 2,
                    damageType: 'fire',
                    icon: '🔥',
                    color: '#ff4500',
                    message: '{target} catch fire!',
                    tickMessage: ''
                }
            ]
        }));
        
        // Lightning Bolt - High damage, chance to stun
        this.registerSpell(new Spell({
            id: 'lightning_bolt',
            name: 'Lightning Bolt',
            description: 'A powerful bolt of lightning that may stun the target.',
            icon: '⚡',
            manaCost: 10,
            minLevel: 2,
            minIntelligence: 10,
            type: 'offensive',
            targetType: 'single',
            range: 12,
            baseDamage: 18,
            damageType: 'lightning',
            damageScaling: 0.8,
            projectileSymbol: '⚡',
            projectileColor: '#ffff00',
            projectileSpeed: 2,
            piercing: true,
            effects: [
                {
                    type: 'stun',
                    name: 'Stunned',
                    duration: 1,
                    power: 0,
                    icon: '💫',
                    color: '#ffff00',
                    preventAction: true,
                    message: '{target} are stunned!'
                }
            ]
        }));
        
        // Ice Shard - Damage + slow
        this.registerSpell(new Spell({
            id: 'ice_shard',
            name: 'Ice Shard',
            description: 'A shard of ice that slows the target.',
            icon: '❄️',
            manaCost: 8,
            minLevel: 2,
            type: 'offensive',
            targetType: 'single',
            range: 10,
            baseDamage: 15,
            damageType: 'ice',
            damageScaling: 0.6,
            projectileSymbol: '❄',
            projectileColor: '#00bfff',
            projectileSpeed: 1,
            effects: [
                {
                    type: 'debuff',
                    name: 'Slowed',
                    duration: 3,
                    power: 0,
                    icon: '❄️',
                    color: '#00bfff',
                    speedModifier: 0.5,
                    message: '{target} are slowed!',
                    tickMessage: ''
                }
            ]
        }));
        
        // Poison Cloud - AoE DoT
        this.registerSpell(new Spell({
            id: 'poison_cloud',
            name: 'Poison Cloud',
            description: 'Creates a cloud of poison that damages over time.',
            icon: '☠️',
            manaCost: 12,
            minLevel: 4,
            minIntelligence: 14,
            type: 'offensive',
            targetType: 'aoe',
            range: 8,
            baseDamage: 8,
            damageType: 'poison',
            damageScaling: 0.5,
            projectileSymbol: '☁',
            projectileColor: '#00ff00',
            projectileSpeed: 1,
            aoeRadius: 2,
            effects: [
                {
                    type: 'dot',
                    name: 'Poisoned',
                    duration: 5,
                    power: 3,
                    damageType: 'poison',
                    icon: '☠️',
                    color: '#00ff00',
                    message: '{target} are poisoned!',
                    tickMessage: ''
                }
            ]
        }));
        
        // ===== HEALING SPELLS =====
        
        // Heal - Basic healing spell
        this.registerSpell(new Spell({
            id: 'heal',
            name: 'Heal',
            description: 'Restores health to the caster.',
            icon: '💚',
            manaCost: 12,
            minLevel: 1,
            type: 'healing',
            targetType: 'self',
            range: 0,
            baseDamage: -20, // Negative damage = healing
            damageType: 'healing',
            damageScaling: 0.8,
            projectileSymbol: '✚',
            projectileColor: '#0f0',
            projectileSpeed: 3
        }));
        
        // Regeneration - Healing over time
        this.registerSpell(new Spell({
            id: 'regeneration',
            name: 'Regeneration',
            description: 'Gradually restores health over several turns.',
            icon: '💚',
            manaCost: 12,
            minLevel: 3,
            minIntelligence: 10,
            type: 'healing',
            targetType: 'self',
            range: 0,
            baseDamage: -5,
            damageType: 'healing',
            damageScaling: 0.3,
            projectileSymbol: '✚',
            projectileColor: '#0f0',
            projectileSpeed: 3,
            effects: [
                {
                    type: 'hot',
                    name: 'Regenerating',
                    duration: 5,
                    power: 4,
                    icon: '💚',
                    color: '#0f0',
                    message: '{target} begin regenerating!',
                    tickMessage: ''
                }
            ]
        }));
        
        // ===== UTILITY SPELLS =====
        
        // Teleport - Instant movement
        this.registerSpell(new Spell({
            id: 'teleport',
            name: 'Teleport',
            description: 'Instantly teleport to a target location.',
            icon: '🌀',
            manaCost: 10,
            minLevel: 5,
            minIntelligence: 15,
            type: 'utility',
            targetType: 'direction',
            range: 8,
            requiresLineOfSight: true,
            baseDamage: 0,
            projectileSymbol: '✦',
            projectileColor: '#ff00ff',
            projectileSpeed: 3
        }));
        
        // Shield - Defensive buff
        this.registerSpell(new Spell({
            id: 'shield',
            name: 'Magic Shield',
            description: 'Creates a magical shield that increases defense.',
            icon: '🛡️',
            manaCost: 10,
            minLevel: 2,
            type: 'defensive',
            targetType: 'self',
            range: 0,
            baseDamage: 0,
            projectileSymbol: '◈',
            projectileColor: '#00ffff',
            projectileSpeed: 3,
            effects: [
                {
                    type: 'buff',
                    name: 'Shielded',
                    duration: 5,
                    power: 0,
                    icon: '🛡️',
                    color: '#00ffff',
                    statModifier: { defense: 5 },
                    message: '{target} are protected by a magic shield!',
                    tickMessage: ''
                }
            ]
        }));
    }
    
    /**
     * Register a spell in the database
     */
    registerSpell(spell) {
        this.spells[spell.id] = spell;
    }
    
    /**
     * Get a spell by ID (returns a clone)
     */
    getSpell(id) {
        const spell = this.spells[id];
        if (!spell) {
            console.error(`Spell not found: ${id}`);
            return null;
        }
        return spell.clone();
    }
    
    /**
     * Get all spells
     */
    getAllSpells() {
        return Object.values(this.spells).map(spell => spell.clone());
    }
    
    /**
     * Get spells by type
     */
    getSpellsByType(type) {
        return Object.values(this.spells)
            .filter(spell => spell.type === type)
            .map(spell => spell.clone());
    }
    
    /**
     * Get spells available to a caster
     */
    getAvailableSpells(caster) {
        return Object.values(this.spells)
            .filter(spell => {
                const canCast = spell.canCast(caster);
                return canCast.canCast || canCast.reason !== `Requires level ${spell.minLevel}`;
            })
            .map(spell => spell.clone());
    }
}
