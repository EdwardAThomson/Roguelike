// Projectile class - handles all ranged attacks (spells, arrows, etc.)
export class Projectile {
    constructor(config) {
        // Source and target
        this.sourceX = config.sourceX;
        this.sourceY = config.sourceY;
        this.targetX = config.targetX;
        this.targetY = config.targetY;
        this.source = config.source; // Entity that created this projectile
        
        // Projectile type and damage
        this.type = config.type || 'magical'; // 'magical', 'physical', 'utility'
        this.damageType = config.damageType || 'arcane'; // 'fire', 'ice', 'lightning', 'arcane', 'physical', 'healing'
        this.damage = config.damage || 0;
        
        // Visual properties
        this.symbol = config.symbol || '•';
        this.color = config.color || '#fff';
        this.name = config.name || 'Projectile';
        
        // Behavior properties
        this.aoeRadius = config.aoeRadius || 0; // 0 = single target, >0 = area effect
        this.piercing = config.piercing || false; // Does it pass through enemies?
        this.homing = config.homing || false; // Does it track target?
        this.speed = config.speed || 1; // Tiles per animation frame
        
        // Status effects to apply on hit
        this.effects = config.effects || []; // Array of {type, duration, power}
        
        // Animation state
        this.currentX = this.sourceX;
        this.currentY = this.sourceY;
        this.path = []; // Will be calculated
        this.pathIndex = 0;
        this.active = true;
        this.hitTargets = []; // Track what we've hit (for piercing)
    }
    
    /**
     * Calculate the path this projectile will take
     * Uses Bresenham's line algorithm for straight-line projectiles
     */
    calculatePath() {
        this.path = this.bresenhamLine(this.sourceX, this.sourceY, this.targetX, this.targetY);
        // Remove the source position (don't want to hit ourselves)
        if (this.path.length > 0 && this.path[0].x === this.sourceX && this.path[0].y === this.sourceY) {
            this.path.shift();
        }
    }
    
    /**
     * Bresenham's line algorithm - creates a line between two points
     */
    bresenhamLine(x0, y0, x1, y1) {
        const points = [];
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;
        
        let x = x0;
        let y = y0;
        
        while (true) {
            points.push({ x, y });
            
            if (x === x1 && y === y1) break;
            
            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x += sx;
            }
            if (e2 < dx) {
                err += dx;
                y += sy;
            }
        }
        
        return points;
    }
    
    /**
     * Update projectile position (called each animation frame)
     * Returns true if projectile is still active, false if it should be removed
     */
    update() {
        if (!this.active || this.pathIndex >= this.path.length) {
            this.active = false;
            return false;
        }
        
        // Move to next position in path
        const nextPos = this.path[this.pathIndex];
        this.currentX = nextPos.x;
        this.currentY = nextPos.y;
        this.pathIndex++;
        
        return true;
    }
    
    /**
     * Get current position
     */
    getPosition() {
        return { x: this.currentX, y: this.currentY };
    }
    
    /**
     * Check if projectile has reached its destination
     */
    hasReachedTarget() {
        return this.pathIndex >= this.path.length;
    }
    
    /**
     * Deactivate this projectile
     */
    deactivate() {
        this.active = false;
    }
    
    /**
     * Check if this projectile has already hit a specific target
     */
    hasHitTarget(target) {
        return this.hitTargets.includes(target);
    }
    
    /**
     * Mark a target as hit
     */
    markTargetHit(target) {
        this.hitTargets.push(target);
    }
}
