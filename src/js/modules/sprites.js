export class SpriteRenderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.tileSize = game.tileSize;
        this.sprites = {
            player: null,
            // wall/floor hold one sprite per theme, keyed by theme name.
            wall: { castle: null, cave: null, crypt: null },
            floor: { castle: null, cave: null, crypt: null },
            gate: null,
            key: null
        };
        this.loaded = false;
    }

    async loadSprites() {
        // Create simple canvas-based sprites
        this.sprites.player = this.createPlayerSprite();
        this.sprites.wall.castle = this.createCastleWallSprite();
        this.sprites.wall.cave = this.createCaveWallSprite();
        this.sprites.wall.crypt = this.createCryptWallSprite();
        this.sprites.floor.castle = this.createCastleFloorSprite();
        this.sprites.floor.cave = this.createCaveFloorSprite();
        this.sprites.floor.crypt = this.createCryptFloorSprite();
        this.sprites.gate = this.createGateSprite();
        this.sprites.key = this.createKeySprite();

        this.loaded = true;
    }

    // Which theme the current section is using; falls back to castle for
    // safety if a dungeon somehow lacks a theme.
    currentTheme() {
        return (this.game.dungeon && this.game.dungeon.theme) || 'castle';
    }
    
    createPlayerSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');
        
        // Draw player (simple @ sign in yellow)
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Draw character body
        ctx.fillStyle = 'gold';
        ctx.beginPath();
        ctx.arc(
            this.tileSize / 2,
            this.tileSize / 2,
            this.tileSize / 3,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Draw '@' symbol
        ctx.fillStyle = 'black';
        ctx.font = `bold ${this.tileSize / 1.5}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('@', this.tileSize / 2, this.tileSize / 2);
        
        return canvas;
    }
    
    // ========== Castle theme (baseline brick / dark stone) ==========

    createCastleWallSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');

        // Base color
        ctx.fillStyle = '#555';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Stone pattern
        ctx.fillStyle = '#444';

        // Draw brick pattern
        const brickHeight = this.tileSize / 4;
        const brickWidth = this.tileSize / 2;
        const mortar = 1;

        for (let y = 0; y < this.tileSize; y += brickHeight) {
            const offset = (Math.floor(y / brickHeight) % 2) * (brickWidth / 2);

            for (let x = -brickWidth / 2; x < this.tileSize; x += brickWidth) {
                ctx.fillRect(
                    x + offset + mortar,
                    y + mortar,
                    brickWidth - mortar * 2,
                    brickHeight - mortar * 2
                );
            }
        }

        // Random cracks
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 3; i++) {
            const x1 = Math.random() * this.tileSize;
            const y1 = Math.random() * this.tileSize;
            const x2 = x1 + (Math.random() * 10 - 5);
            const y2 = y1 + (Math.random() * 10 - 5);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        return canvas;
    }

    createCastleFloorSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');

        // Base color
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Stone texture
        ctx.fillStyle = '#272727';
        for (let i = 0; i < 8; i++) {
            const size = Math.random() * 4 + 2;
            const x = Math.random() * (this.tileSize - size);
            const y = Math.random() * (this.tileSize - size);
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Small details
        ctx.fillStyle = '#1d1d1d';
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * this.tileSize;
            const y = Math.random() * this.tileSize;
            const size = Math.random() * 2 + 1;
            ctx.fillRect(x, y, size, size);
        }

        return canvas;
    }

    // ========== Cave theme (rough warm stone / dirt) ==========

    createCaveWallSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');

        // Warm gray-brown base
        ctx.fillStyle = '#5a4a3a';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Irregular rocky lumps rather than bricks
        const rockColors = ['#6a5a48', '#4a3d30', '#75604a'];
        for (let i = 0; i < 14; i++) {
            ctx.fillStyle = rockColors[i % rockColors.length];
            const cx = Math.random() * this.tileSize;
            const cy = Math.random() * this.tileSize;
            const r = 2 + Math.random() * 4;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
        }

        // Faint horizontal strata
        ctx.strokeStyle = 'rgba(50, 40, 30, 0.35)';
        ctx.lineWidth = 0.6;
        for (let y = this.tileSize / 4; y < this.tileSize; y += this.tileSize / 4) {
            ctx.beginPath();
            ctx.moveTo(0, y + Math.random() * 2 - 1);
            ctx.lineTo(this.tileSize, y + Math.random() * 2 - 1);
            ctx.stroke();
        }

        return canvas;
    }

    createCaveFloorSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');

        // Dark packed dirt
        ctx.fillStyle = '#2f2418';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Loose pebbles and dirt clumps
        for (let i = 0; i < 12; i++) {
            ctx.fillStyle = i % 2 ? '#3a2d1e' : '#251c12';
            const size = Math.random() * 3 + 1;
            const x = Math.random() * (this.tileSize - size);
            const y = Math.random() * (this.tileSize - size);
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }

        return canvas;
    }

    // ========== Crypt theme (dark purple-gray stone, moss & cracks) ==========

    createCryptWallSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');

        // Deep purple-gray base
        ctx.fillStyle = '#383548';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Coarse block seams
        ctx.strokeStyle = '#1e1c28';
        ctx.lineWidth = 1;
        const blockH = this.tileSize / 3;
        for (let y = blockH; y < this.tileSize; y += blockH) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.tileSize, y);
            ctx.stroke();
        }
        // Staggered vertical seams
        for (let row = 0; row < 3; row++) {
            const offset = (row % 2) * (this.tileSize / 2);
            ctx.beginPath();
            ctx.moveTo(offset, row * blockH);
            ctx.lineTo(offset, (row + 1) * blockH);
            ctx.stroke();
        }

        // Moss patches
        ctx.fillStyle = 'rgba(74, 106, 90, 0.5)';
        for (let i = 0; i < 4; i++) {
            const cx = Math.random() * this.tileSize;
            const cy = Math.random() * this.tileSize;
            ctx.beginPath();
            ctx.arc(cx, cy, 2 + Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        return canvas;
    }

    createCryptFloorSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');

        // Deep purple-black flagstone
        ctx.fillStyle = '#1a1826';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);

        // Cracked flagstone seams
        ctx.strokeStyle = '#2c2838';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(0, this.tileSize / 2);
        ctx.lineTo(this.tileSize, this.tileSize / 2);
        ctx.moveTo(this.tileSize / 2, 0);
        ctx.lineTo(this.tileSize / 2, this.tileSize);
        ctx.stroke();

        // A jagged fracture line for character
        ctx.strokeStyle = '#0e0c16';
        ctx.beginPath();
        ctx.moveTo(2, 4);
        ctx.lineTo(this.tileSize * 0.4, this.tileSize * 0.35);
        ctx.lineTo(this.tileSize * 0.7, this.tileSize * 0.55);
        ctx.lineTo(this.tileSize - 2, this.tileSize - 4);
        ctx.stroke();

        return canvas;
    }
    
    createGateSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');
        
        // Base color (floor)
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Draw iron gate
        const barWidth = this.tileSize / 12;
        const gapWidth = this.tileSize / 6;
        
        // Draw vertical bars
        ctx.fillStyle = '#777';
        for (let x = barWidth; x < this.tileSize; x += barWidth + gapWidth) {
            ctx.fillRect(x, 0, barWidth, this.tileSize);
        }
        
        // Draw horizontal crossbars
        ctx.fillRect(0, this.tileSize / 3, this.tileSize, barWidth);
        ctx.fillRect(0, this.tileSize * 2 / 3, this.tileSize, barWidth);
        
        // Draw frame
        ctx.lineWidth = barWidth * 1.5;
        ctx.strokeStyle = '#555';
        ctx.strokeRect(barWidth/2, barWidth/2, this.tileSize - barWidth, this.tileSize - barWidth);
        
        // Add a lock
        ctx.fillStyle = '#FFD700'; // Gold
        ctx.beginPath();
        ctx.arc(this.tileSize / 2, this.tileSize * 0.66, this.tileSize / 10, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw a keyhole
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(this.tileSize / 2, this.tileSize * 0.66, this.tileSize / 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Add number tag for gate ID
        ctx.fillStyle = '#FFF';
        ctx.font = `bold ${this.tileSize/3}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('#', this.tileSize / 2, this.tileSize / 4);
        
        return canvas;
    }
    
    createKeySprite() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');
        
        // Base color (floor)
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Draw ornate key
        // Key color - more magical looking
        const gradient = ctx.createLinearGradient(0, 0, this.tileSize, this.tileSize);
        gradient.addColorStop(0, '#FFD700');   // Gold
        gradient.addColorStop(0.5, '#FFF8DC'); // Cornsilk
        gradient.addColorStop(1, '#DAA520');   // Goldenrod
        
        ctx.fillStyle = gradient;
        
        // Draw key handle (intricate design)
        ctx.beginPath();
        ctx.arc(
            this.tileSize / 2,
            this.tileSize / 3,
            this.tileSize / 5,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Inner circle for handle
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(
            this.tileSize / 2,
            this.tileSize / 3,
            this.tileSize / 10,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Return to gradient fill
        ctx.fillStyle = gradient;
        
        // Draw key shaft
        ctx.fillRect(
            this.tileSize / 2 - this.tileSize / 20,
            this.tileSize / 3,
            this.tileSize / 10,
            this.tileSize / 2
        );
        
        // Draw key teeth - more intricate design
        // Main teeth
        ctx.beginPath();
        ctx.moveTo(this.tileSize / 2 - this.tileSize / 6, this.tileSize * 0.65);
        ctx.lineTo(this.tileSize / 2 + this.tileSize / 6, this.tileSize * 0.65);
        ctx.lineTo(this.tileSize / 2 + this.tileSize / 4, this.tileSize * 0.75);
        ctx.lineTo(this.tileSize / 2 - this.tileSize / 4, this.tileSize * 0.75);
        ctx.closePath();
        ctx.fill();
        
        // Smaller teeth
        ctx.beginPath();
        ctx.moveTo(this.tileSize / 2 - this.tileSize / 8, this.tileSize * 0.8);
        ctx.lineTo(this.tileSize / 2 + this.tileSize / 8, this.tileSize * 0.8);
        ctx.lineTo(this.tileSize / 2 + this.tileSize / 6, this.tileSize * 0.85);
        ctx.lineTo(this.tileSize / 2 - this.tileSize / 6, this.tileSize * 0.85);
        ctx.closePath();
        ctx.fill();
        
        // Add magical glow effect
        const glowGradient = ctx.createRadialGradient(
            this.tileSize / 2, this.tileSize / 2, 0,
            this.tileSize / 2, this.tileSize / 2, this.tileSize / 1.5
        );
        glowGradient.addColorStop(0, 'rgba(255, 255, 200, 0.6)');
        glowGradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.2)');
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, this.tileSize, this.tileSize);
        
        // Add sparkles
        ctx.fillStyle = '#FFFFFF';
        
        // Multiple sparkles
        const sparklePositions = [
            {x: this.tileSize / 3, y: this.tileSize / 4, size: this.tileSize / 20},
            {x: this.tileSize * 2/3, y: this.tileSize / 3, size: this.tileSize / 25},
            {x: this.tileSize / 2, y: this.tileSize * 2/3, size: this.tileSize / 30}
        ];
        
        for (const sp of sparklePositions) {
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        return canvas;
    }
    
    renderTile(x, y, type, isVisible, isExplored) {
        if (!this.loaded) return;

        const screenX = x * this.tileSize;
        const screenY = y * this.tileSize;

        if (!isVisible && !isExplored) return;

        // Check if the tile is at the map edge (for perimeter visualization)
        const isMapEdge =
            (x === 0 || x === this.game.gridWidth - 1 ||
            y === 0 || y === this.game.gridHeight - 1) &&
            type === 'wall';

        // Draw the appropriate sprite based on tile type, picking the theme
        // variant for wall/floor. Themes now carry the per-section visual
        // differentiation (the old per-coord hue tint was removed).
        const theme = this.currentTheme();
        let sprite;
        switch (type) {
            case 'wall':
                sprite = this.sprites.wall[theme] || this.sprites.wall.castle;
                break;
            case 'floor':
                sprite = this.sprites.floor[theme] || this.sprites.floor.castle;
                break;
            case 'gate':
                sprite = this.sprites.gate;
                break;
            default:
                return;
        }

        // Draw with appropriate visibility
        if (!isVisible) {
            // Draw explored but not visible tiles in darker color
            this.ctx.globalAlpha = 0.5;
        }

        // Base rendering of the sprite
        this.ctx.drawImage(sprite, screenX, screenY, this.tileSize, this.tileSize);

        // Highlight map edges to make them more distinct
        if (isMapEdge && isVisible) {
            // Add a brighter color to edge walls
            this.ctx.globalAlpha = 0.2;
            this.ctx.fillStyle = '#8888ff';
            this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
            this.ctx.globalAlpha = 1.0;
        }
        
        // If this is a gate, check if we need to add a gate number or directional indicator
        if (type === 'gate' && isVisible && this.game.dungeon) {
            const gate = this.game.dungeon.getGateAt(x, y);
            if (gate) {
                // For world gates, show direction symbol
                if (gate.direction) {
                    // Choose direction indicator
                    let dirSymbol = '?';
                    switch(gate.direction) {
                        case 'north': dirSymbol = '↑'; break;
                        case 'east': dirSymbol = '→'; break;
                        case 'south': dirSymbol = '↓'; break;
                        case 'west': dirSymbol = '←'; break;
                    }
                    
                    // Draw directional indicator
                    this.ctx.fillStyle = '#FFF';
                    this.ctx.font = `bold ${this.tileSize/2}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(dirSymbol, screenX + this.tileSize / 2, screenY + this.tileSize / 2);
                    
                    // Show difficulty indicator based on target section
                    if (this.game.worldMap && this.game.worldMap.sectionDifficulty) {
                        const targetSection = gate.nextSectionId ; // gate.targetWorldSectionId;
                        const difficulty = this.game.worldMap.sectionDifficulty[targetSection] || '?';
                        
                        // Color code based on difficulty
                        if (difficulty === 1) this.ctx.fillStyle = '#5f5'; // Green
                        else if (difficulty <= 3) this.ctx.fillStyle = '#ff5'; // Yellow 
                        else if (difficulty <= 5) this.ctx.fillStyle = '#f85'; // Orange
                        else this.ctx.fillStyle = '#f55'; // Red
                        
                        // Draw difficulty indicator
                        this.ctx.font = `bold ${this.tileSize/4}px Arial`;
                        this.ctx.fillText(`Lv.${difficulty}`, screenX + this.tileSize / 2, screenY + this.tileSize * 0.8);
                    }
                } 
                // For regular gates (not world gates)
                else if (gate.id) {
                    // Add gate ID number
                    this.ctx.fillStyle = '#FFF';
                    this.ctx.font = `bold ${this.tileSize/3}px Arial`;
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(gate.id.toString(), screenX + this.tileSize / 2, screenY + this.tileSize / 4);
                    
                    // Add visual indicator for locked status
                    if (gate.locked) {
                        // Draw lock
                        this.ctx.fillStyle = '#FFD700'; // Gold
                        this.ctx.beginPath();
                        this.ctx.arc(screenX + this.tileSize / 2, screenY + this.tileSize * 0.66, this.tileSize / 10, 0, Math.PI * 2);
                        this.ctx.fill();
                    } else {
                        // Draw unlocked indicator
                        this.ctx.fillStyle = '#5f5';
                        this.ctx.beginPath();
                        this.ctx.arc(screenX + this.tileSize / 2, screenY + this.tileSize * 0.66, this.tileSize / 10, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }
            }
        }
        
        // Make gates more visually distinct
        if (type === 'gate') {
            // Draw a glowing effect around the gate
            if (isVisible) {
                // Visible gates get a bright glow
                this.ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'; // Gold glow
                this.ctx.fillRect(screenX - 2, screenY - 2, this.tileSize + 4, this.tileSize + 4);
                this.ctx.fillStyle = 'rgba(255, 215, 0, 0.6)'; // Stronger inner glow
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                
                // Draw the gate with a distinctive symbol
                this.ctx.fillStyle = '#FFD700'; // Gold color
                this.ctx.font = 'bold 20px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('⍟', screenX + this.tileSize/2, screenY + this.tileSize/2);
            } else if (isExplored || this.game.mapRevealed) {
                // Explored gates are more subtle but still distinct
                this.ctx.fillStyle = 'rgba(180, 180, 100, 0.4)';
                this.ctx.fillRect(screenX, screenY, this.tileSize, this.tileSize);
                this.ctx.fillStyle = '#AA9';
                this.ctx.font = 'bold 20px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('⍟', screenX + this.tileSize/2, screenY + this.tileSize/2);
            }
            
            // Gates no longer show text labels
            return; // Skip the normal rendering for gates
        }
        
        this.ctx.globalAlpha = 1.0; // Reset alpha
    }
    
    renderPlayer(x, y) {
        if (!this.loaded) return;
        
        const screenX = x * this.tileSize;
        const screenY = y * this.tileSize;
        
        this.ctx.drawImage(
            this.sprites.player,
            screenX,
            screenY,
            this.tileSize,
            this.tileSize
        );
    }
}