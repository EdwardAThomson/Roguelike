# Modern Rogue - JavaScript Roguelike Game

## File Structure and Functionality

### Main Files

- `src/js/main.js`: The main entry point of the game. Initializes the game, sets up event listeners, and starts the game loop. Contains the core `RogueGame` class which manages the overall game state and flow.

### Game Logic and Rendering

- `src/js/modules/dungeon.js`: **Defines the `Dungeon` class** responsible for generating and managing the game's dungeon levels, including room placement, path connection, and dungeon features.

- `src/js/modules/sprites.js`: **Implements the `SpriteRenderer` class** which handles loading and rendering of game sprites, such as tiles, player, and monsters.

- `src/js/modules/entity/player.js`: **Contains the `Player` class** representing the player character. Manages player movement, inventory, equipment, and interactions with the game world.

- `src/js/modules/input.js`: **Defines the `InputHandler` class** which handles player input, such as keyboard events, and translates them into game actions.

- `src/js/modules/items/itemManager.js`: **Implements the `ItemManager` class** responsible for managing game items, including item generation, placement, pickup, and usage.

- `src/js/modules/entity/monsterDatabase.js`: **Contains the `MonsterDatabase` class** which manages the database of monster types and their properties. Used for spawning monsters in the game.

### User Interface

- `src/js/modules/ui/index.js`: **Defines the `UI` class** which serves as the main interface for managing the game's user interface components, such as menus, inventory, and character screens.

- `index.html`: The main HTML file that provides the structure for the game's user interface. Includes the game canvas and any necessary UI elements.

### Dependencies and Configuration

- `package-lock.json`: **Automatically generated file** that locks the versions of the project's dependencies, ensuring consistent installation across different environments.

## Functionality Overview

- The game is initialized in `src/js/main.js` where the `RogueGame` class is instantiated. It sets up the game canvas, event listeners, and starts the game loop.

- The `Dungeon` class (`src/js/modules/dungeon.js`) is responsible for generating the game's procedural dungeon levels, including room placement, path connection, and dungeon features like gates and keys.

- The `SpriteRenderer` class (`src/js/modules/sprites.js`) handles the loading and rendering of game sprites, such as tiles, player, and monsters.

- Player movement, inventory management, equipment, and interactions with the game world are handled by the `Player` class (`src/js/modules/entity/player.js`).

- The `InputHandler` class (`src/js/modules/input.js`) processes player input, such as keyboard events, and translates them into game actions.

- Item generation, placement, pickup, and usage are managed by the `ItemManager` class (`src/js/modules/items/itemManager.js`).

- The `MonsterDatabase` class (`src/js/modules/entity/monsterDatabase.js`) maintains the database of monster types and their properties, and is used for spawning monsters in the game.

- The game's user interface components, such as menus, inventory, and character screens, are managed by the `UI` class (`src/js/modules/ui/index.js`).

- The main game loop, which handles game updates and rendering, is implemented in the `RogueGame` class (`src/js/main.js`).

This should give you a high-level overview of your project's structure and where the main functionality is implemented. Let me know if you have any further questions!
