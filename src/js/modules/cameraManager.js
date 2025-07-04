// New module for managing the camera

export class CameraManager {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.viewportWidth = Math.min(game.gridWidth, 40);
        this.viewportHeight = Math.min(game.gridHeight, 30);
    }

    update() {
        if (!this.game.player) return;
        
        // Center camera on player
        this.x = Math.max(0, Math.min(
            this.game.gridWidth - this.viewportWidth, 
            this.game.player.x - Math.floor(this.viewportWidth / 2)
        ));
        
        this.y = Math.max(0, Math.min(
            this.game.gridHeight - this.viewportHeight, 
            this.game.player.y - Math.floor(this.viewportHeight / 2)
        ));
    }

    isInViewport(x, y) {
        const viewportX = x - this.x;
        const viewportY = y - this.y;
        
        return viewportX >= 0 && viewportX < this.viewportWidth &&
               viewportY >= 0 && viewportY < this.viewportHeight;
    }

    worldToViewport(x, y) {
        return {
            x: x - this.x,
            y: y - this.y
        };
    }
} 