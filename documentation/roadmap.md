# Modern Rogue - Development Roadmap

This document outlines the planned features and enhancements for the Modern Rogue game, along with implementation details and considerations.

## 1. Saving and Loading Game State
- Implement a system to save the player's progress, including character stats, inventory, equipment, and dungeon state.
- Use browser's local storage or a server-side database to store the game state.
- Add a "Save Game" option in the game menu.
- Automatically save the game at certain checkpoints (e.g., after clearing a dungeon level).
- Allow players to load a saved game from the main menu.

## 2. Enhanced Monster AI and Pathfinding
- Improve monster AI to make them more challenging and engaging.
- Implement pathfinding algorithms (e.g., A* or Dijkstra's) to enable monsters to intelligently navigate the dungeon.
- Make monsters aware of the player's presence and pursue them when in range.
- Add different monster behaviors and attack patterns based on their type and characteristics.

## 3. Varied Dungeon Themes and Layouts
- Introduce different dungeon themes (e.g., castle, cave, forest) with unique visual styles and obstacles.
- Develop algorithms to generate varied dungeon layouts, including multi-level structures and special rooms.
- Incorporate theme-specific traps, puzzles, and interactive elements to enhance the exploration experience.

## 4. Expanded Character Progression and Skills
- Extend the character progression system with additional attributes and skills.
- Introduce skill trees or specializations for players to customize their character's abilities.
- Add passive and active skills that can be unlocked and upgraded as the character levels up.
- Implement a talent system where players can choose unique perks or bonuses at certain milestones.

## 5. Multiplayer Mode
- Develop a multiplayer mode that allows players to cooperate or compete in the same dungeon.
- Implement real-time synchronization of player actions and dungeon state across multiple clients.
- Add chat functionality for player communication.
- Design multiplayer-specific challenges, such as boss battles or time-limited objectives.

## 6. Quest System and NPC Interactions
- Introduce a quest system where players can accept tasks from NPCs scattered throughout the dungeon.
- Create a dialogue system for player-NPC interactions.
- Design a variety of quest types, such as item retrieval, monster slaying, or exploration challenges.
- Implement a reputation system where player actions affect their standing with different NPC factions.

## 7. Enhanced User Interface and Accessibility
- Improve the user interface with intuitive menus, tooltips, and visual feedback.
- Implement customizable keybindings and controller support.
- Add accessibility options, such as color-blind mode and adjustable text size.
- Optimize the UI for different screen sizes and resolutions.

## 8. Sound and Music
- Incorporate immersive sound effects for actions, environments, and monsters.
- Add background music that dynamically changes based on the game state and dungeon theme.
- Implement a music and sound settings menu for player customization.

## 9. Localization and Language Support
- Add support for multiple languages to reach a wider audience.
- Implement a localization system to easily manage and switch between different language files.
- Collaborate with translators or use community translations to provide accurate and culturally appropriate translations.

## 10. Performance Optimization and Cross-Browser Compatibility
- Optimize the game's performance to ensure smooth gameplay on a variety of devices.
- Conduct profiling and identify performance bottlenecks in the code.
- Implement techniques such as lazy loading, caching, and code splitting to improve loading times.
- Test the game on different browsers and address any compatibility issues.

This roadmap provides a high-level overview of the planned features and enhancements for Modern Rogue. Each feature is accompanied by implementation details and considerations to guide the development process.

The roadmap can be prioritized and adjusted based on feedback, resources, and development constraints. It serves as a living document that can evolve as the project progresses. 

## Extra Issues (my notes)

### Must have
- Health potions should be consumable and should restore health when used. (done)
- Mana potions should be consumable and should restore mana when used. (done)
- Monsters should drop items. (?)
- Monsters should be stronger
- Monsters need to be more intelligent (better pathfinding, more aware of the player)

### Nice to have
- Staves should be usable and should cast a spell when used.
- Scrolls should be usable and should cast a spell when used.
- Wands should exist, be usable and should cast a spell when used.
- Ranged weapons should exist, be usable and should fire a projectile when used.



