// TargetingSystem - handles target selection for spells and ranged attacks
export class TargetingSystem {
    constructor(game) {
        this.game = game;
        this.isTargeting = false;
        this.currentTargetIndex = -1;
        this.validTargets = [];
        this.targetingCallback = null;
        this.targetingSpell = null;
        this.maxRange = 10;
    }
    
    /**
     * Start targeting mode
     */
    startTargeting(spell, callback) {
        this.isTargeting = true;
        this.targetingSpell = spell;
        this.targetingCallback = callback;
        this.maxRange = spell ? spell.range : 10;
        
        // Find all valid targets
        this.updateValidTargets();
        
        // Select first target if available
        if (this.validTargets.length > 0) {
            this.currentTargetIndex = 0;
            
            if (this.game.ui) {
                const target = this.getCurrentTarget();
                this.game.ui.addMessage(
                    `Targeting: ${this.targetingSpell.name}`,
                    '#0af'
                );
                this.game.ui.addMessage(
                    `Target: ${target.name} | T=cycle F=fire ESC=cancel`,
                    '#ff0'
                );
            }
        } else {
            if (this.game.ui) {
                this.game.ui.addMessage('No valid targets in range!', '#f55');
            }
            this.cancelTargeting();
        }
    }
    
    /**
     * Update list of valid targets based on current conditions
     */
    updateValidTargets() {
        this.validTargets = [];
        
        console.log('🎯 TargetingSystem.updateValidTargets: Searching for targets...');
        
        if (!this.game.player) {
            console.log('🎯 TargetingSystem: No player found!');
            return;
        }
        
        // For self-targeting spells (heal, shield, etc.), add player as target
        if (this.targetingSpell && 
            (this.targetingSpell.targetType === 'self' || 
             this.targetingSpell.type === 'healing' ||
             this.targetingSpell.type === 'defensive')) {
            this.validTargets.push({
                entity: this.game.player,
                x: this.game.player.x,
                y: this.game.player.y,
                distance: 0,
                name: 'You'
            });
        }
        
        // Get all monsters
        const monsters = this.game.monsters.filter(m => m.health > 0);
        console.log(`🎯 TargetingSystem: Found ${monsters.length} alive monsters`);
        
        // Filter by range and line of sight
        monsters.forEach(monster => {
            const distance = this.calculateDistance(
                this.game.player.x,
                this.game.player.y,
                monster.x,
                monster.y
            );
            
            // Check range
            if (distance > this.maxRange) return;
            
            // Check line of sight (if required)
            if (this.targetingSpell && this.targetingSpell.requiresLineOfSight) {
                if (!this.hasLineOfSight(
                    this.game.player.x,
                    this.game.player.y,
                    monster.x,
                    monster.y
                )) {
                    return;
                }
            }
            
            // Check if monster is visible (FOV)
            if (this.game.fov && !this.game.fov.isVisible(monster.x, monster.y)) {
                return;
            }
            
            // Valid target
            this.validTargets.push({
                entity: monster,
                x: monster.x,
                y: monster.y,
                distance: distance,
                name: monster.name
            });
        });
        
        // Sort by distance (closest first)
        this.validTargets.sort((a, b) => a.distance - b.distance);
        
        console.log(`🎯 TargetingSystem: Found ${this.validTargets.length} valid targets`);
        if (this.validTargets.length === 0) {
            console.log('🎯 TargetingSystem: ❌ NO MONSTERS FOUND IN RANGE!');
        } else {
            console.log('🎯 TargetingSystem: Valid targets:', this.validTargets.map(t => `${t.name} at (${t.x},${t.y}) dist=${Math.floor(t.distance)}`));
        }
    }
    
    /**
     * Cycle to next target
     */
    nextTarget() {
        console.log(`🎯 TargetingSystem.nextTarget: Called. Valid targets: ${this.validTargets.length}`);
        
        if (this.validTargets.length === 0) {
            console.log('🎯 TargetingSystem.nextTarget: ❌ NO VALID TARGETS!');
            if (this.game.ui) {
                this.game.ui.addMessage('No valid targets!', '#f55');
            }
            return;
        }
        
        this.currentTargetIndex = (this.currentTargetIndex + 1) % this.validTargets.length;
        
        const target = this.getCurrentTarget();
        console.log(`Next target: ${target ? target.name : 'none'}`);
        
        if (this.game.ui && target) {
            this.game.ui.addMessage(
                `→ ${target.name} (${Math.floor(target.distance)} tiles)`,
                '#ff0'
            );
        }
    }
    
    /**
     * Cycle to previous target
     */
    previousTarget() {
        if (this.validTargets.length === 0) return;
        
        this.currentTargetIndex--;
        if (this.currentTargetIndex < 0) {
            this.currentTargetIndex = this.validTargets.length - 1;
        }
        
        const target = this.getCurrentTarget();
        if (this.game.ui && target) {
            this.game.ui.addMessage(
                `Targeting ${target.name} (${Math.floor(target.distance)} tiles away)`,
                '#ff0'
            );
        }
    }
    
    /**
     * Get currently selected target
     */
    getCurrentTarget() {
        if (this.currentTargetIndex < 0 || this.currentTargetIndex >= this.validTargets.length) {
            return null;
        }
        return this.validTargets[this.currentTargetIndex];
    }
    
    /**
     * Confirm current target
     */
    confirmTarget() {
        const target = this.getCurrentTarget();
        
        if (!target) {
            if (this.game.ui) {
                this.game.ui.addMessage('No target selected!', '#f55');
            }
            this.cancelTargeting();
            return;
        }
        
        // Call the callback with target coordinates
        if (this.targetingCallback) {
            this.targetingCallback(target.x, target.y, target.entity);
        }
        
        // Exit targeting mode
        this.exitTargeting();
    }
    
    /**
     * Cancel targeting
     */
    cancelTargeting() {
        if (this.game.ui) {
            this.game.ui.addMessage('Targeting cancelled.', '#aaa');
        }
        this.exitTargeting();
    }
    
    /**
     * Exit targeting mode
     */
    exitTargeting() {
        this.isTargeting = false;
        this.currentTargetIndex = -1;
        this.validTargets = [];
        this.targetingCallback = null;
        this.targetingSpell = null;
    }
    
    /**
     * Calculate distance between two points
     */
    calculateDistance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }
    
    /**
     * Check if there's line of sight between two points
     * Uses Bresenham's line algorithm
     */
    hasLineOfSight(x0, y0, x1, y1) {
        const points = this.bresenhamLine(x0, y0, x1, y1);
        
        // Check each point in the line (except start and end)
        for (let i = 1; i < points.length - 1; i++) {
            const point = points[i];
            
            // Check if this tile blocks vision
            if (this.game.map[point.y] && this.game.map[point.y][point.x] === 'wall') {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Bresenham's line algorithm
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
     * Get targeting cursor position for rendering
     */
    getTargetingCursor() {
        if (!this.isTargeting) return null;
        
        const target = this.getCurrentTarget();
        if (!target) return null;
        
        return {
            x: target.x,
            y: target.y,
            symbol: '✕',
            color: '#ff0'
        };
    }
    
    /**
     * Check if currently in targeting mode
     */
    isInTargetingMode() {
        return this.isTargeting;
    }
}
