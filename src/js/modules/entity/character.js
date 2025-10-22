export class Character {
    constructor() {
        // Base stats
        this.level = 1;
        this.experience = 0;
        this.experienceToNextLevel = 100;
        
        // Core attributes
        this.strength = 10;     // Affects damage and carrying capacity
        this.dexterity = 10;    // Affects hit chance and dodge
        this.constitution = 10; // Affects max health and resistance
        this.intelligence = 10; // Affects magic and identification
        
        // Derived stats
        this.maxHealth = this.calculateMaxHealth();
        this.health = this.maxHealth;
        this.maxMana = this.calculateMaxMana();
        this.mana = this.maxMana;
        this.attackPower = this.calculateAttackPower();
        this.defense = this.calculateDefense();
        this.criticalChance = this.calculateCriticalChance();
        
        // Skills and progression
        this.skillPoints = 0;
        this.statPoints = 0; // Stat points for attribute allocation
        this.availableSkills = [
            { id: 'power_strike', name: 'Power Strike', level: 0, maxLevel: 3, description: 'Deal 20% extra damage' },
            { id: 'toughness', name: 'Toughness', level: 0, maxLevel: 3, description: 'Increase max health by 10%' },
            { id: 'quick_reflexes', name: 'Quick Reflexes', level: 0, maxLevel: 3, description: 'Increase dodge chance by 5%' },
            { id: 'keen_eye', name: 'Keen Eye', level: 0, maxLevel: 2, description: 'Improve critical hit chance by 3%' }
        ];
        
        // Debug throttling
        this.lastDebugLog = 0;
        this.debugThrottleMs = 5000; // 5 seconds
    }
    
    // Calculate derived stats based on attributes
    calculateMaxHealth() {
        let base = 20 + (this.constitution * 5) + ((this.level - 1) * 10);
        
        // Add equipment bonuses if any
        let bonus = 0;
        if (this.inventory && typeof this.inventory.getAllEquipped === 'function') {
            const equipped = this.inventory.getAllEquipped();
            for (const item of equipped) {
                if (item.stats && item.stats.maxHealth) {
                    bonus += item.stats.maxHealth;
                }
            }
        }
        return base + bonus;
    }
    
    calculateMaxMana() {
        let base = 20 + (this.intelligence * 3) + ((this.level - 1) * 5);
        
        // Add equipment bonuses if any
        let bonus = 0;
        if (this.inventory && typeof this.inventory.getAllEquipped === 'function') {
            const equipped = this.inventory.getAllEquipped();
            // console.log(`⚡ Character: calculateMaxMana: checking ${equipped.length} equipped items`);
            for (const item of equipped) {
                if (item.stats && item.stats.maxMana) {
                    // console.log(`⚡ Character: calculateMaxMana: ${item.name} provides +${item.stats.maxMana} mana`);
                    bonus += item.stats.maxMana;
                }
            }
        }
        const total = base + bonus;
        // console.log(`⚡ Character: calculateMaxMana: base=${base}, bonus=${bonus}, total=${total}`);
        return total;
    }
    
    calculateAttackPower() {
        return this.strength + Math.floor(this.level / 2);
    }
    
    calculateDefense() {
        return Math.floor(this.constitution / 2) + Math.floor(this.level / 3);
    }
    
    calculateCriticalChance() {
        return 5 + Math.floor(this.dexterity / 5);
    }
    
    // Experience and leveling
    gainExperience(amount) {
        this.experience += amount;
        
        // Check for level up
        if (this.experience >= this.experienceToNextLevel) {
            this.levelUp();
            return true;
        }
        
        return false;
    }
    
    levelUp() {
        this.level++;
        this.experience -= this.experienceToNextLevel;
        this.experienceToNextLevel = this.calculateExperienceForLevel(this.level + 1);
        
        // Grant skill points AND stat points on level up
        this.skillPoints++;
        this.statPoints++;
        
        // Recalculate stats
        this.updateStats();
        
        // Heal on level up
        this.health = this.maxHealth;
        this.mana = this.maxMana;
        
        console.log(`Level up! You are now level ${this.level}`);
    }
    
    calculateExperienceForLevel(level) {
        // Experience curve - gets steeper as levels increase
        return Math.floor(100 * Math.pow(level, 1.5));
    }
    
    // Stat updates
    updateStats() {
        // Recalculate derived stats
        this.maxHealth = this.calculateMaxHealth();
        this.maxMana = this.calculateMaxMana();
        this.attackPower = this.calculateAttackPower();
        this.defense = this.calculateDefense();
        this.criticalChance = this.calculateCriticalChance();
        
        // Apply skill bonuses
        this.applySkillBonuses();
        
        // Clamp current values to new maximums (but don't auto-fill)
        if (this.health > this.maxHealth) {
            this.health = this.maxHealth;
        }
        if (this.mana > this.maxMana) {
            this.mana = this.maxMana;
        }
    }
    
    // Skill system
    spendSkillPoint(skillId) {
        if (this.skillPoints <= 0) {
            console.log("No skill points available");
            return false;
        }
        
        const skill = this.availableSkills.find(s => s.id === skillId);
        
        if (!skill) {
            console.log("Skill not found");
            return false;
        }
        
        if (skill.level >= skill.maxLevel) {
            console.log("Skill already at max level");
            return false;
        }
        
        // Increase skill level and spend point
        skill.level++;
        this.skillPoints--;
        
        // Update stats to apply new skill effects
        this.updateStats();
        
        console.log(`Learned ${skill.name} level ${skill.level}`);
        return true;
    }
    
    applySkillBonuses() {
        // Apply bonuses from skills based on their levels
        for (const skill of this.availableSkills) {
            switch (skill.id) {
                case 'power_strike':
                    // 20% damage increase per level
                    this.attackPower = Math.floor(this.attackPower * (1 + (0.2 * skill.level)));
                    break;
                    
                case 'toughness':
                    // 10% health increase per level
                    this.maxHealth = Math.floor(this.maxHealth * (1 + (0.1 * skill.level)));
                    break;
                    
                case 'quick_reflexes':
                    // 5% dodge chance per level (implemented in combat)
                    // No direct stat modification needed
                    break;
                    
                case 'keen_eye':
                    // 3% critical chance per level
                    this.criticalChance += (3 * skill.level);
                    break;
            }
        }
    }
    
    // Skill getter
    getSkillLevel(skillId) {
        const skill = this.availableSkills.find(s => s.id === skillId);
        return skill ? skill.level : 0;
    }
    
    /**
     * Allocate a stat point to a specific attribute
     * @param {string} stat - 'strength', 'dexterity', 'constitution', or 'intelligence'
     * @returns {boolean} - Success or failure
     */
    allocateStatPoint(stat) {
        if (this.statPoints <= 0) {
            console.log("No stat points available");
            return false;
        }
        
        const validStats = ['strength', 'dexterity', 'constitution', 'intelligence'];
        if (!validStats.includes(stat)) {
            console.log("Invalid stat");
            return false;
        }
        
        // Increase the stat
        this[stat]++;
        this.statPoints--;
        
        // Update derived stats
        this.updateStats();
        
        console.log(`Increased ${stat} to ${this[stat]}`);
        return true;
    }
    
    // Health and damage methods
    heal(amount) {
        console.log(`HEAL METHOD: ${this.name} healing ${amount} HP`);
        console.log(`HEAL METHOD: Before - health: ${this.health}, maxHealth: ${this.maxHealth}`);
        
        const oldHealth = this.health;
        this.health = Math.min(this.health + amount, this.maxHealth);
        
        console.log(`HEAL METHOD: After - health: ${this.health}, maxHealth: ${this.maxHealth}`);
        console.log(`HEAL METHOD: Actually healed: ${this.health - oldHealth} HP`);
    }
    
    takeDamage(amount) {
        // Apply defense reduction -- old
        // const damageReduction = this.defense / (this.defense + 50); // Formula caps at ~50% reduction
        // console.log(`Character: defense: ${this.defense}, damageReduction: ${damageReduction}`);
        // const reducedDamage = Math.max(1, Math.floor(amount * (1 - damageReduction)));     
        // console.log(`Character: takeDamage: amount: ${amount}, reducedDamage: ${reducedDamage}`);


        // Amount = amount of damage

        // Apply defense reduction
        const effectiveDamage = Math.max(1, amount - this.defense);

        // console.log(`${this.name} defense: ${this.defense}, effectiveDamage: ${effectiveDamage}`);
            
        // Show defense message if significant reduction occurred - handled by game UI instead
        // if (amount - effectiveDamage > 5) {
        //     this.ui.addMessage(`${this.name}'s armor absorbed ${amount - effectiveDamage} damage!`, '#aaa');
        // }

        
        const reducedDamage = effectiveDamage;

        // this.health = Math.max(0, this.health - reducedDamage);
        this.health = Math.max(0, this.health - effectiveDamage);


        return {
            damage: reducedDamage,
            blocked: amount - reducedDamage,
            isDead: this.health <= 0
        };
    }
    
    // Status check
    isDead() {
        return this.health <= 0;
    }
    
    // Get character summary
    getSummary() {
        const now = Date.now();
        const shouldLog = now - this.lastDebugLog > this.debugThrottleMs;
        
        // Calculate equipment bonuses
        let equipmentBonuses = {
            strength_bonus: 0,
            dexterity_bonus: 0,
            constitution_bonus: 0,
            intelligence_bonus: 0,
            maxHealth_bonus: 0,
            maxMana_bonus: 0,
            attackPower_bonus: 0,
            defense_bonus: 0,
            criticalChance_bonus: 0
        };
        
        // If this character has equipment, calculate bonuses
        if (this.inventory && typeof this.inventory.getAllEquipped === 'function') {
            const equipped = this.inventory.getAllEquipped();
            
           // if (shouldLog) {
           //     console.log(`Character: getSummary: checking ${equipped.length} equipped items for bonuses`);
           // }
            
            for (const item of equipped) {
                if (item.stats) {
                    // Primary attributes
                    if (item.stats.strength) equipmentBonuses.strength_bonus += item.stats.strength;
                    if (item.stats.dexterity) equipmentBonuses.dexterity_bonus += item.stats.dexterity;
                    if (item.stats.constitution) equipmentBonuses.constitution_bonus += item.stats.constitution;
                    if (item.stats.intelligence) equipmentBonuses.intelligence_bonus += item.stats.intelligence;
                    
                    // Secondary stats
                    if (item.stats.maxHealth) equipmentBonuses.maxHealth_bonus += item.stats.maxHealth;
                    if (item.stats.maxMana) {
                        // if (shouldLog) {
                        //     console.log(`Character: getSummary: ${item.name} provides +${item.stats.maxMana} mana bonus`);
                        // }
                        equipmentBonuses.maxMana_bonus += item.stats.maxMana;
                    }
                    if (item.stats.attackPower) equipmentBonuses.attackPower_bonus += item.stats.attackPower;
                    if (item.stats.defense) equipmentBonuses.defense_bonus += item.stats.defense;
                    if (item.stats.criticalChance) equipmentBonuses.criticalChance_bonus += item.stats.criticalChance;
                }
            }
            
            // if (shouldLog) {
            //     console.log("Character: getSummary: Equipment bonuses calculated:", equipmentBonuses);
            // }
        }
        
        const summary = {
            level: this.level,
            experience: this.experience,
            experienceToNextLevel: this.experienceToNextLevel,
            health: this.health,
            maxHealth: this.calculateMaxHealth(),  // Use calculated value
            mana: this.mana,
            maxMana: this.calculateMaxMana(),      // Use calculated value
            strength: this.strength,
            dexterity: this.dexterity,
            constitution: this.constitution,
            intelligence: this.intelligence,
            attackPower: this.calculateAttackPower(),  // Use calculated value
            defense: this.calculateDefense(),          // Use calculated value
            criticalChance: this.calculateCriticalChance(),  // Use calculated value
            skillPoints: this.skillPoints,
            statPoints: this.statPoints,
            // Add equipment bonuses
            ...equipmentBonuses
        };
        
        // if (shouldLog) {
        //    console.log(`Character: getSummary: Final summary - maxMana: ${summary.maxMana}, maxMana_bonus: ${summary.maxMana_bonus}`);
        //    this.lastDebugLog = now;
        // }
        
        return summary;
    }
}