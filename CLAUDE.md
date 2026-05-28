# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Modern Rogue is a browser-based roguelike built with vanilla JavaScript (ES modules) and HTML5 Canvas. There is no build step or bundler in the runtime path — the browser loads `index.html` directly and pulls ES modules from `src/js/`. Vite is listed in `devDependencies` only as an optional alternative dev server.

## Commands

```bash
npm start            # Serve at http://localhost:8080 via http-server
npm run dev          # Alternative dev server via vite
npx http-server . -p 8080 -c-1 -o   # Dev with caching disabled (recommended when iterating)

npm test             # Run the Vitest unit tests once
npm run test:watch   # Run Vitest in watch mode
npx vitest run test/monsterPathfinding.test.js   # Run a single test file

# Version management (updates package.json AND src/js/version.js together)
npm run bump:patch   # 0.4.0 -> 0.4.1
npm run bump:minor   # 0.4.0 -> 0.5.0
npm run bump:major   # 0.4.0 -> 1.0.0
```

There is no linter and no build step in the runtime path. Vitest covers the **pure logic** that is decoupled from the DOM/canvas (pathfinding, combat math, the monster database, distance/geometry) — tests live in `test/`. Most managers are deeply coupled to `game`, the DOM, and the canvas, so they are not unit-tested; gameplay and UI changes must still be validated by loading the game in a browser.

`src/js/version.js` is the single source of truth for the in-game version string; `package.json` mirrors it. The `bump-version.js` script keeps them in sync — don't edit version numbers by hand in only one place. `CODENAME` and `RELEASE_DATE` in `version.js` must be updated manually after a bump.

## Architecture

### Game entry and lifecycle

`index.html` hosts both a landing-page menu and the game DOM. `src/js/menu.js` handles the menu and calls `window.startGame()` exposed by `src/js/main.js`. The game itself is a single `RogueGame` instance whose `init()` constructs every manager, then enters a `requestAnimationFrame` loop calling `update(deltaTime)` and `renderer.render()`.

`RogueGame` is the central hub — every manager receives `game` in its constructor and reaches back into it (`this.game.player`, `this.game.map`, `this.game.monsters`, etc.). When adding a new system, follow this pattern: take `game` in the constructor, expose the manager as `game.<name>` from `main.js#init`. Don't try to make managers standalone — the cross-references are pervasive.

### Manager layout

Initialization order in `main.js` matters because managers reference each other:

1. **State/camera/FOV** (`gameStateManager.js`, `cameraManager.js`, `fovManager.js`) — constructed early in the `RogueGame` constructor.
2. **Magic system** (`projectileManager`, `statusEffectManager`, `targetingSystem`, `spellDatabase`) — also constructor-time.
3. **Async init** (`init()`) sets up: `InputHandler` + `InputManager`, `SpriteRenderer` (awaits sprite loading), `Dungeon`, `ItemManager`, `MonsterDatabase`, `WorldManager`, `CombatManager`, `Renderer`, then UI.
4. `worldManager.initializeFirstSection()` creates the first dungeon, places the player, populates items/monsters, and wires the player's spellbook to the global `SpellDatabase` (unlocking `magic_dart` as the starter spell).

### Input flow

Two cooperating input layers:
- `input.js` (`InputHandler`) — low-level key state polling.
- `inputManager.js` (`InputManager`) — game-aware input. `update()` calls `inputManager.handleUIInput()` always, and `inputManager.handleInput()` only when `stateManager.isPlaying()` and a player exists.

A small set of debug/cheat keys (M for map reveal, Shift+G for gate debug) is wired directly in `main.js#setupKeyListeners` — everything else goes through `InputManager`.

### World / dungeon model

The world is a grid of sections keyed by `"<worldX>_<worldY>"` (starting at `"0_0"`). `WorldManager` tracks `visitedSections`, `sectionDifficulty`, `sectionStates`, `sectionHistory`, and per-section `explorationMemory` (so FOV "explored" state persists when re-entering a section). `transitionToSection(x, y, fromDirection)` is the entry point for moving between sections; `main.js#transitionToWorldSection` is a thin shim that delegates.

Each section gets a fresh `Dungeon` instance with `worldX`/`worldY`/`worldSectionId` set on it. The `Dungeon` class procedurally lays out rooms, connects them with corridors, and places gates/keys. Combat, item, and monster placement is driven by `CombatManager`, `ItemManager`, and `MonsterDatabase` respectively.

### Monster AI

Monster behavior is data-driven: each entry in `monsterDatabase.js` may set a `behavior` field, and `monster.js#act` dispatches to per-archetype logic. Archetypes are `melee` (default), `skittish` (flees below `fleeHealthThreshold`), `erratic` (darts randomly while engaged), `ranged` (kites to `preferredDistance` and fires projectiles within `attackRange`), and `pack` (rallies aware packmates within `packRallyRange`). To add behavior, add a `case` in `act()` plus tunable fields (default them in the `Monster` constructor and copy them through in `MonsterDatabase.createMonster`). Pursuit uses A* (`findPath`) with a greedy fallback and Chebyshev distance (8-directional movement).

**Gotcha:** `fov.visible` is the *player's* field of view, so it always contains the player's own tile — it cannot tell you whether a monster can see the player. For monster→player sight, trace `fov.hasLineOfSight(mx, my, px, py)` instead (this is what gates detection and the lose-aggro timer in `monster.js`).

Ranged monsters reuse the magic projectile system: they call `projectileManager.createProjectile({ source: this, ... })`. `ProjectileManager` skips monster-vs-monster collisions when `source` is a monster (so enemy shots don't friendly-fire), and uses `type: 'magical'` to avoid the physical-damage double defense reduction (`applyDamage` subtracts defense for `type: 'physical'`, and `Character.takeDamage` subtracts it again).

### Magic system

Spells are data-driven via `spellDatabase.js`. The player owns a `spellbook` that maps slot indices (Q, R, F, V, X) to spell IDs. `ProjectileManager` advances projectiles every frame (even when paused, for visual continuity), `StatusEffectManager.processTurn()` ticks effects on each gameplay turn and cleans up dead entities, and `TargetingSystem` handles targeting overlays. Damage scales with Intelligence and character level — see `documentation/magic_system.md` and `documentation/spell_scaling_implementation.md` if changing scaling formulas.

Castable items (`items/magicItem.js`) reuse this path: `Staff` (equippable mage weapon; casts via the Space "fire" key when equipped or the inventory Use action, spending the player's mana) and `Wand` (charge-based, casts for free until depleted). Both resolve their `spellId` against `spellDatabase` and delegate to `InputManager.castSpellForPlayer(spell)`, the shared entry point that auto-targets the nearest visible monster (offensive) or the player (self/healing) — the same logic the Q/R/F/V/X hotkeys use.

Note: `spellbook_backup.js` exists alongside `spellbook.js` — `spellbook.js` is the active module; `spellbook_backup.js` is legacy and not imported.

### UI

`ui/index.js` exports a `UI` class that composes `GameUI`, `InventoryUI`, `EquipmentDisplay`, `HelpScreen`, and `SpellbookUI`. Use `game.ui.addMessage(text, color)` for the message log. UI components mutate the DOM in `#ui-container` and `#overlay-container`; the canvas (`#game-canvas`) is owned by the `Renderer`.

## Conventions

- ES module imports use relative paths with `.js` extensions (required since there's no bundler resolving extensions).
- Managers consistently defensively check `typeof this.x === 'function'` before delegating (e.g. `main.js#update`). Mirror this pattern when adding manager methods called from `main.js`.
- The codebase logs liberally to `console.log` with emoji prefixes (📖, 🎮, ⚠️). This is intentional for debugging in the browser console.
- Tile coordinates are integer grid positions; pixel rendering is `tileSize=24` px per tile (`main.js`). The viewport size lives on `CameraManager`.

## Documentation

Deep-dives on subsystems live in `documentation/`:
- `dungeon_generation.md` — room/corridor/gate algorithm
- `magic_system.md`, `spell_scaling_implementation.md` — spells and scaling
- `gates.md`, `ranged_combat_design.md`, `map_reveal_feature.md` — feature specs
- `multiplayer_roadmap.md`, `multiplayer_components.md` — future direction (not implemented)
- `developer_log.md`, `roadmap.md` — progress and plans
- `player_guide.md` — gameplay reference
