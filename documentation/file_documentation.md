# Modern Rogue - Functionality Documentation

This document provides an overview of the main JavaScript files in the Modern Rogue project and their responsibilities.

## `src/js/main.js`

- Main entry point of the game
- Initializes the game by creating an instance of the `RogueGame` class
- Sets up event listeners for game initialization and window resizing
- Starts the game loop
- Contains the core `RogueGame` class which manages the overall game state and flow
  - Initializes game components (dungeon, sprites, player, UI, input, item manager, monster database)
  - Handles player input and updates game state accordingly
  - Manages game loop and rendering
  - Implements camera system to follow the player
  - Handles transitions between dungeon areas and world map sections
  - Manages field of view (FOV) calculations
  - Handles player actions (movement, item pickup, combat)
  - Manages game state (playing, character screen, inventory, game over)

## `src/js/modules/dungeon.js`

- Defines the `Dungeon` class responsible for generating and managing the game's dungeon levels
- Implements procedural dungeon generation algorithm
  - Places rooms randomly within the dungeon grid
  - Connects rooms with paths to ensure all rooms are reachable
  - Adds dungeon features like gates and keys
- Provides methods for retrieving information about the generated dungeon (rooms, tiles, gates)

## `src/js/modules/sprites.js`

- Implements the `SpriteRenderer` class which handles loading and rendering of game sprites
- Loads sprite images and maintains a sprite atlas
- Renders tiles, player, and monsters on the game canvas based on their positions and visibility

## `src/js/modules/entity/player.js`

- Contains the `Player` class representing the player character
- Manages player attributes (health, mana, strength, dexterity, etc.)
- Handles player movement within the dungeon
- Implements player inventory management (adding, removing, using items)
- Manages player equipment (weapons, armor, accessories)
- Handles player actions (attacking monsters, using items)
- Implements player progression (experience, leveling up, skill points)

## `src/js/modules/input.js`

- Defines the `InputHandler` class which handles player input
- Listens for keyboard events and translates them into game actions
- Provides methods for checking the state of specific keys (pressed, down)
- Handles input for movement, item pickup, inventory management, and other player actions

## `src/js/modules/items/itemManager.js`

- Implements the `ItemManager` class responsible for managing game items
- Generates and places items within the dungeon
- Handles item pickup and removal from the ground
- Manages the list of items on the ground and in the player's inventory
- Provides methods for retrieving information about items at specific positions

## `src/js/modules/entity/monsterDatabase.js`

- Contains the `MonsterDatabase` class which manages the database of monster types and their properties
- Defines the attributes and behaviors of different monster types
- Provides methods for creating monsters with specific properties based on the dungeon level and difficulty
- Used for spawning monsters within the dungeon

## `src/js/modules/ui/index.js`

- Defines the `UI` class which serves as the main interface for managing the game's user interface components
- Manages the display of game messages, player stats, and other UI elements
- Handles the creation and management of UI screens (character screen, inventory, help)
- Provides methods for updating and rendering the UI based on game state changes

These are the main JavaScript files and their responsibilities in the Modern Rogue project. Each file focuses on a specific aspect of the game, such as dungeon generation, player management, item handling, and user interface. They work together to create the overall gameplay experience.