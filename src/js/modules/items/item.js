export class Item {
    constructor(options = {}) {
        this.id = options.id || 'unknown';
        this.name = options.name || 'Unknown Item';
        this.description = options.description || '';
        this.type = options.type || 'misc'; // weapon, armor, potion, scroll, misc
        this.rarity = options.rarity || 'common'; // common, uncommon, rare, epic, legendary
        this.slot = options.slot || null; // head, body, legs, weapon, offhand, ring, amulet
        this.value = options.value || 0; // Gold value
        this.icon = options.icon || '?'; // ASCII or emoji representation
        this.color = options.color || '#fff';
        this.canUse = options.canUse || false;
        this.canEquip = options.canEquip || false;
        this.stackable = options.stackable || false;
        this.quantity = options.quantity || 1;
        this.stats = options.stats || {};
    }
    
    use(entity, game = null) {
        if (this.canUse) {
            // Special handling for gate keys
            if (this.type === 'key' && this.gateId && game) {
                // Check if player is standing next to a gate
                const directions = [
                    {dx: 0, dy: -1}, // up
                    {dx: 1, dy: 0},  // right
                    {dx: 0, dy: 1},  // down
                    {dx: -1, dy: 0}  // left
                ];
                
                // Check adjacent tiles for gates
                for (const dir of directions) {
                    const checkX = entity.x + dir.dx;
                    const checkY = entity.y + dir.dy;
                    
                    // Check if this position has a gate
                    if (game.dungeon.isGateAt(checkX, checkY)) {
                        const gate = game.dungeon.getGateAt(checkX, checkY);
                        
                        // Only unlock if it's the right key for this gate
                        if (gate && gate.id === this.gateId && gate.locked) {
                            // Unlock the gate and create connecting corridor
                            game.dungeon.unlockGate(gate.id);
                            
                            // Update the player's FOV to see the newly opened area
                            game.updateFOV();
                            
                            // Show success message
                            game.ui.addMessage(`You unlock Gate ${gate.id} with the ${this.name}!`, "#FFD700");
                            game.ui.addMessage("The gate opens, revealing a new section of the dungeon!", "#0FF");
                            
                            return true; // Key was used correctly
                        } else if (gate && gate.id !== this.gateId) {
                            // Wrong key for this gate
                            game.ui.addMessage(`This key doesn't fit Gate ${gate.id}.`, "#AAA");
                            return false; // Key wasn't consumed
                        } else if (gate && !gate.locked) {
                            // Gate already unlocked
                            game.ui.addMessage("The gate is already unlocked.", "#AAA");
                            return false; // Key wasn't consumed
                        }
                    }
                }
                
                game.ui.addMessage("There is no gate nearby to unlock.", "#AAA");
                return false; // Key wasn't consumed
            }
            
            // Default behavior for other items
            console.log(`${entity.name} uses ${this.name}`);
            return true; // Indicates item was used
        }
        
        return false;
    }
    
    equip(entity) {
        if (this.canEquip && this.slot) {
            // Default behavior - override in subclasses
            console.log(`${entity.name} equips ${this.name}`);
            return true; // Indicates item was equipped
        }
        return false;
    }
    
    unequip(entity) {
        if (this.canEquip && this.slot) {
            // Default behavior - override in subclasses
            console.log(`${entity.name} unequips ${this.name}`);
            return true; // Indicates item was unequipped
        }
        return false;
    }
    
    // Get a copy of the item
    clone() {
        return new Item({
            id: this.id,
            name: this.name,
            description: this.description,
            type: this.type,
            rarity: this.rarity,
            slot: this.slot,
            value: this.value,
            icon: this.icon,
            color: this.color,
            canUse: this.canUse,
            canEquip: this.canEquip,
            stackable: this.stackable,
            quantity: this.quantity,
            stats: {...this.stats}
        });
    }
    
    // Get stat description
    getStatDescription() {
        if (Object.keys(this.stats).length === 0) {
            return '';
        }
        
        let desc = '';
        
        for (const [statName, value] of Object.entries(this.stats)) {
            const formattedValue = value >= 0 ? `+${value}` : value;
            
            switch(statName) {
                case 'strength':
                    desc += `${formattedValue} Strength\n`;
                    break;
                case 'dexterity':
                    desc += `${formattedValue} Dexterity\n`;
                    break;
                case 'constitution':
                    desc += `${formattedValue} Constitution\n`;
                    break;
                case 'intelligence':
                    desc += `${formattedValue} Intelligence\n`;
                    break;
                case 'maxHealth':
                    desc += `${formattedValue} Max Health\n`;
                    break;
                case 'maxMana':
                    desc += `${formattedValue} Max Mana\n`;
                    break;
                case 'attackPower':
                    desc += `${formattedValue} Attack Power\n`;
                    break;
                case 'defense':
                    desc += `${formattedValue} Defense\n`;
                    break;
                case 'criticalChance':
                    desc += `${formattedValue}% Critical Chance\n`;
                    break;
                case 'healAmount':
                    desc += `Heals ${value} HP\n`;
                    break;
                case 'manaRestore':
                    desc += `Restores ${value} MP\n`;
                    break;
                default:
                    desc += `${formattedValue} ${statName}\n`;
            }
        }
        
        return desc.trim();
    }
    
    // Get full item description including stats
    getFullDescription() {
        let desc = this.description;
        const statDesc = this.getStatDescription();
        
        if (statDesc) {
            desc += '\n\n' + statDesc;
        }
        
        if (this.canEquip) {
            desc += `\n\nEquip: ${this.slot}`;
        }
        
        if (this.canUse) {
            desc += '\n\nRight-click to use';
        }
        
        return desc;
    }
}