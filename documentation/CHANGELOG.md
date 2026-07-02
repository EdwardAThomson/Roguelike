# Changelog

All notable changes to Modern Rogue will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.5.0] - 2026-07-02 "Crypts & Castles"

### Added
- **Dungeon Themes**
  - Three biomes: Cave, Castle, and Crypt, chosen deterministically per world section (`0_0` pinned to Castle)
  - Per-theme wall/floor tilesets and palettes
  - Theme-tagged monster spawn pools (each monster declares a `themes` array; themed pool with level-only fallback)
  - New Level 4 crypt enemy: the Wraith
  
- **Monster AI**
  - A* pathfinding with greedy fallback and Chebyshev (8-directional) distance
  - Aggro / lose-aggro memory driven by line-of-sight
  - Per-type behavior archetypes: melee, skittish, erratic, ranged (kiting projectile attackers), and pack (packmate rallying)
  
- **Castable Items**
  - Staves: equippable mage weapons that cast via the player's mana
  - Wands: charge-based casters that fire for free until depleted
  
- **Movement**
  - Numpad / controller diagonal movement
  
- **Testing**
  - Vitest unit suite for pure logic (pathfinding, combat math, monster database, geometry)
  - Vitest integration harness with a headless fake game assembling real managers
  - Playwright headless smoke test that boots the game and drives real input

### Changed
- **Combat Balance**
  - Defense reworked to percentage-based mitigation (`DEFENSE_K = 30`), applied once in `Character.takeDamage`
  - Difficulty scaling now adjusts monster attackPower, defense, maxHealth, and XP
  - Skittish monsters now panic from taking wounds rather than from line of sight
- Consumable use now shows a "Used X" message before the heal/restore result

### Fixed
- Potions were never actually consumed on use
- Double defense-reduction bug (defense had been subtracted in both the attack path and `takeDamage`)

### Technical
- Playwright config falls back to the Playwright-managed Chromium when the CI browser path is absent

---

## [0.4.0] - 2025-10-17 "Arcane Awakening"

### Added
- **Complete Magic System**
  - Projectile system for spells and ranged attacks
  - 10 pre-defined spells across 3 categories (offensive, healing, utility)
  - Spell database with Magic Missile, Fireball, Lightning Bolt, Ice Shard, Poison Cloud, Heal, Regeneration, Teleport, and Magic Shield
  - Tab-based targeting system with line-of-sight validation
  - FOV-aware target selection with distance sorting
  
- **Status Effect System**
  - Damage over Time (DoT): Burning, Poisoned
  - Healing over Time (HoT): Regenerating
  - Debuffs: Stunned (prevents actions), Slowed (50% speed reduction)
  - Buffs: Shielded (+5 defense)
  - Turn-based tick processing for all effects
  
- **Spell Scaling System**
  - Stat point progression (1 point per level)
  - Allocate points to Strength, Dexterity, Constitution, or Intelligence
  - Level-based spell damage bonus (+5% per level)
  - Build diversity: Wizard, Warrior, and Hybrid builds
  
- **Versioning System**
  - Version module (`src/js/version.js`) as single source of truth
  - Automated version bump script
  - Version display in console and UI
  - Git tagging workflow

### Changed
- **Spell Balance**
  - Ice Shard: Increased base damage from 12 to 15
  - Fireball: Reduced base damage from 15 to 12 (AoE balance)
  - Poison Cloud: Increased base damage from 5 to 8, reduced mana cost from 15 to 12
  - Heal: Increased mana cost from 8 to 12
  - Teleport: Reduced mana cost from 15 to 10
  - All spells calibrated to ~2.5 damage per mana efficiency
  
- **Mana System**
  - Increased base mana from 10 to 20
  - Starting mana pool increased from 40 to 50 (+25%)
  - Better sustainability for 3-5 spell casts

### Technical
- Created 7 new magic system modules
- Added comprehensive documentation (magic_system.md, spell_scaling_implementation.md)
- Updated developer log with full implementation details

---

## [0.3.0] - 2025-07-07 "Steel & Strategy"

### Added
- Equipment progression enhancements
- New intermediate gear tiers
- Improved item variety

### Changed
- **Combat Balance**
  - Implemented minimum damage rule (all attacks deal at least 1 damage)
  - Fixed invulnerability issue with high-defense monsters
  - Adjusted damage formulas for better balance

### Fixed
- High-defense monsters (Minotaur) could be completely invulnerable
- Combat scaling issues at higher levels

---

## [0.2.0] - 2025-06-15 "The Hoarder"

### Added
- Complete inventory system
- Equipment system (weapons, armor, accessories)
- Item database with multiple item types
- Character progression system
- Consumables (potions, scrolls)

### Changed
- Improved UI for inventory management
- Enhanced character screen

---

## [0.1.0] - 2025-05-01 "First Steps"

### Added
- Initial game release
- Basic game loop and rendering
- Player movement and controls
- Procedural dungeon generation
- Field of View (FOV) system
- Basic monster AI
- Turn-based combat
- World management with multiple sections
- Help system and UI

---

## Version Format

Versions follow Semantic Versioning (SemVer): `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes, incompatible API changes
- **MINOR**: New features, backwards-compatible additions
- **PATCH**: Bug fixes, backwards-compatible fixes

### Codenames

Each minor version has a codename reflecting its main theme:
- 0.1.0 - "First Steps" (Initial release)
- 0.2.0 - "The Hoarder" (Inventory system)
- 0.3.0 - "Steel & Strategy" (Combat balance)
- 0.4.0 - "Arcane Awakening" (Magic system)
- 0.5.0 - "Crypts & Castles" (Dungeon themes, monster AI, test suite)

---

## Roadmap

Not sure about the following. Was suggested by AI, but requires more thought.

### [0.6.0] - "Bestiary" (Planned)
- Enhanced monster AI
- Monster special abilities
- Boss encounters
- Monster spellcasting

### [0.7.0] - "The Forge" (Planned)
- Crafting system
- Item enchanting
- Weapon upgrades
- Alchemy

### [0.8.0] - "Legends" (Planned)
- Quest system
- Story elements
- NPCs
- Dialogue system

### [0.9.0] - "Beta" (Planned)
- Polish and refinement
- Balance testing
- Performance optimization
- Bug fixes

### [1.0.0] - "Release" (Planned)
- Full game release
- Complete feature set
- Stable and polished

---

[0.5.0]: https://github.com/yourusername/modern-rogue/releases/tag/v0.5.0
[0.4.0]: https://github.com/yourusername/modern-rogue/releases/tag/v0.4.0
[0.3.0]: https://github.com/yourusername/modern-rogue/releases/tag/v0.3.0
[0.2.0]: https://github.com/yourusername/modern-rogue/releases/tag/v0.2.0
[0.1.0]: https://github.com/yourusername/modern-rogue/releases/tag/v0.1.0
