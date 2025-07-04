# Dungeon Generation

## Overview

The dungeon generation system in Modern Rogue is responsible for creating the game's procedural dungeon levels. It  is primarily handled by the Dungeon class defined in the src/js/modules/dungeon.js file.

## Key Components

### Dungeon Class

The `Dungeon` class is responsible for generating the game's procedural dungeon levels. 

The constructor initializes the dungeon with a given seed and difficulty level. It includes the following key components:

- `generateDungeon()`: Generates the dungeon level based on the current seed and difficulty level.
- `getRoomAt(x, y)`: Returns the room at the specified coordinates.
- `getTileAt(x, y)`: Returns the tile at the specified coordinates.
- `getGateAt(x, y)`: Returns the gate at the specified coordinates.
- `getMonsterAt(x, y)`: Returns the monster at the specified coordinates.
- `getItemsAt(x, y)`: Returns the items at the specified coordinates.

Here's an overview of how the dungeon generation is performed, with a focus on coordinates:

1. The Dungeon class constructor takes the width and height of the dungeon grid as parameters. These values determine the size of the dungeon map.

2. The generate() method of the Dungeon class is called to generate the dungeon map. It initializes an empty 2D array called map to represent the dungeon grid, where each cell is initially set to null.

3. The generateInitialSection() method is called to create the initial section of the dungeon. This section is a square area with dimensions equal to the width and height of the dungeon grid.

4. The generateRoomsInSection() method is called to create the rooms within the initial section. This method takes several parameters that define the size and placement of the rooms:

- minRooms: The minimum number of rooms to generate.
- maxRooms: The maximum number of rooms to generate.
- minWidth: The minimum width of the rooms to generate.
- maxWidth: The maximum width of the rooms to generate.
- minHeight: The minimum height of the rooms to generate.
- maxHeight: The maximum height of the rooms to generate.

5. The generateRoomsInSection() method uses a while loop to create the rooms. It randomly generates room dimensions within the specified range and checks if the room overlaps with any existing rooms. If it does not overlap, the room is added to the map.   

6. The connectRoomsInSection() method is called to connect the rooms within the initial section. This method takes an array of rooms and connects them in a way that creates a path through the dungeon.

7. The placeGate() method is called to place a gate in the dungeon. This method takes a gate object and places it in a random location in the dungeon.

8. The placeKey() method is called to place a key in the dungeon. This method takes a key object and places it in a random location in the dungeon.

9. The generateLockedSections() method is called to generate the locked sections of the dungeon. This method takes a count parameter that determines the number of locked sections to generate.
