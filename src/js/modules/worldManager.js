// This is the original worldManager.js file.
// It is used to manage the world and the player's position.
// It is also used to transition to new sections.

import { Dungeon } from './dungeon.js';
import { Player } from './entity/player.js';

export class WorldManager {
    constructor(game) {
        this.game = game;
        
        // World map tracking
        this.currentSectionId = '0_0';
        this.previousSectionId = null; // should be '0_0' ?
        this.visitedSections = new Set(['0_0']);
        this.sectionDifficulty = {'0_0': 1};
        this.sectionStates = {};
        this.sectionHistory = {};
        
        // Track explored tiles for each world section
        this.explorationMemory = {};
        
        // Track all world coordinates that have been used
        this.worldCoordinates = new Set(['0_0']);
        
        // console.log('WorldManager initialized');
    }

    initializeFirstSection() {
        console.log('Initializing first dungeon section...');
        
        // Create the initial dungeon
        this.game.dungeon = new Dungeon(this.game.gridWidth, this.game.gridHeight);
        this.game.dungeon.worldX = 0;
        this.game.dungeon.worldY = 0;
        this.game.dungeon.worldSectionId = '0_0';
        
        // Generate the map
        this.game.map = this.game.dungeon.generate(this.game);
        console.log(`Dungeon generated with ${this.game.dungeon.rooms.length} rooms in section ${this.game.dungeon.worldSectionId}`);
        
        // Place player in a random floor tile
        const startPos = this.game.dungeon.getRandomFloorPosition();
        this.game.player = new Player(startPos.x, startPos.y);
        
        // Connect player's spellbook to game's spell database
        if (this.game.player.spellbook && this.game.spellDatabase) {
            this.game.player.spellbook.setSpellDatabase(this.game.spellDatabase);
            console.log('📖 Connected player spellbook to spell database');
            
            // Unlock Magic Dart as starting spell
            this.game.player.spellbook.unlockSpell('magic_dart', 0); // Q key
            console.log('📖 Unlocked Magic Dart as starting spell');
        }
        
        console.log(`Player placed at (${startPos.x}, ${startPos.y})`);
        
        // Populate the dungeon with items
        console.log(`About to populate dungeon with 6 items...`);
        const itemsPlaced = this.game.itemManager.populateDungeon(6);
        console.log(`Items placed in first section: ${itemsPlaced} (should be 6)`);
        
        // Spawn monsters
        this.spawnMonstersForSection(8, 1);
        
        // Initialize exploration memory for this section
        if (!this.explorationMemory[this.currentSectionId]) {
            this.explorationMemory[this.currentSectionId] = new Set();
        }
        
        // Set the current exploration set to this section's memory
        if (this.game.fov) {
            this.game.fov.explored = this.explorationMemory[this.currentSectionId];
        }
        
        console.log('First section initialized successfully');
    }

    spawnMonstersForSection(count, difficultyLevel) {
        // If we have a combat manager, use it
        if (this.game.combat) {
            this.game.combat.spawnMonsters(count, difficultyLevel);
        } 
        // Otherwise use the game's method directly
        else if (this.game.spawnMonsters) {
            this.game.spawnMonsters(count, difficultyLevel);
        }
        else {
            console.error('No method available to spawn monsters');
        }
    }

    saveCurrentSectionState() {
        // Save the current state
        this.sectionStates[this.currentSectionId] = {
            dungeon: this.game.dungeon,
            map: [...this.game.map], // Make a copy
            monsters: [...this.game.monsters], // Shallow copy, could be improved
            items: [...this.game.itemManager.itemsOnGround] // Shallow copy
        };
        
        console.log(`Saved state for section ${this.currentSectionId}`);
    }

    loadOrGenerateSection(worldX, worldY, fromDirection) {
        const sectionId = `${worldX}_${worldY}`;
        const difficulty = this.sectionDifficulty[sectionId] || 1;

        console.log(`Loading or generating section: ${sectionId}`);
        
        // Save the current section ID before changing
        const previousSectionId = this.currentSectionId;
        
        // Update current section ID
        this.currentSectionId = sectionId;
        
        // Store the previous section for this section
        if (previousSectionId && sectionId !== previousSectionId) {
            this.sectionHistory[sectionId] = previousSectionId;
            console.log(`Setting previous section for ${sectionId} to ${previousSectionId}`);
        }
        
        // Check if we have saved state for this section
        if (this.sectionStates[sectionId]) {
            console.log(`Loading existing section ${sectionId}`);
            
            // Restore the saved state
            const state = this.sectionStates[sectionId];
            this.game.dungeon = state.dungeon;
            this.game.map = state.map;
            this.game.monsters = state.monsters;
            this.game.itemManager.itemsOnGround = state.items;
            
            // Position player based on where they entered from
            this.positionPlayerAtEntrance(fromDirection);
        } else {
            console.log(`Generating new section ${sectionId} (entered from ${fromDirection}, previous: ${previousSectionId})`);
            
            // Create a new dungeon for this section
            this.game.dungeon = new Dungeon(this.game.gridWidth, this.game.gridHeight);
            this.game.dungeon.worldX = worldX;
            this.game.dungeon.worldY = worldY;
            this.game.dungeon.worldSectionId = sectionId;
            
            // Generate the new map with entry information
            this.game.map = this.game.dungeon.generate(this.game, fromDirection, previousSectionId);
            
            // Clear monsters and items
            this.game.monsters = [];
            this.game.itemManager.itemsOnGround = [];
            
            // Spawn monsters with appropriate difficulty
            const monsterCount = 13 // + difficulty * 2; // should the difficulty be 0, 1 or 2? Maybe 0.
            this.spawnMonstersForSection(monsterCount, difficulty);
            
            // Place items
            const itemCount = Math.floor(8 + difficulty * 0.5);
            console.log(`About to populate section ${sectionId} with ${itemCount} items...`);
            const itemsPlaced = this.game.itemManager.populateDungeon(itemCount);
            console.log(`Items placed in section ${sectionId}: ${itemsPlaced} (should be ${itemCount})`);
            
            // Position player based on where they entered from
            this.positionPlayerAtEntrance(fromDirection);
        }
        
        // Initialize exploration memory for this section if it doesn't exist
        if (!this.explorationMemory[sectionId]) {
            this.explorationMemory[sectionId] = new Set();
        }
        
        // Set the current exploration set to this section's memory
        if (this.game.fov) {
            this.game.fov.explored = this.explorationMemory[sectionId];
            
            // Clear visible tiles (will be recalculated in next frame)
            this.game.fov.visible = new Set();
        }
        
        return sectionId;
    }

    positionPlayerAtEntrance(fromDirection) {
        // With the new 4-gate system, find the gate that connects back to the previous section
        // rather than just looking for opposite direction
        
        let entranceGate = null;
        
        // Find the gate that leads back to the previous section
        if (this.previousSectionId) {
            entranceGate = this.game.dungeon.gates.find(gate => 
                gate.nextSectionId === this.previousSectionId
            );
        }
        
        // Fallback: if no specific gate found, look for gate in opposite direction
        if (!entranceGate && fromDirection) {
            let oppositeDirection;
            switch(fromDirection) {
                case 'north': oppositeDirection = 'south'; break;
                case 'east': oppositeDirection = 'west'; break;
                case 'south': oppositeDirection = 'north'; break;
                case 'west': oppositeDirection = 'east'; break;
                default: oppositeDirection = 'south'; break;
            }
            
            entranceGate = this.game.dungeon.gates.find(gate => gate.direction === oppositeDirection);
        }
        
        if (entranceGate) {
            // Place player just inside the gate
            let offsetX = 0, offsetY = 0;
            
            // Determine offset based on gate direction
            switch(entranceGate.direction) {
                case 'north': offsetY = 1; break;
                case 'east': offsetX = -1; break;
                case 'south': offsetY = -1; break;
                case 'west': offsetX = 1; break;
            }
            
            // Set player position
            this.game.player.x = entranceGate.x + offsetX;
            this.game.player.y = entranceGate.y + offsetY;
            
            console.log(`Positioned player at (${this.game.player.x}, ${this.game.player.y}) near ${entranceGate.direction} gate leading to ${entranceGate.nextSectionId}`);
        } else {
            // No matching gate found, use a random floor position
            const pos = this.game.dungeon.getRandomFloorPosition();
            this.game.player.x = pos.x;
            this.game.player.y = pos.y;
            
            console.log(`Positioned player at random location (${this.game.player.x}, ${this.game.player.y}) - no entrance gate found`);
        }
    }

    transitionToSection(worldX, worldY, fromDirection) {
        // Save current section state
        this.saveCurrentSectionState();
        
        // Check if we've been to this section before
        const targetSectionId = `${worldX}_${worldY}`;
        let isNewSection = !this.visitedSections.has(targetSectionId);
        
        // Add to visited sections
        this.visitedSections.add(targetSectionId);
        
        // If it's a new section, we need to calculate its difficulty
        if (isNewSection) {
            // Further from origin = higher difficulty
            const distanceFromOrigin = Math.abs(worldX) + Math.abs(worldY);
            this.sectionDifficulty[targetSectionId] = 1 + Math.floor(distanceFromOrigin / 2);
            console.log(`New section difficulty: ${this.sectionDifficulty[targetSectionId]}`);
        }
        
        // Update the previous section ID
        this.previousSectionId = this.currentSectionId;
        console.log(`Now setting this as previous section: ${this.previousSectionId}`);
        
        // Load or generate the target section
        this.loadOrGenerateSection(worldX, worldY, fromDirection);
        
        console.log(`Current section: ${this.currentSectionId}`);
        console.log(`Previous section: ${this.previousSectionId}`);
        
        // Update FOV if available
        if (this.game.fov && this.game.fov.update) {
            this.game.fov.update();
        } else if (this.game.updateFOV) {
            this.game.updateFOV();
        }
        
        return targetSectionId;
    }

    getCardinalDirection(angle) {
        // Convert radians to degrees and normalize to 0-360
        const degrees = (angle * 180 / Math.PI + 360) % 360;
        
        // Determine cardinal direction based on angle
        if (degrees >= 45 && degrees < 135) {
            return "south";
        } else if (degrees >= 135 && degrees < 225) {
            return "west";
        } else if (degrees >= 225 && degrees < 315) {
            return "north";
        } else {
            return "east";
        }
    }

    showGateDebugInfo() {
        // First show the current and previous section info
        this.game.ui.addMessage(`Current section: ${this.currentSectionId}`, '#aa00aa');
        this.game.ui.addMessage(`Previous section: ${this.previousSectionId}`, '#aaffaa');

        // Then show information about each gate in the current section
        let i = 0;
        this.game.dungeon.gates.forEach(gate => {
            const direction = gate.direction.charAt(0).toUpperCase() + gate.direction.slice(1);
            
            // Find the section that is NOT the current section (that's the destination)
            const currentSectionKey = JSON.stringify(this.currentSectionId);
            this.game.ui.addMessage(` Gate ID ${this.game.dungeon.gates[i].id}`, '#aaff00');
            i++;

            const destinationSection = gate.sections.find(section => 
                JSON.stringify(section) !== currentSectionKey
            );
            
            // Calculate distance from player to gate
            const dx = gate.x - this.game.player.x;
            const dy = gate.y - this.game.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);
            const cardinalDirection = this.getCardinalDirection(angle);
            
            this.game.ui.addMessage(`Distance: ${distance.toFixed(1)} tiles (${cardinalDirection})`, '#88ff88');
        });
    }
} 