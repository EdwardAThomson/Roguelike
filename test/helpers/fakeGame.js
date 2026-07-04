// Headless test harness that assembles a real RogueGame worth of managers
// without touching the DOM. All the managers used by combat/spawning/world
// transitions have pure constructors (no canvas, no document), so we can wire
// them together with a small game object and drive gameplay code directly.
//
// What's REAL: Dungeon, MonsterDatabase, ItemManager (+ ItemDatabase),
// CombatManager, WorldManager, FOVManager, GameStateManager, CameraManager,
// ProjectileManager, StatusEffectManager, SpellDatabase, InputManager, Player.
//
// What's STUBBED: game.ui (captures messages instead of rendering), game.input
// (all keys "up"), game.canvas / game.ctx / game.renderer / game.sprites
// (nothing calls them from the paths we exercise).

import { GameStateManager } from '../../src/js/modules/gameStateManager.js';
import { CameraManager } from '../../src/js/modules/cameraManager.js';
import { FOVManager } from '../../src/js/modules/fovManager.js';
import { ProjectileManager } from '../../src/js/modules/magic/projectileManager.js';
import { StatusEffectManager } from '../../src/js/modules/magic/statusEffectManager.js';
import { SpellDatabase } from '../../src/js/modules/magic/spellDatabase.js';
import { ItemManager } from '../../src/js/modules/items/itemManager.js';
import { MonsterDatabase } from '../../src/js/modules/entity/monsterDatabase.js';
import { WorldManager } from '../../src/js/modules/worldManager.js';
import { CombatManager } from '../../src/js/modules/combatManager.js';
import { InputManager } from '../../src/js/modules/inputManager.js';

/**
 * Assemble a game object with real managers wired up, but the game
 * NOT yet booted (no map / player / monsters). Use bootFakeGame() if you
 * want a section already generated.
 */
export function makeFakeGame(options = {}) {
    const game = {
        tileSize: 24,
        gridWidth: options.gridWidth ?? 80,
        gridHeight: options.gridHeight ?? 40,
        worldX: 0,
        worldY: 0,
        map: [],
        monsters: [],
        dungeonLevel: 1,
        dungeonArea: 1,
        mapRevealed: false,
        hardcore: options.hardcore ?? true, // run mode, immutable per run

        // Message log stub — captures instead of rendering.
        ui: {
            messages: [],
            addMessage(text, color) { this.messages.push({ text, color }); }
        },
        // Input stub — every key reports as "not pressed".
        input: { isKeyDown: () => false, isKeyPressed: () => false },
        canvas: null,
        ctx: null,
        renderer: null,
        sprites: null
    };

    game.stateManager = new GameStateManager(game);
    game.camera = new CameraManager(game);
    game.fov = new FOVManager(game);
    game.projectileManager = new ProjectileManager(game);
    game.statusEffectManager = new StatusEffectManager(game);
    game.spellDatabase = new SpellDatabase();
    game.itemManager = new ItemManager(game);
    game.monsterDB = new MonsterDatabase();
    game.worldManager = new WorldManager(game);
    game.combat = new CombatManager(game);
    game.inputManager = new InputManager(game);

    return game;
}

/**
 * Same as makeFakeGame(), but also boots the first section (dungeon,
 * player, items, monsters, FOV). Mirrors what main.js#init() does after
 * constructing managers.
 */
export function bootFakeGame(options = {}) {
    const game = makeFakeGame(options);
    game.worldManager.initializeFirstSection();
    // Wire the player's spellbook to the spell database, same as main.js.
    if (game.player && game.player.spellbook) {
        game.player.spellbook.setSpellDatabase(game.spellDatabase);
    }
    game.fov.update();
    return game;
}
