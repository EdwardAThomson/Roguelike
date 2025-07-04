// New module for managing the FOV

export class FOVManager {
    constructor(game) {
        this.game = game;
        this.radius = 8;
        this.visible = new Set();
        this.explored = new Set();
        this.worldExplorationMemory = {};
    }

    update() {
        if (!this.game.player) return;
        
        // Clear the currently visible tiles but keep explored tiles
        this.visible = new Set();
        
        // Calculate which tiles are visible to the player
        const px = this.game.player.x;
        const py = this.game.player.y;
        
        // Simple circular FOV for now
        for (let y = Math.max(0, py - this.radius); y <= Math.min(this.game.gridHeight - 1, py + this.radius); y++) {
            for (let x = Math.max(0, px - this.radius); x <= Math.min(this.game.gridWidth - 1, px + this.radius); x++) {
                // Calculate distance to player
                const dx = x - px;
                const dy = y - py;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Check if tile is within FOV radius and has line of sight
                if (distance <= this.radius && this.hasLineOfSight(px, py, x, y)) {
                    const key = `${x},${y}`;
                    this.visible.add(key);
                    this.explored.add(key);
                }
            }
        }
        
        // Second pass to make walls adjacent to visible floor tiles also visible
        this.addAdjacentWalls();
    }

    hasLineOfSight(x0, y0, x1, y1) {
        // Simple Bresenham's line algorithm for line of sight check
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        
        while (x0 !== x1 || y0 !== y1) {
            if (x0 === x1 && y0 === y1) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
            
            // If we hit a wall, return false
            if (this.game.map[y0] && this.game.map[y0][x0] === 'wall') {
                return false;
            }
        }
        
        return true;
    }

    addAdjacentWalls() {
        const adjacentWalls = new Set();
        
        // Check all currently visible tiles
        for (const visibleKey of this.visible) {
            const [x, y] = visibleKey.split(',').map(Number);
            
            // Check all 8 adjacent tiles
            const adjacentDirections = [
                [-1, -1], [0, -1], [1, -1],
                [-1, 0],           [1, 0],
                [-1, 1],  [0, 1],  [1, 1]
            ];
            
            for (const [dx, dy] of adjacentDirections) {
                const nx = x + dx;
                const ny = y + dy;
                
                // Skip if out of bounds
                if (nx < 0 || nx >= this.game.gridWidth || ny < 0 || ny >= this.game.gridHeight) {
                    continue;
                }
                
                // If this is a wall and not already visible, add it to adjacentWalls
                if (this.game.map[ny][nx] === 'wall') {
                    const adjacentKey = `${nx},${ny}`;
                    adjacentWalls.add(adjacentKey);
                }
            }
        }
        
        // Add all adjacent walls to visible and explored sets
        for (const wallKey of adjacentWalls) {
            this.visible.add(wallKey);
            this.explored.add(wallKey);
        }
    }

    switchToSection(sectionId) {
        // Initialize exploration memory for this section if it doesn't exist
        if (!this.worldExplorationMemory[sectionId]) {
            this.worldExplorationMemory[sectionId] = new Set();
        }
        
        // Set the current exploration set to this section's memory
        this.explored = this.worldExplorationMemory[sectionId];
        
        // Clear visible tiles (will be recalculated in next frame)
        this.visible = new Set();
    }

    isTileVisible(x, y) {
        return this.visible.has(`${x},${y}`) || this.game.stateManager.mapRevealed;
    }

    isTileExplored(x, y) {
        return this.explored.has(`${x},${y}`) || this.game.stateManager.mapRevealed;
    }
} 