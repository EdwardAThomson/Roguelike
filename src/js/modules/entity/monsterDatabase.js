import { Monster } from './monster.js';

export class MonsterDatabase {
    constructor() {
        this.monsterTypes = {
            // Level 1 monsters
            rat: {
                name: 'Giant Rat',
                description: 'A large, disease-ridden rodent',
                symbol: 'r',
                color: '#b94',
                baseStats: {
                    level: 1,
                    maxHealth: 24,
                    attackPower: 5,
                    defense: 10,
                    criticalChance: 3
                },
                moveDelay: 250,
                attackDelay: 1200,
                detectionRange: 4,
                xpValue: 10,
                behavior: 'skittish', // a cornered rat runs when wounded
                themes: ['cave', 'castle', 'crypt'] // rats are everywhere
            },

            spider: {
                name: 'Giant Spider',
                description: 'A large, venomous arachnid',
                symbol: 's',
                color: '#52a',
                baseStats: {
                    level: 1,
                    maxHealth: 24,
                    attackPower: 7,
                    defense: 12,
                    criticalChance: 5
                },
                moveDelay: 200,
                attackDelay: 1400,
                detectionRange: 5,
                xpValue: 15,
                behavior: 'ranged', // spits venom from a distance
                attackRange: 5,
                preferredDistance: 3,
                ranged: { damageType: 'poison', symbol: '*', color: '#5f5', verb: 'spits venom' },
                themes: ['cave', 'castle', 'crypt'] // cobwebs everywhere
            },

            bat: {
                name: 'Cave Bat',
                description: 'A quick, aggressive bat with razor-sharp teeth',
                symbol: 'b',
                color: '#654',
                baseStats: {
                    level: 1,
                    maxHealth: 15,
                    attackPower: 8,
                    defense: 11,
                    criticalChance: 12
                },
                moveDelay: 150,
                attackDelay: 900,
                detectionRange: 6,
                xpValue: 18,
                behavior: 'erratic', // darting, unpredictable flight
                erraticChance: 0.5,
                themes: ['cave', 'castle', 'crypt'] // roost anywhere dark
            },

            // Level 2 monsters
            goblin: {
                name: 'Goblin',
                description: 'A small, green humanoid with a mischievous grin',
                symbol: 'g',
                color: '#5d5',
                baseStats: {
                    level: 2,
                    maxHealth: 30,
                    attackPower: 8,
                    defense: 14,
                    criticalChance: 6
                },
                moveDelay: 300,
                attackDelay: 1100,
                detectionRange: 6,
                xpValue: 25,
                behavior: 'skittish', // cowardly — bolts when badly hurt
                dropTables: {
                    // We'll implement drop tables later
                },
                themes: ['cave', 'castle']
            },

            skeleton: {
                name: 'Skeleton',
                description: 'An animated pile of bones',
                symbol: 'S',
                color: '#fff',
                baseStats: {
                    level: 2,
                    maxHealth: 40,
                    attackPower: 10,
                    defense: 13,
                    criticalChance: 8
                },
                moveDelay: 350,
                attackDelay: 1200,
                detectionRange: 7,
                xpValue: 30,
                themes: ['castle', 'crypt'] // classic undead — haunts both
            },

            kobold: {
                name: 'Kobold',
                description: 'A cunning reptilian humanoid with crude weapons',
                symbol: 'k',
                color: '#a85',
                baseStats: {
                    level: 2,
                    maxHealth: 45,
                    attackPower: 9,
                    defense: 12,
                    criticalChance: 7
                },
                moveDelay: 280,
                attackDelay: 1050,
                detectionRange: 5,
                xpValue: 28,
                behavior: 'skittish', // cunning — retreats rather than die
                themes: ['cave'] // den-dwelling reptilians
            },

            wolf: {
                name: 'Wolf',
                description: 'A fierce predator with glowing yellow eyes',
                symbol: 'w',
                color: '#777',
                baseStats: {
                    level: 2,
                    maxHealth: 40,
                    attackPower: 10,
                    defense: 11,
                    criticalChance: 9
                },
                moveDelay: 200,
                attackDelay: 1000,
                detectionRange: 7,
                xpValue: 32,
                behavior: 'pack', // hunts in packs — rallies allies to the player
                packRallyRange: 8,
                themes: ['cave', 'castle']
            },

            // Level 3 monsters
            orc: {
                name: 'Orc Warrior',
                description: 'A brutish humanoid with greenish skin and tusks',
                symbol: 'O',
                color: '#8c5',
                baseStats: {
                    level: 3,
                    maxHealth: 65,
                    attackPower: 12,
                    defense: 16,
                    criticalChance: 7
                },
                moveDelay: 400,
                attackDelay: 1300,
                detectionRange: 6,
                xpValue: 45,
                themes: ['cave', 'castle']
            },

            ghost: {
                name: 'Specter',
                description: 'A translucent, floating apparition',
                symbol: 'G',
                color: '#adf',
                baseStats: {
                    level: 3,
                    maxHealth: 60,
                    attackPower: 15,
                    defense: 15,
                    criticalChance: 12
                },
                moveDelay: 320,
                attackDelay: 1200,
                detectionRange: 8,
                xpValue: 50,
                behavior: 'erratic', // drifts unpredictably as it closes in
                erraticChance: 0.35,
                themes: ['castle', 'crypt']
            },

            centaur: {
                name: 'Centaur',
                description: 'A proud half-human, half-horse warrior',
                symbol: 'C',
                color: '#d83',
                baseStats: {
                    level: 3,
                    maxHealth: 65,
                    attackPower: 14,
                    defense: 17,
                    criticalChance: 8
                },
                moveDelay: 280,
                attackDelay: 1300,
                detectionRange: 6,
                xpValue: 55,
                behavior: 'ranged', // mounted archer — looses arrows and keeps its distance
                attackRange: 6,
                preferredDistance: 4,
                ranged: { damageType: 'physical', symbol: '»', color: '#fd0', verb: 'looses an arrow' },
                themes: ['castle'] // grounds and courtyards
            },

            minotaur: {
                name: 'Minotaur',
                description: 'A massive bull-headed humanoid with tremendous strength',
                symbol: 'M',
                color: '#c63',
                baseStats: {
                    level: 4,
                    maxHealth: 85,
                    attackPower: 16,
                    defense: 18,
                    criticalChance: 6
                },
                moveDelay: 450,
                attackDelay: 1400,
                detectionRange: 5,
                xpValue: 75,
                themes: ['cave', 'castle']
            },

            // Level 4 — crypt boss-tier
            wraith: {
                name: 'Wraith',
                description: 'A shrouded undead that flings shards of shadow at the living',
                symbol: 'W',
                color: '#96b',
                baseStats: {
                    level: 4,
                    maxHealth: 75,
                    attackPower: 15,
                    defense: 16,
                    criticalChance: 12
                },
                moveDelay: 320,
                attackDelay: 1200,
                detectionRange: 8,
                xpValue: 80,
                behavior: 'ranged', // hangs back and hurls shadow bolts
                attackRange: 6,
                preferredDistance: 4,
                ranged: { damageType: 'arcane', symbol: '•', color: '#96b', verb: 'flings a shadow bolt' },
                themes: ['crypt']
            }
        };
    }
    
    createMonster(type, x, y) {
        const monster = new Monster(x, y, type);
        
        if (!this.monsterTypes[type]) {
            console.error(`Monster type ${type} not found in database`);
            return monster; // Return default monster
        }
        
        const template = this.monsterTypes[type];
        
        // Apply template properties
        monster.name = template.name;
        monster.symbol = template.symbol;
        monster.color = template.color;
        monster.description = template.description;
        
        // Apply stats
        if (template.baseStats) {
            if (template.baseStats.level) monster.level = template.baseStats.level;
            if (template.baseStats.maxHealth) {
                monster.maxHealth = template.baseStats.maxHealth;
                monster.health = monster.maxHealth;
            }
            if (template.baseStats.attackPower) monster.attackPower = template.baseStats.attackPower;
            if (template.baseStats.defense) monster.defense = template.baseStats.defense;
            if (template.baseStats.criticalChance) monster.criticalChance = template.baseStats.criticalChance;
        }
        
        // Apply behavior properties
        if (template.moveDelay) monster.moveDelay = template.moveDelay;
        if (template.attackDelay) monster.attackDelay = template.attackDelay;
        if (template.detectionRange) monster.detectionRange = template.detectionRange;
        if (template.xpValue) monster.xpValue = template.xpValue;

        // Apply AI archetype + tuning
        if (template.behavior) monster.behavior = template.behavior;
        if (template.fleeHealthThreshold != null) monster.fleeHealthThreshold = template.fleeHealthThreshold;
        if (template.erraticChance != null) monster.erraticChance = template.erraticChance;
        if (template.attackRange != null) monster.attackRange = template.attackRange;
        if (template.preferredDistance != null) monster.preferredDistance = template.preferredDistance;
        if (template.packRallyRange != null) monster.packRallyRange = template.packRallyRange;
        if (template.ranged) {
            if (template.ranged.damageType) monster.rangedDamageType = template.ranged.damageType;
            if (template.ranged.symbol) monster.rangedProjectileSymbol = template.ranged.symbol;
            if (template.ranged.color) monster.rangedProjectileColor = template.ranged.color;
            if (template.ranged.verb) monster.rangedVerb = template.ranged.verb;
        }

        return monster;
    }
    
    getRandomMonsterType(dungeonLevel = 1, theme = null) {
        // Prefer monsters matching both the level cap AND the section theme.
        // Themed pools are intentionally narrow so they carry flavor; if a
        // theme has no monster at the requested level, we quietly fall back to
        // the level-only pool so sections never spawn empty.
        const byLevel = Object.keys(this.monsterTypes).filter(type =>
            this.monsterTypes[type].baseStats.level <= dungeonLevel
        );

        let available = byLevel;
        if (theme) {
            const themed = byLevel.filter(type => {
                const themes = this.monsterTypes[type].themes;
                return Array.isArray(themes) && themes.includes(theme);
            });
            if (themed.length > 0) available = themed;
        }

        // Final fallback: any monster in the database.
        if (available.length === 0) available = Object.keys(this.monsterTypes);

        const randomIndex = Math.floor(Math.random() * available.length);
        return available[randomIndex];
    }

    createRandomMonster(x, y, dungeonLevel = 1, theme = null) {
        const type = this.getRandomMonsterType(dungeonLevel, theme);
        return this.createMonster(type, x, y);
    }
}