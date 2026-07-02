# Development Log

## 2026-07-01

Added themed dungeons so sections no longer all look and play the same. Each world section now carries a `theme` (`cave`, `castle`, or `crypt`) chosen deterministically per `(worldX, worldY)`, with the starting section `0_0` pinned to `castle`. The theme drives two things: which wall/floor sprite variants `sprites.js` renders, and which monsters are eligible to spawn. Monster entries in `monsterDatabase.js` gained a `themes` array, and `getRandomMonsterType` now prefers themed matches at the given difficulty, falling back to the level-only pool when the themed pool is empty. Sprite work was the bulk of the diff, expanding `sprites.js` substantially to cover the three visual sets. A new `test/dungeonTheme.test.js` locks in the theme-selection and spawn-pool behavior. The roadmap was also updated to check off combat balance and monster-behavior refinement as done.

**Decisions & notes:** Theme picking is deterministic per coordinate (via `worldManager.pickThemeForSection`) so a section always regenerates with the same look. Monsters without a `themes` array only appear through the fallback pool, so new monsters should declare their themes. The combatManager touch-ups in the same commit keep raw damage flowing into `takeDamage` (defense stays applied once) rather than reintroducing double-reduction.
