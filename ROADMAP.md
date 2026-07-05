# Roadmap — Modern Rogue

_Status: active · v0.5.0 "Crypts & Castles" shipped 2026-07-02_

A browser roguelike in vanilla JS + HTML5 Canvas — procedural dungeons,
turn-based tactical combat, magic, and character progression. See
[`documentation/roadmap.md`](documentation/roadmap.md) for the detailed plan.

## Shipped

- [x] Magic system — 10 spells with Intelligence-based scaling
- [x] Status effects (burning, poison, stun, slow, shield)
- [x] Projectile system (Bresenham line, collision, AoE explosions)
- [x] Ranged combat (bows, crossbows, throwing weapons)
- [x] Turn-based tactical combat (melee + ranged)
- [x] Monster AI — A* pathfinding, per-type archetypes, ranged attackers
- [x] Monster behavior refinement — skittish panic triggered by wounds, aggro / lose-aggro on line-of-sight loss
- [x] Combat balance — percentage-based defense mitigation, difficulty-scaled attackPower / defense / HP / XP
- [x] Dungeon themes — Cave / Castle / Crypt with per-theme tilesets, palettes, and soft-tagged monster spawn pools; new L4 crypt Wraith
- [x] Character progression (level-up, stat allocation, wizard/warrior/hybrid builds)
- [x] Procedural dungeon generation (multi-section, gates/keys, difficulty scaling)
- [x] Inventory & equipment with loot drops
- [x] Consumables (health/mana potions, scrolls)
- [x] Castable items — staves (mana) and wands (charges)
- [x] Field of view & fog of war with per-section memory
- [x] Multi-section world with persistent state
- [x] UI — inventory, character sheet, spellbook (unified tabbed modal that pauses the game), help, message log
- [x] Numpad / controller diagonal movement
- [x] Test suite — Vitest unit + integration harness (fake headless game) + Playwright e2e specs (smoke, save/load, game modal)
- [x] Save / load game state — IndexedDB local saves (manual Ctrl+S + autosave on section transitions), menu Continue, Adventure/Hardcore run modes; cloud sync scaffolded (dormant until configured)
- [x] Player guide + design docs

## Next

- [ ] Dungeon layout variety — theme-specific generation (cave chambers vs castle grids vs crypt corridors), traps, puzzles
- [ ] Enhanced UI & accessibility (keybindings, color-blind mode, text size)

## Backlog

- [ ] Multiplayer mode
- [ ] Quest system & NPC interactions
- [ ] Sound & music
- [ ] Localization / language support
- [ ] Performance optimization (lazy loading, caching, code splitting)
