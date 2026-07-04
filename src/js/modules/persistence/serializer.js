// Pure conversion of a live game into a plain-JSON save state. Never mutates
// the game, never touches the DOM or storage, so it is unit-testable on the
// headless fake game harness. The inverse lives in hydrator.js.

import { encodeTiles } from './saveSchema.js';

export const CORE_ATTRIBUTES = ['strength', 'dexterity', 'constitution', 'intelligence'];

// Plain-data deep copy so the save state never aliases live game objects.
function deepCopy(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
}

/**
 * Serialize one item to a compact record: stable database id plus only the
 * per-instance fields that can diverge from the database template.
 * Gate keys are customized clones (itemManager.createGateKey) whose gateId,
 * name, icon and color are not in the 'gate_key' template and are dropped by
 * Item.clone(), so they carry their custom fields in full.
 */
export function serializeItem(item) {
    const record = { id: item.id, quantity: item.quantity };

    if (typeof item.charges === 'number') {
        record.charges = item.charges; // Wand charge counter
    }
    if (typeof item.durability === 'number' && item.durability !== item.maxDurability) {
        record.durability = item.durability;
    }
    if (item.gateId != null) {
        record.custom = {
            gateId: item.gateId,
            name: item.name,
            description: item.description,
            icon: item.icon,
            color: item.color
        };
    }

    return record;
}

/**
 * Serialize the player. Attributes are stored as BASE values: the current
 * value minus the sum of equipped items' bonuses for that attribute, because
 * Equipment.applyStats mutates the entity's attributes on equip. The hydrator
 * restores base attributes first and then re-equips, which re-applies the
 * bonuses exactly once. Derived stats (maxHealth, maxMana, attackPower,
 * defense, criticalChance) are not saved at all; Player.updateStats()
 * recomputes them from attributes, level, skills and equipment.
 */
export function serializePlayer(player) {
    const equipment = player.inventory.equipment;
    const equippedItems = Object.values(equipment).filter(Boolean);

    const attributes = {};
    for (const attr of CORE_ATTRIBUTES) {
        let equipmentBonus = 0;
        for (const item of equippedItems) {
            if (item.stats && typeof item.stats[attr] === 'number') {
                equipmentBonus += item.stats[attr];
            }
        }
        attributes[attr] = player[attr] - equipmentBonus;
    }

    return {
        name: player.name,
        x: player.x,
        y: player.y,
        level: player.level,
        experience: player.experience,
        experienceToNextLevel: player.experienceToNextLevel,
        attributes,
        health: player.health,
        mana: player.mana,
        skillPoints: player.skillPoints,
        statPoints: player.statPoints,
        // Only id + level are load-bearing; names/descriptions come from the
        // Character constructor's skill templates.
        skills: player.availableSkills.map(skill => ({ id: skill.id, level: skill.level })),
        inventory: {
            maxSize: player.inventory.maxSize,
            gold: player.inventory.gold,
            items: player.inventory.items.map(serializeItem),
            equipment: Object.fromEntries(
                Object.entries(equipment).map(([slot, item]) => [slot, item ? serializeItem(item) : null])
            )
        },
        spellbook: {
            knownSpellIds: [...player.spellbook.knownSpellIds],
            spellSlots: [...player.spellbook.spellSlots]
        }
    };
}

/**
 * Serialize one monster. Beyond identity and position we persist the combat
 * stats that combatManager.applyDifficultyScaling mutates after creation
 * (maxHealth, attackPower, defense, xpValue) plus name/symbol: the 'Elite '
 * name prefix drives loot drop behavior, so rebuilding from the database
 * template alone would silently de-elite scaled monsters.
 */
export function serializeMonster(monster) {
    return {
        type: monster.type,
        x: monster.x,
        y: monster.y,
        name: monster.name,
        symbol: monster.symbol,
        health: monster.health,
        maxHealth: monster.maxHealth,
        attackPower: monster.attackPower,
        defense: monster.defense,
        xpValue: monster.xpValue,
        awareOfPlayer: monster.awareOfPlayer,
        lastKnownPlayerPos: deepCopy(monster.lastKnownPlayerPos),
        turnsSincePlayerSeen: monster.turnsSincePlayerSeen,
        panicMovesRemaining: monster.panicMovesRemaining
    };
}

/**
 * Serialize a Dungeon instance. There is no seeded RNG in generation, so the
 * tile grid and every placed structure must be stored verbatim. Tile rows are
 * string-encoded (see saveSchema.js).
 */
export function serializeDungeon(dungeon) {
    return {
        width: dungeon.width,
        height: dungeon.height,
        worldX: dungeon.worldX,
        worldY: dungeon.worldY,
        worldSectionId: dungeon.worldSectionId,
        theme: dungeon.theme,
        areaLevel: dungeon.areaLevel,
        revealedMap: dungeon.revealedMap,
        tiles: encodeTiles(dungeon.tiles),
        rooms: deepCopy(dungeon.rooms),
        gates: deepCopy(dungeon.gates),
        keys: deepCopy(dungeon.keys),
        potentialGateLocations: deepCopy(dungeon.potentialGateLocations),
        lockedSections: deepCopy(dungeon.lockedSections),
        unlockedSections: deepCopy(dungeon.unlockedSections)
    };
}

// One world section: mirrors the shape worldManager.sectionStates uses
// in-memory ({ dungeon, monsters, items }), minus the redundant map field
// (game.map is the same array as dungeon.tiles).
function serializeSection(section) {
    return {
        dungeon: serializeDungeon(section.dungeon),
        monsters: section.monsters.map(serializeMonster),
        items: section.items.map(ground => ({
            x: ground.x,
            y: ground.y,
            item: serializeItem(ground.item)
        }))
    };
}

/**
 * Serialize the whole game into a plain-JSON state object.
 *
 * The live current section is NOT in worldManager.sectionStates (it is only
 * snapshotted there when the player leaves it), so it is flushed into the
 * section map here, overwriting any stale entry from a previous visit.
 */
export function serializeGame(game) {
    const wm = game.worldManager;

    const sections = {};
    for (const [sectionId, section] of Object.entries(wm.sectionStates)) {
        sections[sectionId] = serializeSection(section);
    }
    sections[wm.currentSectionId] = serializeSection({
        dungeon: game.dungeon,
        monsters: game.monsters,
        items: game.itemManager.itemsOnGround
    });

    return {
        player: serializePlayer(game.player),
        world: {
            currentSectionId: wm.currentSectionId,
            previousSectionId: wm.previousSectionId,
            visitedSections: [...wm.visitedSections],
            worldCoordinates: [...wm.worldCoordinates],
            sectionDifficulty: deepCopy(wm.sectionDifficulty),
            sectionHistory: deepCopy(wm.sectionHistory),
            explorationMemory: Object.fromEntries(
                Object.entries(wm.explorationMemory).map(([id, tiles]) => [id, [...tiles]])
            )
        },
        gameMisc: {
            worldX: game.worldX,
            worldY: game.worldY,
            dungeonLevel: game.dungeonLevel,
            dungeonArea: game.dungeonArea,
            // Chosen at run start, immutable for the life of the run.
            hardcore: !!game.hardcore
        },
        sections
    };
}
