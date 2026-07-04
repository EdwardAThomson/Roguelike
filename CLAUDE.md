# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Modern Rogue is a browser-based roguelike built with vanilla JavaScript (ES modules) and HTML5 Canvas. There is no build step or bundler in the runtime path — the browser loads `index.html` directly and pulls ES modules from `src/js/`. Vite is listed in `devDependencies` only as an optional alternative dev server.

## Commands

```bash
npm start            # Serve at http://localhost:8080 via http-server
npm run dev          # Alternative dev server via vite
npx http-server . -p 8080 -c-1 -o   # Dev with caching disabled (recommended when iterating)

npm test             # Run the Vitest unit + integration tests once
npm run test:watch   # Run Vitest in watch mode
npx vitest run test/monsterPathfinding.test.js   # Run a single test file
npm run test:e2e     # Run the Playwright smoke test (auto-starts http-server on :8080)

# Version management (updates package.json AND src/js/version.js together)
npm run bump:patch   # 0.4.0 -> 0.4.1
npm run bump:minor   # 0.4.0 -> 0.5.0
npm run bump:major   # 0.4.0 -> 1.0.0
```

There is no linter and no build step in the runtime path. Tests split into three tiers:

- **Unit tests** (`test/*.test.js`) cover pure logic decoupled from the DOM/canvas (pathfinding, combat math, monster database, magic items, etc.).
- **Integration tests** (`test/integration/*.test.js`) use `test/helpers/fakeGame.js` — a headless harness that assembles real managers (Dungeon, MonsterDatabase, ItemManager, WorldManager, CombatManager, FOV, projectile/status/spell systems, InputManager, Player) with only DOM-shaped pieces stubbed. `bootFakeGame()` also runs `worldManager.initializeFirstSection()` for scenarios that need a live section. Cross-manager wire-up bugs show up here.
- **E2E** (`test/e2e/*.spec.js`, Playwright) loads `index.html` in headless Chromium and drives real keystrokes: `smoke.spec.js` (boot + input), `saveload.spec.js` (Ctrl+S, reload, Continue with real IndexedDB), `gameModal.spec.js` (tabbed modal, pause, capture-mode binding; fails on any native dialog). All boot via Quick Play, then pick a card in the mode chooser. Convention: `.test.js` = Vitest, `.spec.js` = Playwright — `vitest.config.js` restricts include to `.test.js` so the suites don't collide.

Persistence is unit-tested in node via the storage-adapter seam: serializer/hydrator are pure functions exercised on the fake game, and `InMemorySaveStore` stands in for IndexedDB (which does not exist in the node test env; real IndexedDB round-trips live in the e2e tier only).

Rendering, input listeners, sprite loading, and CSS still need a real browser; UI changes must be eyeballed manually.

`src/js/version.js` is the single source of truth for the in-game version string; `package.json` mirrors it. The `bump-version.js` script keeps them in sync — don't edit version numbers by hand in only one place. `CODENAME` and `RELEASE_DATE` in `version.js` must be updated manually after a bump.

## Architecture

### Game entry and lifecycle

`index.html` hosts both a landing-page menu and the game DOM. `src/js/menu.js` handles the menu (Quick Play opens a run-mode chooser: Adventure vs Hardcore; Multiplayer/Options/Credits open an in-menu modal, never `alert()`) and calls `window.startGame(options)` exposed by `src/js/main.js`. Options: `{continue: true}` resumes the saved run, `{hardcore: bool}` sets the mode for a new run. The game itself is a single `RogueGame` instance whose `init(options)` constructs every manager, then either restores the save or initializes a fresh first section, then enters a `requestAnimationFrame` loop calling `update(deltaTime)` and `renderer.render()`.

`RogueGame` is the central hub — every manager receives `game` in its constructor and reaches back into it (`this.game.player`, `this.game.map`, `this.game.monsters`, etc.). When adding a new system, follow this pattern: take `game` in the constructor, expose the manager as `game.<name>` from `main.js#init`. Don't try to make managers standalone — the cross-references are pervasive.

### Manager layout

Initialization order in `main.js` matters because managers reference each other:

1. **State/camera/FOV** (`gameStateManager.js`, `cameraManager.js`, `fovManager.js`) — constructed early in the `RogueGame` constructor.
2. **Magic system** (`projectileManager`, `statusEffectManager`, `targetingSystem`, `spellDatabase`) — also constructor-time.
3. **Async init** (`init()`) sets up: `InputHandler` + `InputManager`, `SpriteRenderer` (awaits sprite loading), `Dungeon`, `ItemManager`, `MonsterDatabase`, `WorldManager`, `CombatManager`, `Renderer`, then `SaveManager`, then the world (restore or fresh), then UI.
4. On a fresh run, `worldManager.initializeFirstSection()` creates the first dungeon, places the player, populates items/monsters, and wires the player's spellbook to the global `SpellDatabase` (unlocking `magic_dart` as the starter spell). On `{continue: true}`, `restoreGame` in `persistence/hydrator.js` rebuilds all of that from the save instead; it must reproduce the same wiring, especially `spellbook.setSpellDatabase(...)`.

### Input flow

Two cooperating input layers:
- `input.js` (`InputHandler`) — low-level key state polling.
- `inputManager.js` (`InputManager`) — game-aware input. `update()` calls `inputManager.handleUIInput()` always (so I/C/B/H work while paused), and `inputManager.handleInput()` only when `stateManager.isPlaying()` and a player exists.

`handleUIInput` routes I/C/B to `gameModal.toggleTab(...)` and H to the help overlay (mutually exclusive with the modal). A small set of keys is wired directly in `main.js#setupKeyListeners`: M (map reveal cheat), Shift+G (gate debug), and Ctrl+S / Cmd+S (manual save). While the game modal is open, its own document keydown listener (attached on open, detached on close) handles Escape, spellbook capture keys, and the inventory tab's item-action keys.

### World / dungeon model

The world is a grid of sections keyed by `"<worldX>_<worldY>"` (starting at `"0_0"`). `WorldManager` tracks `visitedSections`, `sectionDifficulty`, `sectionStates`, `sectionHistory`, and per-section `explorationMemory` (so FOV "explored" state persists when re-entering a section). `transitionToSection(x, y, fromDirection)` is the entry point for moving between sections; `main.js#transitionToWorldSection` is a thin shim that delegates.

Each section gets a fresh `Dungeon` instance with `worldX`/`worldY`/`worldSectionId` set on it. The `Dungeon` class procedurally lays out rooms, connects them with corridors, and places gates/keys. Combat, item, and monster placement is driven by `CombatManager`, `ItemManager`, and `MonsterDatabase` respectively.

Each section also carries a `theme` (`'cave' | 'castle' | 'crypt'`), picked deterministically per `(worldX, worldY)` by `worldManager.pickThemeForSection`; `'0_0'` is pinned to `castle`. The theme drives: (a) which wall/floor sprite variant `sprites.js` uses (`sprites.wall[theme]` / `sprites.floor[theme]`), and (b) which monsters can spawn — each entry in `monsterDatabase.js` declares `themes: []`, and `getRandomMonsterType(difficulty, theme)` prefers themed matches then falls back to the level-only pool if the themed pool is empty at that difficulty. When adding new monsters, include a `themes` array or the monster will only appear via the fallback.

### Monster AI

Monster behavior is data-driven: each entry in `monsterDatabase.js` may set a `behavior` field, and `monster.js#act` dispatches to per-archetype logic. Archetypes are `melee` (default), `skittish` (flees below `fleeHealthThreshold`), `erratic` (darts randomly while engaged), `ranged` (kites to `preferredDistance` and fires projectiles within `attackRange`), and `pack` (rallies aware packmates within `packRallyRange`). To add behavior, add a `case` in `act()` plus tunable fields (default them in the `Monster` constructor and copy them through in `MonsterDatabase.createMonster`). Pursuit uses A* (`findPath`) with a greedy fallback and Chebyshev distance (8-directional movement).

**Gotcha:** `fov.visible` is the *player's* field of view, so it always contains the player's own tile — it cannot tell you whether a monster can see the player. For monster→player sight, trace `fov.hasLineOfSight(mx, my, px, py)` instead (this is what gates detection and the lose-aggro timer in `monster.js`).

Ranged monsters reuse the magic projectile system: they call `projectileManager.createProjectile({ source: this, ... })`. `ProjectileManager` skips monster-vs-monster collisions when `source` is a monster (so enemy shots don't friendly-fire).

### Combat math

Defense is applied **once**, in `Character.takeDamage`, as percentage mitigation: `effective = max(1, round(amount * (1 - defense/(defense + DEFENSE_K))))` with `DEFENSE_K = 30` (exported from `character.js`). Every damage source feeds raw (pre-defense) damage into `takeDamage` — `combatManager.handleMeleeAttack` and `projectileManager.applyDamage` must **not** subtract defense themselves (doing so reintroduces a double-reduction bug that was fixed). `takeDamage` reads `this.defense` directly: monsters store a flat template defense from `monsterDatabase.js`, while the player keeps `this.defense` in sync with gear via `updateStats()`. Note `Character.calculateDefense()` recomputes from attributes and ignores the monster template, so it must not be used in the damage path for monsters. Difficulty scaling lives in `combatManager.applyDifficultyScaling(monster, level)`, which scales `attackPower`, `defense`, `maxHealth`, and `xpValue` (not `strength`, which monsters never read for damage).

### Magic system

Spells are data-driven via `spellDatabase.js`. The player owns a `spellbook` that maps slot indices (Q, R, F, V, X) to spell IDs. `ProjectileManager` advances projectiles every frame (even when paused, for visual continuity), `StatusEffectManager.processTurn()` ticks effects on each gameplay turn and cleans up dead entities, and `TargetingSystem` handles targeting overlays. Damage scales with Intelligence and character level — see `documentation/magic_system.md` and `documentation/spell_scaling_implementation.md` if changing scaling formulas.

Castable items (`items/magicItem.js`) reuse this path: `Staff` (equippable mage weapon; casts via the Space "fire" key when equipped or the inventory Use action, spending the player's mana) and `Wand` (charge-based, casts for free until depleted). Both resolve their `spellId` against `spellDatabase` and delegate to `InputManager.castSpellForPlayer(spell)`, the shared entry point that auto-targets the nearest visible monster (offensive) or the player (self/healing) — the same logic the Q/R/F/V/X hotkeys use.

Note: `spellbook_backup.js` exists alongside `spellbook.js` — `spellbook.js` is the active module; `spellbook_backup.js` is legacy and not imported.

### Persistence (save/load)

`src/js/modules/persistence/` owns saving. `saveSchema.js` defines the versioned envelope (`FORMAT_VERSION`, meta summary for the menu, compact one-char-per-tile row encoding). `serializer.js` is a pure game-to-JSON conversion; `hydrator.js` (`restoreGame`) rebuilds live managers from it. Storage sits behind the `SaveStore` adapter (`saveStore.js`): `IndexedDBSaveStore` in the browser, `InMemorySaveStore` in tests, `CloudSaveStore` for the Octonion gateway. `SaveManager` owns every policy: manual save (Ctrl+S), autosave (one-line hook at the end of `worldManager.transitionToSection`), death handling (one-line hook in `gameStateManager.handlePlayerDeath`), and cloud mirroring.

Things that will bite you if you change them casually:

- **Equipment double-apply hazard.** `Equipment.applyStats` mutates player attributes on equip, and `Inventory.clear()` does not reverse them. The serializer therefore stores BASE attributes (current minus equipped bonuses) and the hydrator restores in a strict order: new Player, `inventory.clear()`, overwrite base attributes, re-equip via the equip path, `updateStats()`, clamp health/mana. The round-trip test asserts exact attribute/derived-stat equality and idempotence; keep it green.
- **The live current section is NOT in `worldManager.sectionStates`** until the player leaves it, so `serializeGame` flushes `game.dungeon/monsters/itemsOnGround` into the section map at save time.
- **No seeded RNG exists**, so dungeons cannot be regenerated from seeds; tiles and all placed structures are stored verbatim.
- **Monsters persist their difficulty-scaled stats and name** (the `Elite ` prefix drives loot behavior); rebuilding from the database template alone silently de-elites them. Gate keys are customized clones whose `gateId`/name/color are not in the `gate_key` template; they persist their custom fields.
- **Run mode is immutable per run**: `game.hardcore` is set once at run start (mode chooser) or restored from the save; hardcore death deletes the save (locally and in the cloud), adventure death keeps it. The policy lives only in `SaveManager.onPlayerDeath`.

Cloud saves are dormant until `src/js/config.js` is filled in (hub URL, Supabase URL/anon key, gateway URL); with an empty config the game is fully offline and account UI stays hidden. `authClient.js` implements the Octonion hub SSO flow (one-time-token exchange, lazy supabase-js import); `cloudSaveStore.js` speaks the RPG-Loom gateway contract (`/api/saves/:slot`, generation-based optimistic concurrency, 503 degradation). Sync is local-first: IndexedDB is the source of truth, cloud pushes ride behind local saves, and the menu pulls a newer cloud save into IndexedDB before offering Continue. The server side (gateway + `newroguelike` schema) lives in the sibling octonion repos and is not built yet.

### UI

`ui/index.js` exports a `UI` class that composes `GameUI` (HUD + character tab), `InventoryUI`, `EquipmentDisplay` (persistent HUD sidebar), `HelpScreen`, `SpellbookUI`, and `GameModal`. Use `game.ui.addMessage(text, color)` for the message log. UI components mutate the DOM in `#ui-container` and `#overlay-container`; the canvas (`#game-canvas`) is owned by the `Renderer`.

**The game modal** (`ui/gameModal.js`) is the single tabbed screen hosting Character / Inventory / Spellbook. Its frame size is fixed (`.game-modal` in `src/css/style.css`, `min(92vw,1000px)` by `min(85vh,680px)`) so switching tabs never resizes; panels scroll internally. The three screens are content providers implementing `mountPanel(el)` / `onShow(options)` / `onHide()` / optional `handleKey(e)`; they render into persistent panels and own no modal chrome. When adding a tab, implement that interface and register it in the `UI` constructor.

**Pause is real and lives in `GameStateManager`**: opening the modal or help calls `stateManager.openMenu()` (state `'menu'`), which halts gameplay input, player/monster updates, and status ticks via the existing `isPlaying()` gates; `closeMenu()` only restores `'playing'` from `'menu'`, so `gameOver` is sticky. Never reintroduce the old `game.gameState` ad-hoc property; it was dead state that made modals silently fail to pause.

**Spell hotkey binding** is a capture flow in the spellbook tab: `startCapture(spellId)` shows the reserved-space hint strip and pulses the slots; the modal's keydown handler maps Q/R/F/V/X (order read from `spellbook.slotKeys`, do not hardcode a third copy) to `completeCapture(slotIndex)`; Escape is two-stage (cancel capture, then close). Native `prompt()`/`confirm()`/`alert()` are banned in game and menu UI; the e2e specs fail on any dialog.

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
- `roadmap.md`, `CHANGELOG.md` — plans and per-release history
- `player_guide.md` — gameplay reference

The canonical development log is `DEVLOG.md` at the repo root (narrative, per-date notes, newest first); `documentation/CHANGELOG.md` holds curated per-release notes.
