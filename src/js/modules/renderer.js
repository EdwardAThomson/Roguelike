// New module for rendering the game

export class Renderer {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
    }

    render() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        
        // Fill background with black
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        
        // Draw the dungeon
        this.renderDungeon();
        
        // Draw items on ground 
        this.renderItems();
        
        // Draw monsters
        this.renderMonsters();
        
        // Draw player
        this.renderPlayer();
        
        // Draw gate indicators (when map is revealed or debug mode is on)
        if (this.game.stateManager.mapRevealed) {
            this.renderGateIndicators();
        }
        
        // Draw section ID in top left corner
        this.renderSectionID();
    }

    renderDungeon() {
        // Only render the section of the dungeon that's visible in the viewport
        const startX = this.game.camera.x;
        const startY = this.game.camera.y;
        const endX = Math.min(this.game.gridWidth, startX + this.game.camera.viewportWidth);
        const endY = Math.min(this.game.gridHeight, startY + this.game.camera.viewportHeight);
        
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                // Calculate viewport coordinates
                const viewportX = x - startX;
                const viewportY = y - startY;
                
                const tileType = this.game.map[y][x];
                const key = `${x},${y}`;
                const isVisible = this.game.fov.visible.has(key);
                const isExplored = this.game.fov.explored.has(key);
                
                // Render tile using sprite renderer
                if (this.game.sprites) {
                    // Add mapRevealed check here
                    const shouldRender = this.game.stateManager.mapRevealed || isVisible || isExplored;
                    if (shouldRender) {
                        // When map is revealed, we still want to distinguish between
                        // currently visible tiles and just revealed tiles
                        const isTrueVisible = isVisible;
                        this.game.sprites.renderTile(viewportX, viewportY, tileType, isTrueVisible, true);
                    }
                }
            }
        }
    }


    // Old Function: Render items on the ground
    renderItemsOld(ctx, mapRevealed = false) {
        // Get the game instance
        const game = this.game;
        
        // Only render items that are within the viewport
        for (const groundItem of this.game.itemManager.itemsOnGround) {

            //console.log("Renderer: Rendering item", groundItem, 'at', groundItem.x, groundItem.y);
            // Calculate item's position in viewport coordinates
            const viewportX = groundItem.x - this.game.camera.x;
            const viewportY = groundItem.y - this.game.camera.y;


            //console.log("Renderer:", groundItem.x, groundItem.y, this.game.camera.x, this.game.camera.y, viewportX, viewportY);
            //console.log("Renderer: Rendering item", groundItem, "at", viewportX, viewportY);
            
            // Only render if in viewport and visible to player
            if (viewportX >= 0 && viewportX < this.game.camera.viewportWidth &&
                viewportY >= 0 && viewportY < this.game.camera.viewportHeight) {
                

                console.log("Renderer: Rendering item", groundItem, "at", viewportX, viewportY);


                const key = `${groundItem.x},${groundItem.y}`;
                const isVisible = game.fov.visible.has(key) || mapRevealed; // Add mapRevealed check
                
                console.log("Renderer: Rendering item", groundItem, "at", viewportX, viewportY, "isVisible:", isVisible);

                if (isVisible) {
                    // Render the item - FIX: Use icon instead of symbol
                    ctx.fillStyle = groundItem.color || '#ff0';
                    ctx.font = 'bold 16px monospace';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    const centerX = viewportX * game.tileSize + game.tileSize / 2;
                    const centerY = viewportY * game.tileSize + game.tileSize / 2;
                    ctx.fillText(groundItem.item.icon || '?', centerX, centerY);
                }
            }
        }
    }


    // Render items on the ground
    renderItems() {
        // Clean up invalid items before rendering
        if (this.game.itemManager && typeof this.game.itemManager.cleanupInvalidItems === 'function') {
            this.game.itemManager.cleanupInvalidItems();
        }
        
        try {
            //console.log("Renderer.renderItems called");
            
            // Check if ItemManager exists
            if (!this.game.itemManager) {
                console.warn("Renderer: No itemManager available");
                return;
            }
            
            // console.log("Renderer: ItemManager found", this.game.itemManager);
            
            // Check if itemsOnGround exists
            if (!this.game.itemManager.itemsOnGround) {
                console.warn("Renderer: itemsOnGround not found on itemManager");
                return;
            }
            
            // Get the items on the ground
            const itemsOnGround = this.game.itemManager.itemsOnGround;
            // console.log("Renderer: itemsOnGround =", itemsOnGround);
            
            // Skip if no items
            if (!Array.isArray(itemsOnGround)) {
                console.warn("Renderer: itemsOnGround is not an array");
                return;
            }
            
            // if (itemsOnGround.length === 0) {
            //     console.log("Renderer: No items on ground to render");
            //     return;
            // }
            
            // console.log(`Renderer: Found ${itemsOnGround.length} items to render`);
            
            // Log the first item for inspection
            // console.log("Renderer: First item sample:", JSON.stringify(itemsOnGround[0]));
            
            // Get camera position
            const cameraX = this.game.camera ? this.game.camera.x : this.game.cameraX;
            const cameraY = this.game.camera ? this.game.camera.y : this.game.cameraY;
            
            // Get map revealed status
            const mapRevealed = this.game.stateManager ? this.game.stateManager.mapRevealed : this.game.mapRevealed;
            
            // Render each item
            for (const groundItem of itemsOnGround) {
                // Skip if outside viewport
                const viewportX = groundItem.x - cameraX;
                const viewportY = groundItem.y - cameraY;
                
                // Skip if outside visible area
                if (viewportX < 0 || viewportX >= this.game.camera.viewportWidth ||
                    viewportY < 0 || viewportY >= this.game.camera.viewportHeight) {
                    continue;
                }
                
                // Check visibility
                const key = `${groundItem.x},${groundItem.y}`;
                const isVisible = mapRevealed || 
                                  (this.game.fov && this.game.fov.visible && this.game.fov.visible.has(key));
                
                if (!isVisible) {
                    continue;
                }
                
                // Render the item
                this.renderSingleItem(groundItem, viewportX, viewportY);
            }
        } catch (error) {
            console.error("Error in renderItems:", error);
            
            // Try to identify which item caused the error
            if (this.game.itemManager && this.game.itemManager.itemsOnGround) {
                // console.log("Dumping all item data for debugging:");
                // console.log(JSON.stringify(this.game.itemManager.itemsOnGround));
            }
        }
    }

    validateItemData(item) {
        if (!item) {
            console.error("Item is null or undefined");
            return false;
        }
        
        if (!item.type) {
            console.error("Item has no type:", item);
            return false;
        }
        
        if (!item.name) {
            console.error(`Item of type ${item.type} has no name:`, item);
            return false;
        }
        
        return true;
    }

    renderSingleItem(groundItem, viewportX, viewportY) {
        // Check if groundItem has a valid item
        if (!groundItem || !groundItem.item) {
            console.warn(`Cannot render item at (${groundItem?.x}, ${groundItem?.y}) - missing item data`);
            
            // Draw a warning indicator (red X) at the position
            const tileSize = this.game.tileSize;
            const x = viewportX * tileSize;
            const y = viewportY * tileSize;
            
            this.ctx.strokeStyle = 'red';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + tileSize, y + tileSize);
            this.ctx.moveTo(x + tileSize, y);
            this.ctx.lineTo(x, y + tileSize);
            this.ctx.stroke();
            
            return;
        }
        
        const item = groundItem.item;
        
        // Validate the item
        if (!item) {
            console.error("renderSingleItem: No item data in groundItem", groundItem);
            return;
        }
        
        // Check for type property
        if (!item.type) {
            console.error("renderSingleItem: Item missing 'type' property", item);
            return;
        }
        
        // Log the item type being rendered
        // console.log(`Rendering item of type: ${item.type}`, item);
        
        // First, try to use icon from item database
        let iconRendered = false;
        
        if (this.game.itemManager && this.game.itemManager.itemDB) {
            // && 
            // typeof this.game.itemManager.itemDB.getItemIcon === 'function') {
            


            // const icon = this.game.itemManager.itemDB.getItemIcon(item.id || item.type);
            const icon = item.icon;


            // console.log("Renderer: icon", icon);

            this.ctx.fillStyle = groundItem.item.color || '#ff0';
            this.ctx.font = 'bold 16px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            const centerX = viewportX * this.game.tileSize + this.game.tileSize / 2;
            const centerY = viewportY * this.game.tileSize + this.game.tileSize / 2;
            this.ctx.fillText(icon || '?', centerX, centerY);


            // Draw colored background
            // this.ctx.fillStyle = icon.color;

            // Draw colored background
            // this.ctx.fillStyle = icon.color;
            // this.ctx.fillRect(viewportX * this.game.tileSize + this.game.tileSize * 0.2, viewportY * this.game.tileSize + this.game.tileSize * 0.2, 
            //                 this.game.tileSize * 0.6, this.game.tileSize * 0.6);


            // Draw symbol
            // this.ctx.font = `bold ${Math.floor(this.game.tileSize * 0.5)}px monospace`;
            // this.ctx.fillStyle = '#ffffff';
            // this.ctx.textAlign = 'center';
            // this.ctx.textBaseline = 'middle';
            // this.ctx.fillText(icon.symbol, viewportX * this.game.tileSize + this.game.tileSize/2, viewportY * this.game.tileSize + this.game.tileSize/2);
            
            iconRendered = true;                        


            
            if (icon) {
                if (icon instanceof Image) {
                    this.ctx.drawImage(icon, viewportX * this.game.tileSize, viewportY * this.game.tileSize, this.game.tileSize, this.game.tileSize);
                    iconRendered = true;
                } else if (icon){ 
                    
                    // && icon.color) {

                    // console.log("Renderer: icon", icon);
                    // // Draw colored background
                    // this.ctx.fillStyle = icon.color;
                    // this.ctx.fillRect(viewportX * this.game.tileSize + this.game.tileSize * 0.2, viewportY * this.game.tileSize + this.game.tileSize * 0.2, 
                    //                  this.game.tileSize * 0.6, this.game.tileSize * 0.6);
                    
                    // // Draw symbol
                    // this.ctx.font = `bold ${Math.floor(this.game.tileSize * 0.5)}px monospace`;
                    // this.ctx.fillStyle = '#ffffff';
                    // this.ctx.textAlign = 'center';
                    // this.ctx.textBaseline = 'middle';
                    // this.ctx.fillText(icon.symbol, viewportX * this.game.tileSize + this.game.tileSize/2, viewportY * this.game.tileSize + this.game.tileSize/2);
                    
                    // iconRendered = true;
                }
            }
        }
        
        // Fallback if no icon was rendered
        // if (!iconRendered) {
        //     // Choose color and symbol based on item type
        //     let color, symbol;
            
        //     switch (item.type) {
        //         case 'weapon':
        //             console.log(`Rendering weapon: ${item.name}`);
        //             color = '#e74c3c';
        //             symbol = '⚔️';
        //             break;
        //         case 'armor':
        //             // console.log(`Rendering armor: ${item.name}`);
        //             color = '#3498db';
        //             symbol = '🛡️';
        //             break;
        //         case 'potion':
        //             color = '#2ecc71';
        //             symbol = '⚗️';
        //             break;
        //         case 'scroll':
        //             color = '#f1c40f';
        //             symbol = '📜';
        //             break;
        //         case 'food':
        //             color = '#e67e22';
        //             symbol = '🍖';
        //             break;
        //         case 'gem':
        //             color = '#9b59b6';
        //             symbol = '💎';
        //             break;
        //         default:
        //             // console.warn(`Unknown item type: ${item.type}`);
        //             color = '#bdc3c7';
        //             symbol = '?';
        //     }
            
        //     // Draw background
        //     this.ctx.fillStyle = color;
        //     this.ctx.fillRect(viewportX * this.game.tileSize + this.game.tileSize * 0.25, viewportY * this.game.tileSize + this.game.tileSize * 0.25, 
        //                      this.game.tileSize * 0.5, this.game.tileSize * 0.5);
            
        //     // Draw text if symbol isn't an emoji
        //     if (symbol.length === 1) {
        //         this.ctx.font = `bold ${Math.floor(this.game.tileSize * 0.4)}px monospace`;
        //         this.ctx.fillStyle = '#ffffff';
        //         this.ctx.textAlign = 'center';
        //         this.ctx.textBaseline = 'middle';
        //         this.ctx.fillText(symbol, viewportX * this.game.tileSize + this.game.tileSize/2, viewportY * this.game.tileSize + this.game.tileSize/2);
        //     }
        // }
    }

    renderMonsters() {
        if (!this.game.monsters) return;

        for (const monster of this.game.monsters) {
            // Calculate monster's position in viewport coordinates
            const viewportX = monster.x - this.game.camera.x;
            const viewportY = monster.y - this.game.camera.y;
            
            // Only render monster if in viewport and visible to player
            if (this.game.camera.isInViewport(monster.x, monster.y)) {
                const key = `${monster.x},${monster.y}`;
                const isVisible = this.game.fov.visible.has(key) || this.game.stateManager.mapRevealed;
                
                if (isVisible) {
                    // Render monster (for now, just a colored rectangle)
                    this.ctx.fillStyle = monster.color;
                    this.ctx.font = 'bold 18px monospace';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    const centerX = viewportX * this.game.tileSize + this.game.tileSize / 2;
                    const centerY = viewportY * this.game.tileSize + this.game.tileSize / 2;
                    this.ctx.fillText(monster.symbol, centerX, centerY);
                }
            }
        }
    }

    renderPlayer() {
        if (!this.game.player) return;
        
        // Calculate player's position in viewport coordinates
        const viewportPos = this.game.camera.worldToViewport(this.game.player.x, this.game.player.y);
        
        // Only render player if in viewport
        if (this.game.camera.isInViewport(this.game.player.x, this.game.player.y)) {
            this.game.sprites.renderPlayer(viewportPos.x, viewportPos.y);
        }
    }

    renderGateIndicators() {
        if (!this.game.dungeon || !this.game.dungeon.gates || !this.game.player) return;
        
        const margin = 30; // Margin from edge of screen
        const indicatorSize = 15;
        
        for (const gate of this.game.dungeon.gates) {
            // Calculate vector from player to gate
            const dx = gate.x - this.game.player.x;
            const dy = gate.y - this.game.player.y;
            
            // Get the screen coordinates for the player
            const playerScreenX = (this.game.player.x - this.game.camera.x) * this.game.tileSize + this.game.tileSize/2;
            const playerScreenY = (this.game.player.y - this.game.camera.y) * this.game.tileSize + this.game.tileSize/2;
            
            // Is the gate on screen?
            const gateOnScreen = this.game.camera.isInViewport(gate.x, gate.y);
            
            // If gate is on screen, we don't need an indicator
            if (gateOnScreen) continue;
            
            // Calculate angle from player to gate
            const angle = Math.atan2(dy, dx);
            
            // Calculate position for the indicator at the screen edge
            let indicatorX, indicatorY;
            
            // Viewport boundaries in screen coordinates
            const minScreenX = margin;
            const maxScreenX = this.game.canvas.width - margin;
            const minScreenY = margin;
            const maxScreenY = this.game.canvas.height - margin;
            
            // Default to angle direction (this will be adjusted for screen edge)
            const radius = Math.min(this.game.canvas.width, this.game.canvas.height) / 2 - margin;
            indicatorX = playerScreenX + Math.cos(angle) * radius;
            indicatorY = playerScreenY + Math.sin(angle) * radius;
            
            // Clamp to screen edges
            indicatorX = Math.max(minScreenX, Math.min(maxScreenX, indicatorX));
            indicatorY = Math.max(minScreenY, Math.min(maxScreenY, indicatorY));
            
            // Draw the indicator with a direction for the gate
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(indicatorX, indicatorY, indicatorSize/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw an arrow pointing in the direction of the gate
            this.ctx.strokeStyle = '#FFD700';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(indicatorX, indicatorY);
            this.ctx.lineTo(
                indicatorX + Math.cos(angle) * indicatorSize,
                indicatorY + Math.sin(angle) * indicatorSize
            );
            this.ctx.stroke();
            
            // Draw the gate direction as text
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(gate.direction.charAt(0).toUpperCase(), indicatorX, indicatorY);
        }
    }

    renderSectionID() {
        // console.log("Renderer: renderSectionID called");
        
        const worldX = this.game.worldX;
        const worldY = this.game.worldY;

        const sectionId = `${worldX}_${worldY}`;
        // console.log("Renderer: renderSectionID: sectionId =", sectionId);


        // if (this.game.worldMap && this.game.worldMap.currentSectionId) {

            // console.log("Renderer: renderSectionID: this.game.worldMap.currentSectionId =", this.game.worldMap.currentSectionId);

            this.ctx.font = 'bold 24px Arial';
            this.ctx.fillStyle = '#ffff00'; // Bright yellow
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText(`Section (x: ${worldX}, y: ${worldY})`, 10, 10);
            
            // Also show area if applicable
            if (this.game.dungeonArea > 1) {
                this.ctx.fillText(`Area: ${this.game.dungeonArea}`, 10, 40);
            }
        // }
    }
} 