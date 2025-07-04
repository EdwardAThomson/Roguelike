export class Dungeon {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.tiles = [];
        this.rooms = [];
        this.gates = []; // Store gate positions
        this.potentialGateLocations = [];
        this.lockedSections = []; // Store sections that are locked behind gates
        this.unlockedSections = []; // Sections that have been unlocked
        this.keys = []; // Store key positions (multiple keys)
        this.areaLevel = 1; // Track difficulty level of areas
        this.revealedMap = false; // Whether the full map is revealed to the player
        this.worldX = 0; // X coordinate in the larger world grid
        this.worldY = 0; // Y coordinate in the larger world grid
        this.worldSectionId = '0_0'; // Identifier for this section in the larger world
    }

    // Dungeon generation
    generate(game, entryDirection = null, previousSectionId = null) {
        // Initialize all tiles as walls
        this.tiles = Array(this.height).fill().map(() => 
            Array(this.width).fill('wall'));
        

        // Create rooms
        // not just initial section, but the entire map (need to rename function)
        this.generateInitialSection();


        // ##########   Gates ##################################
        // NEW: Use the 4-gate constrained system
        console.log(`[NEW] Generating 4 constrained gates for section ${this.worldSectionId}`);
        this.generateConstrainedGates(game);

        
        return this.tiles;
    }
    
    // Generate the initial section of the dungeon -- We are using this function.
    generateInitialSection() {
        // Use the full map size for a complete dungeon
        const sectionWidth = this.width;
        const sectionHeight = this.height;
        
        // Generate more rooms throughout the entire map
        this.generateRoomsInSection(8, 15, 4, 8, 4, 7, 0, 0, sectionWidth, sectionHeight);
        
        // Connect the rooms with corridors
        this.connectRoomsInSection(this.rooms);
        
        // Add this section to the unlocked sections
        this.unlockedSections.push({
            x: 0,
            y: 0,
            width: sectionWidth,
            height: sectionHeight,
            rooms: [...this.rooms], // Copy the rooms
            id: 0, // Initial section has ID 0
            worldSectionId: this.worldSectionId /// string
        });
        
        // initial worldSectionId is (0,0) -- but it is never updated afterwards in this file --- it's a string
        console.log(`Generated full map section with ${this.rooms.length} rooms in world section ${this.worldSectionId}`);
    }
    

    
    // ###### Code for placing the actual gates #######################################################
    // Place gates that connect to other sections of the world map -- We are using this function.
    placeWorldGates() {

        console.log('========= Now placing section gates ==========');
  
        this.gatePlacement();
        // this.ensureGatesAccessibility();

        // console.log("==== SECTION GATES PLACED ====");
        this.gates.forEach(gate => {
            console.log(`Gate at (${gate.x}, ${gate.y}) - Direction: ${gate.direction}, leads to section (${gate.sections[1].x}, ${gate.sections[1].y})`);
        });
        // console.log("==========================");
        
    }
    

    // if we can't find natural perfect gates then we add new gates and forcibly connect them
    // New method to force gate placement if no gates were placed naturally
    gatePlacement(entryDirection = null) {
        
        let direction;
        let directions;

        // Set Direction - a random direction from the opposite direction
        // I don't want new gates to be placed on same wall as the entry gate.
        if (entryDirection) {
            const oppositeDirection = this.getOppositeDirection(entryDirection);
            
            switch(oppositeDirection) {
                case 'north':
                    directions = ['east', 'south', 'west'];
                    direction = directions[Math.floor(Math.random() * directions.length)];
                    break;
                case 'east':
                    directions = ['north', 'south', 'west'];
                    direction = directions[Math.floor(Math.random() * directions.length)];
                    break;
                case 'south':
                    directions = ['north', 'east', 'west'];
                    direction = directions[Math.floor(Math.random() * directions.length)];
                    break;
                case 'west':
                    directions = ['north', 'east', 'south'];
                    direction = directions[Math.floor(Math.random() * directions.length)];
                    break;
            }


        }
        else {
            // Choose a random direction
            const directions = ['north', 'east', 'south', 'west'];
            direction = directions[Math.floor(Math.random() * directions.length)];
        }
        

        // Determine coordinates for the gate based on direction
        let gateX, gateY;
        
        switch(direction) {
            case 'north':   // directions correct here? Claude mixed up the directions before
                gateX = Math.floor(Math.random() * (this.width-4)) +2; // Math.floor(this.width / 2);
                gateY = 0;
                break;
            case 'east':    // 
                gateX = this.width - 1;
                gateY = Math.floor(Math.random() * (this.height-4)) +2; // Math.floor(this.height / 2);
                break;
            case 'south':   // 
                gateX = Math.floor(Math.random() * (this.width-4)) +2; // Math.floor(this.width / 2);
                gateY = this.height - 1;
                break;
            case 'west':    // 
                gateX = 0;
                gateY = Math.floor(Math.random() * (this.height-4)) +2; // Math.floor(this.height / 2);
                
                break;
        }
        
        // Determine target world coordinates
        let adjacentWorldX = this.worldX; // Need to check this
        let adjacentWorldY = this.worldY;

        // Original code from Claude --- the directions are messed up
        // if (direction === 'north') adjacentWorldY -= 1; // need to check this
        // if (direction === 'east') adjacentWorldX += 1;
        // if (direction === 'south') adjacentWorldY += 1;
        // if (direction === 'west') adjacentWorldX -= 1;
        
        if (direction === 'north') adjacentWorldY += 1; // need to check this
        if (direction === 'east') adjacentWorldX += 1;
        if (direction === 'south') adjacentWorldY -= 1;
        if (direction === 'west') adjacentWorldX -= 1;
        

        console.log(`The height of the dungeon is ${this.height} and the width is ${this.width}.`);

        // Create gate ID
        // const gateId = `gate_${this.worldX}_${this.worldY}_to_${adjacentWorldX}_${adjacentWorldY}`;
        console.log(`Placing gate at (Y: ${gateY}, X: ${gateX}) on ${direction} wall`);
        const gateId = `gate_${Date.now()}_${this.worldX}_${this.worldY}_to_${adjacentWorldX}_${adjacentWorldY}`;
        
        // Place the gate -- gatePlacement()
        // Tiles is defined as [height][width]. Somewhat confusingly..
        this.tiles[gateY][gateX] = 'gate';
        

        // #### Gate Object ####
        // Store gate information
        this.gates.push({
            id: gateId,
            x: gateX,
            y: gateY,
            sectionId: this.worldSectionId,
            nextSectionId: `${adjacentWorldX}_${adjacentWorldY}`,
            direction: direction, // 'direction' is actually the wall it is on.
            sections: [
                {x: this.worldX, y: this.worldY},       // Section A 
                {x: adjacentWorldX, y: adjacentWorldY}  // Section B
            ]
        });
        

        // Ensure all gates are accessible from rooms
        this.ensureGatesAccessibility();

        console.log(`Gate placement at (${gateX}, ${gateY}) on ${direction} wall. With ID: ${gateId}`);
    }
    
    // New method to ensure all gates are accessible from rooms
    ensureGatesAccessibility() {
        for (const gate of this.gates) {
            // Check if the gate is already accessible (adjacent to a floor tile)
            const isAccessible = this.isAdjacentToFloor(gate.x, gate.y);
            
            if (!isAccessible) {
                // console.log(`Gate at (${gate.x}, ${gate.y}) is not accessible, connecting to nearest room...`);
                this.connectGateToNearestRoom(gate);
            }
        }
    }
    
    // Helper method to check if a tile is adjacent to a floor tile
    isAdjacentToFloor(x, y) {
        const adjacentDirections = [
            [-1, 0], [1, 0], [0, -1], [0, 1] // Left, right, up, down
        ];
        
        for (const [dx, dy] of adjacentDirections) {
            const nx = x + dx;
            const ny = y + dy;
            
            // Check bounds
            if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) {
                continue;
            }
            
            // Check if adjacent tile is floor
            if (this.tiles[ny][nx] === 'floor') {
                return true;
            }
        }
        
        return false;
    }
    
    // Method to connect a gate to the nearest room
    connectGateToNearestRoom(gate) {
        // Find the nearest room center
        let nearestRoom = null;
        let minDistance = Infinity;
        
        for (const room of this.rooms) {
            const roomCenterX = Math.floor(room.x + room.width / 2);
            const roomCenterY = Math.floor(room.y + room.height / 2);
            
            const distance = Math.sqrt(
                Math.pow(gate.x - roomCenterX, 2) + 
                Math.pow(gate.y - roomCenterY, 2)
            );
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestRoom = room;
            }
        }
        
        if (!nearestRoom) {
            console.error("No rooms found to connect gate to!");
            return;
        }
        
        // Create a corridor from the gate to the nearest room
        const roomCenterX = Math.floor(nearestRoom.x + nearestRoom.width / 2);
        const roomCenterY = Math.floor(nearestRoom.y + nearestRoom.height / 2);
        
        // Create a path: first move horizontally, then vertically (L-shaped corridor)
        // Start one tile away from the gate (to ensure the gate remains a wall tile)
        let startX = gate.x;
        let startY = gate.y;
        
        // Determine the starting point based on gate direction
        switch(gate.direction) {
            case 'north':
                startY += 1; // Start one tile south of the gate
                break;
            case 'east':
                startX -= 1; // Start one tile west of the gate
                break;
            case 'south':
                startY -= 1; // Start one tile north of the gate
                break;
            case 'west':
                startX += 1; // Start one tile east of the gate
                break;
        }
        
        // Carve horizontal corridor
        const horizontalDirection = startX < roomCenterX ? 1 : -1;
        for (let x = startX; horizontalDirection > 0 ? x <= roomCenterX : x >= roomCenterX; x += horizontalDirection) {
            if (this.tiles[startY][x] === 'wall') {
                this.tiles[startY][x] = 'floor';
            }
        }
        
        // Carve vertical corridor
        const verticalDirection = startY < roomCenterY ? 1 : -1;
        for (let y = startY; verticalDirection > 0 ? y <= roomCenterY : y >= roomCenterY; y += verticalDirection) {
            if (this.tiles[y][roomCenterX] === 'wall') {
                this.tiles[y][roomCenterX] = 'floor';
            }
        }
        
        // console.log(`Connected gate at (${gate.x}, ${gate.y}) to room at (${nearestRoom.x}, ${nearestRoom.y})`);
    }
    
    // TODO: Remove this method. If no dependencies, remove it.
    // This replaces the original method
    // generateLockedSections(count) {
    //     // This method is no longer used for the new world map approach
    //     console.log("Using world gates instead of locked sections within the same map");
    // }

    // ## using this ffor room genearation
    generateRoomsInSection(minRooms, maxRooms, minWidth, maxWidth, minHeight, maxHeight, sectionX, sectionY, sectionWidth, sectionHeight) {
        const numRooms = Math.floor(Math.random() * (maxRooms - minRooms + 1)) + minRooms;
        
        let attemptsLeft = numRooms * 3; // Allow multiple attempts to place rooms
        let roomsCreated = 0;
        
        while (roomsCreated < numRooms && attemptsLeft > 0) {
            // Random room dimensions
            const roomWidth = Math.floor(Math.random() * (maxWidth - minWidth + 1)) + minWidth;
            const roomHeight = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
            
            // Random room position within the section (leaving border)
            const x = Math.floor(Math.random() * (sectionWidth - roomWidth - 2)) + sectionX + 1;
            const y = Math.floor(Math.random() * (sectionHeight - roomHeight - 2)) + sectionY + 1;
            
            // Check if this room overlaps with existing rooms
            let overlaps = false;
            const newRoom = {x, y, width: roomWidth, height: roomHeight, section: this.lockedSections.length};
            
            for (const room of this.rooms) {
                if (this.roomsOverlap(newRoom, room)) {
                    overlaps = true;
                    break;
                }
            }
            
            if (!overlaps) {
                this.createRoom(x, y, roomWidth, roomHeight);
                this.rooms.push(newRoom);
                roomsCreated++;
            }
            
            attemptsLeft--;
        }
        
        // console.log(`Created ${roomsCreated} rooms in section (${sectionX},${sectionY}) - (${sectionX+sectionWidth},${sectionY+sectionHeight})`);
    }
    
    roomsOverlap(room1, room2) {
        // Add a buffer of 1 tile to prevent rooms from touching
        return (
            room1.x <= room2.x + room2.width + 1 &&
            room1.x + room1.width + 1 >= room2.x &&
            room1.y <= room2.y + room2.height + 1 &&
            room1.y + room1.height + 1 >= room2.y
        );
    }
    
    createRoom(x, y, width, height) {
        // Set room tiles to floor
        for (let j = y; j < y + height; j++) {
            for (let i = x; i < x + width; i++) {
                this.tiles[j][i] = 'floor';
            }
        }
    }
    
    connectRoomsInSection(roomsToConnect) {
        if (roomsToConnect.length <= 1) {
            return; // Nothing to connect
        }
        
        // Connect each room to the next one
        for (let i = 0; i < roomsToConnect.length - 1; i++) {
            const roomA = roomsToConnect[i];
            const roomB = roomsToConnect[i + 1];
            
            // Get center points of each room
            const pointA = {
                x: Math.floor(roomA.x + roomA.width / 2),
                y: Math.floor(roomA.y + roomA.height / 2)
            };
            
            const pointB = {
                x: Math.floor(roomB.x + roomB.width / 2),
                y: Math.floor(roomB.y + roomB.height / 2)
            };
            
            // Randomly decide whether to go horizontal or vertical first
            if (Math.random() < 0.5) {
                this.createHorizontalCorridor(pointA.x, pointB.x, pointA.y);
                this.createVerticalCorridor(pointA.y, pointB.y, pointB.x);
            } else {
                this.createVerticalCorridor(pointA.y, pointB.y, pointA.x);
                this.createHorizontalCorridor(pointA.x, pointB.x, pointB.y);
            }
        }
        
        // Connect first and last room to create a loop
        if (roomsToConnect.length > 2) {
            const firstRoom = roomsToConnect[0];
            const lastRoom = roomsToConnect[roomsToConnect.length - 1];
            
            const pointA = {
                x: Math.floor(firstRoom.x + firstRoom.width / 2),
                y: Math.floor(firstRoom.y + firstRoom.height / 2)
            };
            
            const pointB = {
                x: Math.floor(lastRoom.x + lastRoom.width / 2),
                y: Math.floor(lastRoom.y + lastRoom.height / 2)
            };
            
            // Create a more direct path
            if (Math.random() < 0.5) {
                this.createHorizontalCorridor(pointA.x, pointB.x, pointA.y);
                this.createVerticalCorridor(pointA.y, pointB.y, pointB.x);
            } else {
                this.createVerticalCorridor(pointA.y, pointB.y, pointA.x);
                this.createHorizontalCorridor(pointA.x, pointB.x, pointB.y);
            }
        }
    }
    



    // ################# Not used ##############################################################
    placeGateBetweenSections(sourceSection, targetSection, gateId) {
        // Find suitable rooms from each section
        // First make sure sections have rooms property
        if (!sourceSection.rooms) {
            console.warn("Source section has no rooms property, using empty array");
            sourceSection.rooms = [];
        }
        
        if (!targetSection.rooms) {
            console.warn("Target section has no rooms property, adding rooms array");
            // This is the issue - sections don't have a rooms property when created in generateLockedSections
            // Use the most recently added rooms as the targetSection's rooms
            const roomsBefore = this.rooms.length;
            targetSection.rooms = this.rooms.slice(roomsBefore - 5); // Use the last 5 rooms added
        }
            
        const sourceRoom = this.findRoomClosestToSection(sourceSection.rooms, targetSection);
        const targetRoom = this.findRoomClosestToSection(targetSection.rooms, sourceSection);
        
        if (!sourceRoom || !targetRoom) {
            console.error("Couldn't find suitable rooms for gate placement");
            return;
        }
        
        // Determine gate positions on the border between sections
        let gateX, gateY, corridorStartX, corridorStartY, corridorEndX, corridorEndY;
        
        // Calculate the center points of each room
        const sourceCenterX = Math.floor(sourceRoom.x + sourceRoom.width / 2);
        const sourceCenterY = Math.floor(sourceRoom.y + sourceRoom.height / 2);
        const targetCenterX = Math.floor(targetRoom.x + targetRoom.width / 2);
        const targetCenterY = Math.floor(targetRoom.y + targetRoom.height / 2);
        
        // Determine which direction the gate should face based on the sections
        if (targetSection.x > sourceSection.x) {
            // Target section is to the right
            gateX = targetSection.x;
            gateY = Math.floor((sourceCenterY + targetCenterY) / 2);
            
            corridorStartX = sourceCenterX;
            corridorStartY = sourceCenterY;
            corridorEndX = targetCenterX;
            corridorEndY = targetCenterY;
        } else if (targetSection.y > sourceSection.y) {
            // Target section is below
            gateX = Math.floor((sourceCenterX + targetCenterX) / 2);
            gateY = targetSection.y;
            
            corridorStartX = sourceCenterX;
            corridorStartY = sourceCenterY;
            corridorEndX = targetCenterX;
            corridorEndY = targetCenterY;
        } else if (targetSection.x < sourceSection.x) {
            // Target section is to the left
            gateX = sourceSection.x;
            gateY = Math.floor((sourceCenterY + targetCenterY) / 2);
            
            corridorStartX = targetCenterX;
            corridorStartY = targetCenterY;
            corridorEndX = sourceCenterX;
            corridorEndY = sourceCenterY;
        } else {
            // Target section is above
            gateX = Math.floor((sourceCenterX + targetCenterX) / 2);
            gateY = sourceSection.y;
            
            corridorStartX = targetCenterX;
            corridorStartY = targetCenterY;
            corridorEndX = sourceCenterX;
            corridorEndY = sourceCenterY;
        }
        
        // Place the gate
        this.tiles[gateY][gateX] = 'gate';
        
        // Store the gate with an ID
        this.gates.push({
            id: gateId,
            x: gateX,
            y: gateY,
            sectionId: this.worldSectionId,
            nextSectionId: `${targetSection.x}_${targetSection.y}`,
            locked: true,
            sections: [
                {x: this.worldX, y: this.worldY},  // This section
                {x: targetSection.x, y: targetSection.y}  // Target section
            ]
        });
        
        // Create a corridor stub behind the gate (will be completed when unlocked)
        this.createLockedCorridorStub(gateX, gateY, corridorStartX, corridorStartY, corridorEndX, corridorEndY);
        
        console.log(`Placed gate ${gateId} at (${gateX}, ${gateY}) connecting to section at (${targetSection.x}, ${targetSection.y})`);
    }




    
    createHorizontalCorridor(x1, x2, y) {
        const start = Math.min(x1, x2);
        const end = Math.max(x1, x2);
        
        for (let x = start; x <= end; x++) {
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                this.tiles[y][x] = 'floor';
            }
        }
    }
    
    createVerticalCorridor(y1, y2, x) {
        const start = Math.min(y1, y2);
        const end = Math.max(y1, y2);
        
        for (let y = start; y <= end; y++) {
            if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                this.tiles[y][x] = 'floor';
            }
        }
    }
    
    getRandomRoom() {
        // Get a random room, but only from unlocked sections
        return this.getRandomUnlockedRoom();
    }
    
    getRandomFloorPosition() {
        const room = this.getRandomRoom();
        if (!room) {
            // Fallback to the very first room if needed
            if (this.rooms.length > 0) {
                const firstRoom = this.rooms[0];
                const x = Math.floor(Math.random() * (firstRoom.width - 2)) + firstRoom.x + 1;
                const y = Math.floor(Math.random() * (firstRoom.height - 2)) + firstRoom.y + 1;
                return {x, y};
            }
            
            // Last resort - fallback to center of map
            return {x: Math.floor(this.width / 2), y: Math.floor(this.height / 2)};
        }
        
        const x = Math.floor(Math.random() * (room.width - 2)) + room.x + 1;
        const y = Math.floor(Math.random() * (room.height - 2)) + room.y + 1;
        return {x, y};
    }
  
    
    placeKey() {
        // Make sure we have rooms to place the key in
        if (!this.rooms || this.rooms.length === 0) {
            console.error("No rooms available to place key");
            return;
        }
        
        // Choose a room for the key (one of the first rooms to encourage exploration)
        // Make sure we don't go out of bounds
        const maxIndex = Math.min(Math.floor(this.rooms.length / 3), this.rooms.length - 1);
        const keyRoomIndex = Math.floor(Math.random() * (maxIndex + 1)); // +1 since random is exclusive
        let keyRoom = this.rooms[keyRoomIndex];
        
        if (!keyRoom) {
            console.error(`Failed to get room at index ${keyRoomIndex}`);
            // Fallback to first room if available
            if (this.rooms.length > 0) {
                keyRoom = this.rooms[0];
            } else {
                return;
            }
        }
        
        // Make sure the room dimensions are valid
        if (keyRoom.width <= 2 || keyRoom.height <= 2) {
            console.error("Room too small for key placement");
            // Try to find a larger room
            for (const room of this.rooms) {
                if (room.width > 2 && room.height > 2) {
                    keyRoom = room;
                    break;
                }
            }
            
            if (keyRoom.width <= 2 || keyRoom.height <= 2) {
                // Still no suitable room, use a fixed position
                this.keyPosition = { x: Math.floor(this.width / 2), y: Math.floor(this.height / 2) };
                return;
            }
        }
        
        // Place key at a random position in the room (safely)
        const keyX = Math.min(
            Math.max(Math.floor(Math.random() * (keyRoom.width - 2)) + keyRoom.x + 1,
            this.width - 1)
        );
        const keyY = Math.min(
            Math.max(Math.floor(Math.random() * (keyRoom.height - 2)) + keyRoom.y + 1,
            0)
        );
        
        // Double-check that this position is actually a floor tile
        if (this.tiles[keyY] && this.tiles[keyY][keyX] !== 'floor') {
            console.warn(`Key position is not a floor tile: ${this.tiles[keyY][keyX]}`);
            // Find any floor tile as fallback
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (this.tiles[y][x] === 'floor') {
                        this.keyPosition = { x, y };
                        return;
                    }
                }
            }
        } else {
            // Store the key position
            this.keyPosition = { x: keyX, y: keyY };
        }
    }
    
    findRoomClosestToSection(rooms, targetSection) {
        if (!rooms || rooms.length === 0) {
            return null;
        }
        
        // Find the center of the target section
        const targetCenterX = targetSection.x + targetSection.width / 2;
        const targetCenterY = targetSection.y + targetSection.height / 2;
        
        // Find the room closest to the target section
        let closestRoom = null;
        let shortestDistance = Infinity;
        
        for (const room of rooms) {
            const roomCenterX = room.x + room.width / 2;
            const roomCenterY = room.y + room.height / 2;
            
            // Calculate distance to target section center
            const dx = roomCenterX - targetCenterX;
            const dy = roomCenterY - targetCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < shortestDistance) {
                shortestDistance = distance;
                closestRoom = room;
            }
        }
        
        return closestRoom;
    }
    
    createLockedCorridorStub(gateX, gateY, sourceX, sourceY, targetX, targetY) {
        // Determine which direction the corridor will go
        let dx = 0, dy = 0;
        
        if (Math.abs(gateX - sourceX) > Math.abs(gateY - sourceY)) {
            // Horizontal corridor
            dx = gateX > sourceX ? -1 : 1;
        } else {
            // Vertical corridor
            dy = gateY > sourceY ? -1 : 1;
        }
        
        // Create a short "stub" corridor on the source side of the gate
        let stubX = gateX + dx;
        let stubY = gateY + dy;
        
        // Make sure we don't go out of bounds
        if (stubX >= 0 && stubX < this.width && stubY >= 0 && stubY < this.height) {
            // Create a short corridor (3 tiles)
            for (let i = 0; i < 3; i++) {
                let x = gateX + dx * (i + 1);
                let y = gateY + dy * (i + 1);
                
                // Check bounds
                if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    this.tiles[y][x] = 'floor';
                }
            }
        }
    }
    
    // Place a key for a specific gate
    placeKeyForSection(gateId) {
        // Find a random room in the accessible part of the dungeon
        const accessibleRooms = this.unlockedSections.flatMap(section => section.rooms);
        
        if (accessibleRooms.length === 0) {
            console.error("No accessible rooms to place key");
            return;
        }
        
        const randomRoomIndex = Math.floor(Math.random() * accessibleRooms.length);
        const room = accessibleRooms[randomRoomIndex];
        
        // Place the key in a random position in the room
        const keyX = Math.floor(Math.random() * (room.width - 2)) + room.x + 1;
        const keyY = Math.floor(Math.random() * (room.height - 2)) + room.y + 1;
        
        // Store the key position with its gate ID
        this.keys.push({
            id: gateId,
            x: keyX,
            y: keyY
        });
        
        console.log(`Placed key for gate ${gateId} at (${keyX}, ${keyY})`);
    }
    
    // Check if a gate is at the given position
    isGateAt(x, y) {
        return this.gates.some(gate => gate.x === x && gate.y === y);
    }
    
    // Get gate at position
    getGateAt(x, y) {
        return this.gates.find(gate => gate.x === x && gate.y === y);
    }
    
    // Get key for a specific gate ID
    getKeyForGate(gateId) {
        return this.keys.find(key => key.id === gateId);
    }
    
    // Unlock a gate and connect the corridors
    unlockGate(gateId) {
        const gate = this.gates.find(gate => gate.id === gateId);
        
        if (!gate) {
            console.error(`Gate with ID ${gateId} not found`);
            return false;
        }
        
        // Mark gate as unlocked
        gate.locked = false;
        
        // Find target section
        const targetSection = gate.targetSection;
        
        // Find rooms nearest to gate in both sections
        const sourceSection = this.unlockedSections[0]; // Main section
        const sourceRoom = this.findRoomClosestToPoint(sourceSection.rooms, gate.x, gate.y);
        const targetRoom = this.findRoomClosestToPoint(
            this.lockedSections.find(s => s.id === gateId)?.rooms || [], 
            gate.x, gate.y
        );
        
        if (!sourceRoom || !targetRoom) {
            console.error("Could not find rooms to connect for unlocked gate");
            return false;
        }
        
        // Get room centers
        const sourceX = Math.floor(sourceRoom.x + sourceRoom.width / 2);
        const sourceY = Math.floor(sourceRoom.y + sourceRoom.height / 2);
        const targetX = Math.floor(targetRoom.x + targetRoom.width / 2);
        const targetY = Math.floor(targetRoom.y + targetRoom.height / 2);
        
        // Create corridor to connect the rooms (through the gate)
        this.createGateCorridor(gate.x, gate.y, sourceX, sourceY, targetX, targetY);
        
        // Add the newly accessible section to unlocked sections
        this.unlockedSections.push(targetSection);
        
        // Remove from locked sections
        this.lockedSections = this.lockedSections.filter(s => s.id !== gateId);
        
        console.log(`Unlocked gate ${gateId} and connected sections`);
        return true;
    }
    
    // Find room closest to a specific point
    findRoomClosestToPoint(rooms, x, y) {
        if (!rooms || rooms.length === 0) {
            return null;
        }
        
        let closestRoom = null;
        let shortestDistance = Infinity;
        
        for (const room of rooms) {
            const roomCenterX = room.x + room.width / 2;
            const roomCenterY = room.y + room.height / 2;
            
            // Calculate distance to target point
            const dx = roomCenterX - x;
            const dy = roomCenterY - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < shortestDistance) {
                shortestDistance = distance;
                closestRoom = room;
            }
        }
        
        return closestRoom;
    }
    
    // Create a corridor that goes through a gate
    createGateCorridor(gateX, gateY, sourceX, sourceY, targetX, targetY) {
        // Create a path from source to gate
        if (Math.random() < 0.5) {
            this.createHorizontalCorridor(sourceX, gateX, sourceY);
            this.createVerticalCorridor(sourceY, gateY, gateX);
        } else {
            this.createVerticalCorridor(sourceY, gateY, sourceX);
            this.createHorizontalCorridor(sourceX, gateX, gateY);
        }
        
        // Create a path from gate to target
        if (Math.random() < 0.5) {
            this.createHorizontalCorridor(gateX, targetX, gateY);
            this.createVerticalCorridor(gateY, targetY, targetX);
        } else {
            this.createVerticalCorridor(gateY, targetY, gateX);
            this.createHorizontalCorridor(gateX, targetX, targetY);
        }
    }
    
    // Get all keys in the dungeon
    getAllKeys() {
        return [...this.keys];
    }
    
    // Get all gates in the dungeon
    getAllGates() {
        return [...this.gates];
    }
    
    // Check if a key is at the given position
    isKeyAt(x, y) {
        return this.keys.some(key => key.x === x && key.y === y);
    }
    
    // Get key at position
    getKeyAt(x, y) {
        return this.keys.find(key => key.x === x && key.y === y);
    }
    
    // Remove a key from the dungeon
    removeKey(keyId) {
        const keyIndex = this.keys.findIndex(key => key.id === keyId);
        
        if (keyIndex >= 0) {
            const removedKey = this.keys.splice(keyIndex, 1)[0];
            return removedKey;
        }
        
        return null;
    }
    
    // Check if a specific gate is locked
    isGateLocked(gateId) {
        const gate = this.gates.find(gate => gate.id === gateId);
        return gate ? gate.locked : true; // Default to locked if gate not found
    }
    
    // Get the difficulty level of a section
    getSectionDifficulty(sectionId) {
        const section = this.lockedSections.find(s => s.id === sectionId);
        return section ? section.difficulty : 1; // Default to 1 if section not found
    }
    
    // Get random room from unlocked sections
    getRandomUnlockedRoom() {
        const unlockedRooms = this.unlockedSections.flatMap(section => section.rooms);
        
        if (unlockedRooms.length === 0) {
            return null;
        }
        
        return unlockedRooms[Math.floor(Math.random() * unlockedRooms.length)];
    }

    // Add a new method to create a return gate
    createReturnGate(entryDirection, previousSectionId) {
        console.log(`Creating return gate to section ${previousSectionId}. We came from the ${entryDirection} wall.`);
        
        // Find the starting room (should be the first room near the appropriate edge)
        const startRoom = this.getStartingRoomForDirection(entryDirection);
        
        if (!startRoom) {
            console.error("Could not find a suitable starting room for return gate!");
            return;
        }
        
        // Determine the wall where the gate should be placed based on entry direction
        // The return gate should be on the opposite wall from the entry direction
        const oppositeDirection = this.getOppositeDirection(entryDirection);
        
        // Find a suitable wall tile in the starting room for the gate #######################################################
        // const gatePosition = this.findGatePositionInRoom(startRoom, oppositeDirection);

        let gateX, gateY;
        switch(oppositeDirection) {
            case 'north':   // directions correct here? Claude mixed up the directions before
                gateX = Math.floor(this.width / 2);
                gateY = 0;
                break;
            case 'east':    // 
                gateX = this.width - 1;
                gateY = Math.floor(this.height / 2);
                break;
            case 'south':   // 
                gateX = Math.floor(this.width / 2);
                gateY = this.height - 1;
                break;
            case 'west':    // 
                gateX = 0;
                gateY = Math.floor(this.height / 2);
                break;
        }
        
        console.log(`Opposite direction: ${oppositeDirection}. Return gate position: (${gateX}, ${gateY})`);


        // if (!gatePosition) {
        //     console.error("Could not find a suitable position for return gate!");
        //     return;
        // }
        

        // Place the gate
        // this.tiles[gatePosition.y][gatePosition.x] = 'gate';
        
        // Place the gate -- gatePlacement()
        this.tiles[gateY][gateX] = 'gate';
        // this.tiles[gateX][gateY] = 'gate'; /// why is this not working?


        // const gateId = `gate_${Date.now()}_${this.worldX}_${this.worldY}_to_${adjacentWorldX}_${adjacentWorldY}`;
        const gateId = `gate_${Date.now()}_${this.worldX}_${this.worldY}_to_${previousSectionId}`;
        

        // Store the gate information
        this.gates.push({
            id: gateId,
            x: gateX,
            y: gateY,
            direction: oppositeDirection,
            sectionId: this.worldSectionId,
            nextSectionId: previousSectionId,
            locked: false,
            sections: [
                {x: this.worldX, y: this.worldY},  // Current section
                {x: previousSectionId.x, y: previousSectionId.y}  // Previous section
            ]
        });
        
        console.log(`Return gate placed at (${gateX}, ${gateY}) leading to section ${previousSectionId}`);
        console.log(`Return gate has ID: ${gateId}.`);

    }

    // Helper method to get the opposite direction
    getOppositeDirection(direction) {
        switch(direction) {
            case 'north': return 'south';
            case 'east': return 'west';
            case 'south': return 'north';
            case 'west': return 'east';
            default: return 'south'; // Default fallback
        }
    }

    // Find a starting room near the appropriate edge based on entry direction
    getStartingRoomForDirection(entryDirection) {
        // Sort rooms by their proximity to the appropriate edge
        const sortedRooms = [...this.rooms].sort((a, b) => {
            let aValue, bValue;
            
            switch(entryDirection) {
                case 'north': // Coming from north, find room near south edge
                    aValue = this.height - (a.y + a.height);
                    bValue = this.height - (b.y + b.height);
                    break;
                case 'east': // Coming from east, find room near west edge
                    aValue = a.x;
                    bValue = b.x;
                    break;
                case 'south': // Coming from south, find room near north edge
                    aValue = a.y;
                    bValue = b.y;
                    break;
                case 'west': // Coming from west, find room near east edge
                    aValue = this.width - (a.x + a.width);
                    bValue = this.width - (b.x + b.width);
                    break;
                default:
                    aValue = 0;
                    bValue = 0;
            }
            
            return aValue - bValue;
        });
        
        // Return the room closest to the appropriate edge
        return sortedRooms[0];
    }

    // Fix the findGatePositionInRoom method to ensure gates are placed IN walls
    findGatePositionInRoom(room, direction) {
        // Determine the wall coordinates based on direction
        let possiblePositions = [];
        
        // Debug the room boundaries
        console.log(`Finding gate position in room: x=${room.x}, y=${room.y}, w=${room.width}, h=${room.height}, direction=${direction}`);
        
        // Expand search area slightly to ensure we find actual walls
        const searchMargin = 2;
        
        switch(direction) {
            case 'north':
                // Look for north wall tiles (search a bit above and below the nominal room boundary)
                for (let i = 0; i < room.width; i++) {
                    for (let offset = -searchMargin; offset <= searchMargin; offset++) {
                        const x = room.x + i;
                        const y = room.y + offset;
                        
                        // Skip if out of bounds
                        if (y < 0 || y >= this.height - 1) continue;
                        
                        // Check if this is a wall with floor below it
                        if (this.tiles[y][x] === 'wall' && this.tiles[y + 1][x] === 'floor') {
                            possiblePositions.push({x, y});
                            console.log(`Found north wall at (${x}, ${y})`);
                        }
                    }
                }
                break;
                
            case 'east':
                // Look for east wall tiles
                for (let i = 0; i < room.height; i++) {
                    for (let offset = -searchMargin; offset <= searchMargin; offset++) {
                        const x = room.x + room.width - 1 + offset;
                        const y = room.y + i;
                        
                        // Skip if out of bounds
                        if (x < 1 || x >= this.width) continue;
                        
                        // Check if this is a wall with floor to the left
                        if (this.tiles[y][x] === 'wall' && this.tiles[y][x - 1] === 'floor') {
                            possiblePositions.push({x, y});
                            console.log(`Found east wall at (${x}, ${y})`);
                        }
                    }
                }
                break;
                
            case 'south':
                // Look for south wall tiles
                for (let i = 0; i < room.width; i++) {
                    for (let offset = -searchMargin; offset <= searchMargin; offset++) {
                        const x = room.x + i;
                        const y = room.y + room.height - 1 + offset;
                        
                        // Skip if out of bounds
                        if (y < 1 || y >= this.height) continue;
                        
                        // Check if this is a wall with floor above it
                        if (this.tiles[y][x] === 'wall' && this.tiles[y - 1][x] === 'floor') {
                            possiblePositions.push({x, y});
                            console.log(`Found south wall at (${x}, ${y})`);
                        }
                    }
                }
                break;
                
            case 'west':
                // Look for west wall tiles
                for (let i = 0; i < room.height; i++) {
                    for (let offset = -searchMargin; offset <= searchMargin; offset++) {
                        const x = room.x + offset;
                        const y = room.y + i;
                        
                        // Skip if out of bounds
                        if (x < 0 || x >= this.width - 1) continue;
                        
                        // Check if this is a wall with floor to the right
                        if (this.tiles[y][x] === 'wall' && this.tiles[y][x + 1] === 'floor') {
                            possiblePositions.push({x, y});
                            console.log(`Found west wall at (${x}, ${y})`);
                        }
                    }
                }
                break;
        }
        
        console.log(`Found ${possiblePositions.length} possible positions for ${direction} gate`);
        
        // If we found valid positions, return a random one
        if (possiblePositions.length > 0) {
            const chosen = possiblePositions[Math.floor(Math.random() * possiblePositions.length)];
            console.log(`Chosen gate position: (${chosen.x}, ${chosen.y})`);
            return chosen;
        }
        
        console.log("No valid wall positions found, forcing gate position...");
        // If no valid positions found, try to force a position
        return this.forceGatePositionInRoom(room, direction);
    }

    // Force a gate position if no valid ones are found
    forceGatePositionInRoom(room, direction) {
        // Determine a position based on the room and direction
        let x, y;
        
        switch(direction) {
            case 'north':
                x = room.x + Math.floor(room.width / 2);
                y = room.y;
                break;
            case 'east':
                x = room.x + room.width - 1;
                y = room.y + Math.floor(room.height / 2);
                break;
            case 'south':
                x = room.x + Math.floor(room.width / 2);
                y = room.y + room.height - 1;
                break;
            case 'west':
                x = room.x;
                y = room.y + Math.floor(room.height / 2);
                break;
        }
        
        // Ensure the position is within bounds
        x = Math.max(0, Math.min(x, this.width - 1));
        y = Math.max(0, Math.min(y, this.height - 1));
        
        // Force the wall tile at this position
        this.tiles[y][x] = 'wall';
        
        // Ensure there's a floor tile inside
        let floorX = x, floorY = y;
        
        switch(direction) {
            case 'north': floorY += 1; break;
            case 'east': floorX -= 1; break;
            case 'south': floorY -= 1; break;
            case 'west': floorX += 1; break;
        }
        
        // Ensure the floor position is within bounds
        floorX = Math.max(0, Math.min(floorX, this.width - 1));
        floorY = Math.max(0, Math.min(floorY, this.height - 1));
        
        // Force a floor tile at the inside position
        this.tiles[floorY][floorX] = 'floor';
        
        return {x, y};
    }

    // New 4-gate system with neighbor constraints
    generateConstrainedGates(game) {
        console.log('========= Generating 4 constrained gates ==========');
        
        const neighbors = this.getNeighboringSections(game);
        const gates = {};
        
        // North wall - constrained if south neighbor exists
        if (neighbors.north?.gates?.south) {
            gates.north = {
                x: neighbors.north.gates.south.x, 
                y: 0,
                constrained: true
            };
            console.log(`North gate constrained by neighbor: (${gates.north.x}, ${gates.north.y})`);
        } else {
            gates.north = {
                x: Math.floor(Math.random() * (this.width - 4)) + 2,
                y: 0,
                constrained: false
            };
            console.log(`North gate random: (${gates.north.x}, ${gates.north.y})`);
        }
        
        // South wall - constrained if north neighbor exists
        if (neighbors.south?.gates?.north) {
            gates.south = {
                x: neighbors.south.gates.north.x,
                y: this.height - 1,
                constrained: true
            };
            console.log(`South gate constrained by neighbor: (${gates.south.x}, ${gates.south.y})`);
        } else {
            gates.south = {
                x: Math.floor(Math.random() * (this.width - 4)) + 2,
                y: this.height - 1,
                constrained: false
            };
            console.log(`South gate random: (${gates.south.x}, ${gates.south.y})`);
        }
        
        // East wall - constrained if west neighbor exists
        if (neighbors.east?.gates?.west) {
            gates.east = {
                x: this.width - 1,
                y: neighbors.east.gates.west.y,
                constrained: true
            };
            console.log(`East gate constrained by neighbor: (${gates.east.x}, ${gates.east.y})`);
        } else {
            gates.east = {
                x: this.width - 1,
                y: Math.floor(Math.random() * (this.height - 4)) + 2,
                constrained: false
            };
            console.log(`East gate random: (${gates.east.x}, ${gates.east.y})`);
        }
        
        // West wall - constrained if east neighbor exists
        if (neighbors.west?.gates?.east) {
            gates.west = {
                x: 0,
                y: neighbors.west.gates.east.y,
                constrained: true
            };
            console.log(`West gate constrained by neighbor: (${gates.west.x}, ${gates.west.y})`);
        } else {
            gates.west = {
                x: 0,
                y: Math.floor(Math.random() * (this.height - 4)) + 2,
                constrained: false
            };
            console.log(`West gate random: (${gates.west.x}, ${gates.west.y})`);
        }
        
        // Place gates on the map and create gate objects
        this.placeConstrainedGates(gates);
        
        // Ensure all gates are accessible from rooms
        this.ensureGatesAccessibility();
        
        console.log('========= 4 constrained gates generated ==========');
    }
    
    // Helper function to check neighboring sections
    getNeighboringSections(game) {
        const worldManager = game.worldManager;
        if (!worldManager || !worldManager.sectionStates) {
            return {north: null, south: null, east: null, west: null};
        }
        
        return {
            north: worldManager.sectionStates[`${this.worldX}_${this.worldY + 1}`],
            south: worldManager.sectionStates[`${this.worldX}_${this.worldY - 1}`],
            east: worldManager.sectionStates[`${this.worldX + 1}_${this.worldY}`],
            west: worldManager.sectionStates[`${this.worldX - 1}_${this.worldY}`]
        };
    }
    
    // Helper function to place the 4 constrained gates
    placeConstrainedGates(gates) {
        // Clear existing gates
        this.gates = [];
        
        // Place each gate on the map and create gate objects
        Object.entries(gates).forEach(([direction, gateData]) => {
            const {x, y, constrained} = gateData;
            
            // Place the gate tile
            this.tiles[y][x] = 'gate';
            
            // Calculate target world coordinates
            let targetWorldX = this.worldX;
            let targetWorldY = this.worldY;
            
            switch(direction) {
                case 'north': targetWorldY += 1; break;
                case 'south': targetWorldY -= 1; break;
                case 'east': targetWorldX += 1; break;
                case 'west': targetWorldX -= 1; break;
            }
            
            // Create gate object
            const gateId = `gate_${Date.now()}_${Math.random()}_${this.worldX}_${this.worldY}_${direction}`;
            const gate = {
                id: gateId,
                x: x,
                y: y,
                direction: direction,
                sectionId: this.worldSectionId,
                nextSectionId: `${targetWorldX}_${targetWorldY}`,
                constrained: constrained,
                sections: [
                    {x: this.worldX, y: this.worldY},
                    {x: targetWorldX, y: targetWorldY}
                ]
            };
            
            this.gates.push(gate);
            console.log(`Placed ${direction} gate at (${x}, ${y}) leading to section (${targetWorldX}, ${targetWorldY})`);
        });
    }
}