import { Dungeon } from './modules/dungeon.js';
import { SpriteRenderer } from './modules/sprites.js';
import { Player } from './modules/entity/player.js';
import { UI } from './modules/ui/index.js';
import { InputHandler } from './modules/input.js';
import { ItemManager } from './modules/items/itemManager.js';
import { MonsterDatabase } from './modules/entity/monsterDatabase.js';
import { WorldManager } from './modules/worldManager.js';

// Import new modules
import { GameStateManager } from './modules/gameStateManager.js';
import { CameraManager } from './modules/cameraManager.js';
import { FOVManager } from './modules/fovManager.js';
import { CombatManager } from './modules/combatManager.js';
import { Renderer } from './modules/renderer.js';
import { InputManager } from './modules/inputManager.js';

// Magic system imports
import { ProjectileManager } from './modules/magic/projectileManager.js';
import { StatusEffectManager } from './modules/magic/statusEffectManager.js';
import { TargetingSystem } from './modules/magic/targetingSystem.js';
import { SpellDatabase } from './modules/magic/spellDatabase.js';
import { Version } from './version.js';


// Export a function to start the game
window.startGame = startGame;

function startGame() {
    console.log('Game starting from menu...');
    
    try {
        const game = new RogueGame();
        game.init();
        console.log('Game initialized successfully!');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
}


// Game initialization
// document.addEventListener('DOMContentLoaded', async () => {
//     console.log('Game initializing...');
//     try {
//         const game = new RogueGame();
//         await game.init();
//         console.log('Game initialized successfully!');
//     } catch (error) {
//         console.error('Error initializing game:', error);
//     }
// });

class RogueGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.tileSize = 24; // Reduced tile size for more visible area
        this.gridWidth = 80; // Width for rooms
        this.gridHeight = 40; // Height for rooms
        
        // Store class references for other modules to use
        this.Dungeon = Dungeon;
        
        // Game state
        this.map = [];
        this.monsters = []; // Array to store active monsters
        this.dungeonLevel = 1; // Current dungeon level
        this.dungeonArea = 1; // Current area within the level
        this.worldX = 0;
        this.worldY = 0;
        
        // Initialize managers
        this.stateManager = new GameStateManager(this);
        this.camera = new CameraManager(this);
        this.fov = new FOVManager(this);
        
        // Magic system managers
        this.projectileManager = new ProjectileManager(this);
        this.statusEffectManager = new StatusEffectManager(this);
        this.targetingSystem = new TargetingSystem(this);
        this.spellDatabase = new SpellDatabase();
    }

    async init() {
        // Log version
        Version.logVersion();
        
        // Resize canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Set up key event listeners
        this.setupKeyListeners();
        
        // Initialize core systems
        this.input = new InputHandler();
        this.inputManager = new InputManager(this);
        this.sprites = new SpriteRenderer(this);
        await this.sprites.loadSprites();
        
        // Initialize game components
        this.dungeon = new Dungeon(this.gridWidth, this.gridHeight);
        this.itemManager = new ItemManager(this);
        this.monsterDB = new MonsterDatabase();
        this.worldManager = new WorldManager(this);
        this.combat = new CombatManager(this);
        this.renderer = new Renderer(this);
        
        // Initialize the first section
        this.worldManager.initializeFirstSection();
        
        // Initialize UI
        this.ui = new UI(this);
        this.ui.initialize();
        this.ui.addMessage('Welcome to Modern Rogue!', '#0ff');
        this.ui.addMessage('Use arrow keys to move.', '#aaa');
        this.ui.addMessage('Press H for help screen with controls and info.', '#0f0');
        this.ui.addMessage('Press G to pick up items, P to pick up and equip.', '#aaa');
        this.ui.addMessage('Attack monsters by moving into them.', '#f55');
        
        // Calculate initial field of view
        this.fov.update();
        
        // Start the game loop
        this.lastTime = 0;
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));

        // Add this after setting up all managers in init()
        console.log('Managers initialized:');
        console.log('- StateManager:', !!this.stateManager);
        console.log('- CameraManager:', !!this.camera);
        console.log('- FOVManager:', !!this.fov);
        console.log('- InputManager:', !!this.inputManager);
        console.log('- Renderer:', !!this.renderer);
        console.log('- CombatManager:', !!this.combat);
        console.log('- WorldManager:', !!this.worldManager);
        console.log('- ProjectileManager:', !!this.projectileManager);
        console.log('- StatusEffectManager:', !!this.statusEffectManager);
        console.log('- TargetingSystem:', !!this.targetingSystem);
        console.log('- SpellDatabase:', !!this.spellDatabase);
    }

    setupKeyListeners() {
        document.addEventListener('keydown', (e) => {
            // Most input is now handled through InputManager and UI.update()
            // This listener only handles special debug/cheat keys
            
            // Map reveal toggle (cheat)
            if (e.key === 'm' || e.key === 'M') {
                const revealed = this.stateManager.toggleMapReveal();
                this.ui.addMessage(revealed ? 
                    'Full map revealed (cheat mode).' : 
                    'Map reveal disabled.', 
                    revealed ? '#ff0' : '#aaa');
            }
            
            // Gate debug info (Shift+G) - debug only
            if (e.key === 'G' && e.shiftKey) {
                if (this.worldManager && typeof this.worldManager.showGateDebugInfo === 'function') {
                    this.worldManager.showGateDebugInfo();
                }
            }
        });
    }

    resizeCanvas() {
        // Get the game container to use its dimensions
        const gameContainer = document.getElementById('game-container');
        const containerRect = gameContainer.getBoundingClientRect();
        
        // Adjust the canvas size to fill its container while maintaining aspect ratio
        this.canvas.width = this.camera.viewportWidth * this.tileSize;
        this.canvas.height = this.camera.viewportHeight * this.tileSize;
        
        // Make sure canvas is fully displayed in the game container
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
    }

    transitionToWorldSection(worldX, worldY, fromDirection) {
        this.worldX = worldX;
        this.worldY = worldY;
        
        if (this.worldManager && typeof this.worldManager.transitionToSection === 'function') {
            return this.worldManager.transitionToSection(worldX, worldY, fromDirection);
        }
        
        console.error('No world manager available for transition!');
        return null;
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // Skip updates if game is over
        if (!this.stateManager.isGameOver()) {
            this.update(deltaTime);
        }
        
        this.renderer.render();
        
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }
    
    update(deltaTime) {
        // Always update input (needed for UI hotkeys)
        if (this.input) {
            this.input.update();
        }
        
        // Handle UI input regardless of game state
        if (this.inputManager && typeof this.inputManager.handleUIInput === 'function') {
            this.inputManager.handleUIInput();
        }
        
        // Only process gameplay if in playing state and player exists
        const isPlaying = this.stateManager.isPlaying();
        const hasPlayer = !!this.player;
        
        if (isPlaying && hasPlayer) {
            // Process gameplay input
            if (this.inputManager && typeof this.inputManager.handleInput === 'function') {
                this.inputManager.handleInput();
            } else {
                console.warn('⚠️ InputManager.handleInput not available!');
            }
            
            // Update player
            this.player.update(this, deltaTime);
            
            // Update monsters
            for (let i = 0; i < this.monsters.length; i++) {
                this.monsters[i].update(this, deltaTime);
            }
        }
        
        // Update projectiles (always, even when paused for visual continuity)
        if (this.projectileManager) {
            this.projectileManager.update(deltaTime);
        }
        
        // Process status effects each turn (only when playing)
        if (this.stateManager.isPlaying() && this.statusEffectManager) {
            this.statusEffectManager.processTurn();
            this.statusEffectManager.cleanupDeadEntities();
        }
        
        // Always update UI (needed for menus regardless of game state)
        if (this.ui) {
            this.ui.update();
        }
        
        // Update camera to follow player
        if (this.camera && typeof this.camera.update === 'function') {
            this.camera.update();
        } else {
            this.updateCamera();
        }
        
        // Update FOV
        if (this.fov && typeof this.fov.update === 'function') {
            this.fov.update();
        } else {
            this.updateFOV();
        }
    }

    getMonsterAt(x, y) {
        return this.monsters.find(monster => monster.x === x && monster.y === y);
    }

    // Replace the entire handlePlayerAttack method with this compatibility version
    handlePlayerAttack(targetX, targetY) {
        // Delegate to the combat manager
        if (this.combat && typeof this.combat.handlePlayerAttack === 'function') {
            return this.combat.handlePlayerAttack(targetX, targetY);
        }
        
        // If we get here, something's wrong with our combat manager
        console.warn('Combat manager not available, attack not processed');
        return false;
    }

    updateCamera() {
        if (this.camera && typeof this.camera.update === 'function') {
            this.camera.update();
        }
    }

    handlePlayerInput() {
        if (this.inputManager && typeof this.inputManager.handleInput === 'function') {
            this.inputManager.handleInput();
        }
    }

    handleItemPickup() {
        if (this.inputManager && typeof this.inputManager.handleItemInteraction === 'function') {
            this.inputManager.handleItemInteraction();
        }
    }

    updateFOV() {
        if (this.fov && typeof this.fov.update === 'function') {
            this.fov.update();
        } else {
            console.warn('FOV manager not available, FOV will not be updated');
        }
    }
}