// Spellbook - manages known spells and spell unlocking
export class Spellbook {
    constructor(spellDatabase = null) {
        this.spellDatabase = spellDatabase; // Reference to game's SpellDatabase
        this.knownSpellIds = new Set(); // Just store IDs, not full data
        this.spellSlots = new Array(5).fill(null); // Hotbar slots: Q, R, F, V, X
        this.slotKeys = ['Q', 'R', 'F', 'V', 'X']; // Key labels for UI
        
        // Initialize with Magic Dart unlocked by default in Q slot
        this.unlockSpell('magic_dart', 0); // Q key (index 0)
    }
    
    // Set spell database reference (called after construction if needed)
    setSpellDatabase(spellDatabase) {
        this.spellDatabase = spellDatabase;
    }
    
    /**
     * Unlock a spell and optionally assign it to a hotbar slot
     * @param {string} spellId - The spell ID from SpellDatabase
     * @param {number} slotIndex - Optional hotbar slot (0-8 for keys 1-9)
     */
    unlockSpell(spellId, slotIndex = null) {
        // Verify spell exists in database
        const spellData = this.getSpellData(spellId);
        
        if (!spellData) {
            console.error(`Spellbook: Unknown spell ID: ${spellId}`);
            return false;
        }
        
        // Add spell ID to known spells (just the ID, not the data)
        this.knownSpellIds.add(spellId);
        console.log(`✨ Spellbook: Unlocked spell: ${spellData.name}`);
        
        // Assign to hotbar slot if specified
        if (slotIndex !== null && slotIndex >= 0 && slotIndex < 5) {
            this.spellSlots[slotIndex] = spellId;
            console.log(`✨ Spellbook: Assigned ${spellData.name} to slot ${this.slotKeys[slotIndex]}`);
        }
        
        return true;
    }
    
    /**
     * Check if a spell is unlocked
     */
    isSpellUnlocked(spellId) {
        return this.knownSpellIds.has(spellId);
    }
    
    /**
     * Get spell data from hotbar slot (0-4 for Q,R,F,V,X)
     */
    getSpellInSlot(slotIndex) {
        if (slotIndex < 0 || slotIndex >= 5) return null;
        
        const spellId = this.spellSlots[slotIndex];
        if (!spellId) return null;
        
        // Look up spell data from database
        return this.getSpellData(spellId);
    }
    
    /**
     * Assign a known spell to a hotbar slot
     */
    assignSpellToSlot(spellId, slotIndex) {
        if (!this.isSpellUnlocked(spellId)) {
            console.warn(`Spellbook: Cannot assign locked spell: ${spellId}`);
            return false;
        }
        
        if (slotIndex < 0 || slotIndex >= 5) {
            console.warn(`Spellbook: Invalid slot index: ${slotIndex}`);
            return false;
        }
        
        this.spellSlots[slotIndex] = spellId;
        return true;
    }
    
    /**
     * Get all known spells (with full data from database)
     */
    getAllKnownSpells() {
        const spells = [];
        for (const spellId of this.knownSpellIds) {
            const spellData = this.getSpellData(spellId);
            if (spellData) {
                spells.push(spellData);
            }
        }
        return spells;
    }
    
    /**
     * Get spell data from database
     */
    getSpellData(spellId) {
        // Use SpellDatabase if available
        if (this.spellDatabase && this.spellDatabase.getSpell) {
            return this.spellDatabase.getSpell(spellId);
        }
        
        // Fallback: minimal hardcoded definitions for backwards compatibility
        const fallbackDefinitions = {
            'magic_dart': {
                id: 'magic_dart',
                name: 'Magic Dart',
                description: 'A simple magical projectile',
                icon: '🎯',
                manaCost: 5,
                damage: { min: 1, max: 6 }, // 1d6
                range: 10,
                type: 'damage',
                element: 'arcane'
            },
            'magic_missile': {
                id: 'magic_missile',
                name: 'Magic Missile',
                description: 'Unerring bolts of magical force',
                icon: '✨',
                manaCost: 10,
                damage: { min: 2, max: 8 }, // 2d4
                range: 12,
                type: 'damage',
                element: 'force'
            },
            'fireball': {
                id: 'fireball',
                name: 'Fireball',
                description: 'Explosive ball of flame',
                icon: '🔥',
                manaCost: 20,
                damage: { min: 6, max: 18 }, // 3d6
                range: 8,
                type: 'damage',
                element: 'fire',
                aoe: true,
                aoeRadius: 2
            },
            'ice_bolt': {
                id: 'ice_bolt',
                name: 'Ice Bolt',
                description: 'Freezing projectile that slows enemies',
                icon: '❄️',
                manaCost: 12,
                damage: { min: 2, max: 10 }, // 2d5
                range: 10,
                type: 'damage',
                element: 'ice',
                slow: true
            },
            'heal': {
                id: 'heal',
                name: 'Heal',
                description: 'Restore health',
                icon: '💚',
                manaCost: 15,
                healing: { min: 10, max: 20 },
                range: 0,
                type: 'healing',
                targetSelf: true
            },
            'lightning_bolt': {
                id: 'lightning_bolt',
                name: 'Lightning Bolt',
                description: 'Chain lightning that hits multiple foes',
                icon: '⚡',
                manaCost: 18,
                damage: { min: 4, max: 12 }, // 2d6
                range: 10,
                type: 'damage',
                element: 'lightning',
                chain: true,
                chainTargets: 3
            }
        };
        
        return fallbackDefinitions[spellId] || null;
    }
    
    /**
     * Get summary for UI display
     */
    getSummary() {
        return {
            knownSpellCount: this.knownSpellIds.size,
            knownSpells: this.getAllKnownSpells(),
            spellSlots: this.spellSlots.map((spellId, index) => ({
                slotIndex: index,
                key: this.slotKeys[index],
                spellId: spellId,
                spell: spellId ? this.getSpellData(spellId) : null
            }))
        };
    }
}
