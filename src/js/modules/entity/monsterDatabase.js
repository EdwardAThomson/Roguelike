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
                xpValue: 10
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
                attackDelay: 1000,
                detectionRange: 5,
                xpValue: 15
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
                xpValue: 18
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
                dropTables: {
                    // We'll implement drop tables later
                }
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
                xpValue: 30
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
                xpValue: 28
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
                xpValue: 32
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
                xpValue: 45
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
                xpValue: 50
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
                attackDelay: 1100,
                detectionRange: 6,
                xpValue: 55
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
                xpValue: 75
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
        
        return monster;
    }
    
    getRandomMonsterType(dungeonLevel = 1) {
        // Filter monster types by level
        let availableTypes = Object.keys(this.monsterTypes).filter(type => {
            const monster = this.monsterTypes[type];
            return monster.baseStats.level <= dungeonLevel;
        });
        
        // If no monsters match, fall back to all monster types
        if (availableTypes.length === 0) {
            availableTypes = Object.keys(this.monsterTypes);
        }
        
        // Select random type
        const randomIndex = Math.floor(Math.random() * availableTypes.length);
        return availableTypes[randomIndex];
    }
    
    createRandomMonster(x, y, dungeonLevel = 1) {
        const type = this.getRandomMonsterType(dungeonLevel);
        return this.createMonster(type, x, y);
    }
}