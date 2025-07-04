# Map Reveal Feature Documentation

## Overview

The map reveal feature allows players to toggle between seeing only explored areas and revealing the entire map. This feature is primarily intended for debugging and testing purposes, or as a "cheat mode" for players who want to see the full dungeon layout.

## Implementation Details

The map reveal feature is implemented across several files:

### 1. `src/js/main.js`

- Added a `mapRevealed` flag to the `RogueGame` class constructor to track whether the map is fully revealed.
- Added a key handler for the 'M' key to toggle the map reveal feature.
- Modified the `renderDungeon()` method to show all tiles when `mapRevealed` is true.
- Updated the monster rendering logic to respect the `mapRevealed` flag.
- Modified the item rendering call to pass the `mapRevealed` flag to the `ItemManager`.

```javascript
// In RogueGame constructor
this.mapRevealed = false; // Track if the map is fully revealed

// Key handler in init() method
document.addEventListener('keydown', (e) => {
    // ... existing key handlers ...
    
    // Map reveal toggle
    if (e.key === 'm' || e.key === 'M') {
        console.log('Toggling map reveal');
        this.mapRevealed = !this.mapRevealed;
        this.ui.addMessage(this.mapRevealed ? 
            'Full map revealed (cheat mode).' : 
            'Map reveal disabled.', 
            this.mapRevealed ? '#ff0' : '#aaa');
    }
});

// In renderDungeon() method
// Add mapRevealed check here
const shouldRender = this.mapRevealed || isVisible || isExplored;
if (shouldRender) {
    // When map is revealed, we still want to distinguish between
    // currently visible tiles and just revealed tiles
    const isTrueVisible = isVisible;
    this.sprites.renderTile(viewportX, viewportY, tileType, isTrueVisible, true);
}
```

### 2. `src/js/modules/items/itemManager.js`

- Modified the `render()` method to accept a `mapRevealed` parameter.
- Updated the item visibility check to include the `mapRevealed` flag.

```javascript
render(ctx, mapRevealed = false) {
    // ... existing code ...
    
    const isVisible = game.fov.visible.has(key) || mapRevealed; // Add mapRevealed check
    
    // ... existing code ...
}
```

### 3. `documentation/player_guide.md`

- Added documentation for the map reveal feature in the Game Controls section.

```markdown
- Map Reveal: Press 'M' to toggle between revealing the entire map and showing only explored areas (cheat mode).
```

## How It Works

1. When the player presses the 'M' key, the `mapRevealed` flag is toggled.
2. If `mapRevealed` is `true`, the rendering logic will show all tiles, monsters, and items in the viewport, regardless of whether they have been explored or are currently visible to the player.
3. If `mapRevealed` is `false`, the rendering logic will only show tiles, monsters, and items that are either currently visible to the player or have been explored previously.
4. A message is displayed to the player indicating whether the map reveal feature is enabled or disabled.

## Reverting the Feature

If you want to remove this feature in the future, follow these steps:

1. Remove the `mapRevealed` flag from the `RogueGame` class constructor in `src/js/main.js`.
2. Remove the 'M' key handler from the `init()` method in `src/js/main.js`.
3. Revert the changes to the `renderDungeon()` method in `src/js/main.js` to only show visible or explored tiles.
4. Revert the changes to the monster rendering logic in `src/js/main.js`.
5. Revert the `render()` method in `src/js/modules/items/itemManager.js` to not accept the `mapRevealed` parameter and to only show visible items.
6. Remove the map reveal documentation from the Game Controls section in `documentation/player_guide.md`.

### Code to Remove

Here are the specific code changes to revert:

#### In `src/js/main.js`:

```javascript
// Remove from constructor
this.mapRevealed = false; // Track if the map is fully revealed

// Remove the entire 'M' key handler block
if (e.key === 'm' || e.key === 'M') {
    console.log('Toggling map reveal');
    this.mapRevealed = !this.mapRevealed;
    this.ui.addMessage(this.mapRevealed ? 
        'Full map revealed (cheat mode).' : 
        'Map reveal disabled.', 
        this.mapRevealed ? '#ff0' : '#aaa');
}

// In render() method, change:
this.itemManager.render(this.ctx, this.mapRevealed);
// Back to:
this.itemManager.render(this.ctx);

// In monster rendering, change:
const isVisible = this.fov.visible.has(key) || this.mapRevealed;
// Back to:
const isVisible = this.fov.visible.has(key);

// In renderDungeon() method, change:
const shouldRender = this.mapRevealed || isVisible || isExplored;
if (shouldRender) {
    const isTrueVisible = isVisible;
    this.sprites.renderTile(viewportX, viewportY, tileType, isTrueVisible, true);
}
// Back to:
this.sprites.renderTile(viewportX, viewportY, tileType, isVisible, isExplored);
```

#### In `src/js/modules/items/itemManager.js`:

Revert the `render()` method to its original implementation without the `mapRevealed` parameter.

## Benefits of the Feature

- Helps with debugging and testing the dungeon generation and game mechanics.
- Allows players to see the full dungeon layout, which can be useful for understanding the game's procedural generation.
- Makes it easier to locate world gates, keys, and other important features in the dungeon.
- Provides a "cheat mode" for players who want to explore the game without the challenge of limited visibility.

## Considerations

- This feature is intended for debugging and as an optional "cheat mode" for players.
- It should not be enabled by default in a production release.
- Consider adding a visual indicator when the map reveal feature is enabled, such as a border around the game screen or a persistent icon in the UI. 

## Gate Testing Features

To help with testing and understanding gate generation:

1. **Map Reveal (M key)**: Shows the entire map, including all gates, regardless of exploration.

2. **Gate Debug Info (Shift+G)**: Displays detailed information about all gates in the dungeon, including their locations, directions, and the sections they lead to.

3. **Gate Indicators**: When map reveal is active, visual indicators point to gates that are off-screen, making them easier to locate.

4. **Console Logging**: Detailed gate information is logged to the console when the dungeon is generated, showing exact positions and connections.

These testing features are particularly useful for:
- Verifying that gates are properly generated at the edges of the dungeon
- Understanding how gates connect different sections of the world map
- Testing the transition between different dungeon areas
- Debugging issues with gate placement or visibility 