// Rebuilds live game state from a plain-JSON save produced by serializer.js.
//
// restoreGame() runs from main.js#init() BEFORE the UI exists, so nothing in
// here may touch game.ui. It throws on structurally broken saves; the caller
// (SaveManager) catches and falls back to a new game.

import { Dungeon } from '../dungeon.js';
import { Player } from '../entity/player.js';
import { decodeTiles } from './saveSchema.js';
import { CORE_ATTRIBUTES } from './serializer.js';

/**
 * Rebuild one item from its record: clone the database template by stable id,
 * then apply the per-instance deltas. Returns null (with a warning) when the
 * id no longer exists in the database, so saves survive content removals.
 */
export function hydrateItem(record, itemManager) {
    // Gold ground piles are constructed ad hoc, not database templates.
    if (record.id === 'gold') {
        return itemManager.createGoldPile(record.quantity ?? 1);
    }

    // Gate keys are customized clones of the 'gate_key' template.
    const templateId = record.custom && record.custom.gateId != null ? 'gate_key' : record.id;
    const item = itemManager.itemDB.getItem(templateId);
    if (!item) {
        console.warn(`⚠️ Save: unknown item id "${record.id}", skipping`);
        return null;
    }

    item.quantity = record.quantity ?? 1;
    if (typeof record.charges === 'number') {
        item.charges = record.charges;
    }
    if (typeof record.durability === 'number') {
        item.durability = record.durability;
    }
    if (record.custom) {
        item.id = record.id;
        item.gateId = record.custom.gateId;
        item.name = record.custom.name;
        item.description = record.custom.description;
        item.icon = record.custom.icon;
        item.color = record.custom.color;
    }

    return item;
}

/**
 * Rebuild a monster: create from the database template (behavior tuning,
 * timers, detection ranges), then overwrite everything that diverged at
 * runtime, including the difficulty-scaled combat stats and the 'Elite '
 * name prefix that drives loot behavior.
 */
export function hydrateMonster(record, monsterDB) {
    const monster = monsterDB.createMonster(record.type, record.x, record.y);
    if (!monster) {
        console.warn(`⚠️ Save: unknown monster type "${record.type}", skipping`);
        return null;
    }

    monster.name = record.name ?? monster.name;
    monster.symbol = record.symbol ?? monster.symbol;
    monster.maxHealth = record.maxHealth ?? monster.maxHealth;
    monster.health = record.health ?? monster.maxHealth;
    monster.attackPower = record.attackPower ?? monster.attackPower;
    monster.defense = record.defense ?? monster.defense;
    monster.xpValue = record.xpValue ?? monster.xpValue;
    monster.awareOfPlayer = !!record.awareOfPlayer;
    monster.lastKnownPlayerPos = record.lastKnownPlayerPos ? { ...record.lastKnownPlayerPos } : null;
    monster.turnsSincePlayerSeen = record.turnsSincePlayerSeen ?? 0;
    monster.panicMovesRemaining = record.panicMovesRemaining ?? 0;

    return monster;
}

// Rebuild a Dungeon without running generate(): every structure was saved
// verbatim because generation is not seed-reproducible.
export function hydrateDungeon(data) {
    const dungeon = new Dungeon(data.width, data.height);
    dungeon.worldX = data.worldX;
    dungeon.worldY = data.worldY;
    dungeon.worldSectionId = data.worldSectionId;
    dungeon.theme = data.theme;
    dungeon.areaLevel = data.areaLevel;
    dungeon.revealedMap = data.revealedMap;
    dungeon.tiles = decodeTiles(data.tiles);
    dungeon.rooms = data.rooms ?? [];
    dungeon.gates = data.gates ?? [];
    dungeon.keys = data.keys ?? [];
    dungeon.potentialGateLocations = data.potentialGateLocations ?? [];
    dungeon.lockedSections = data.lockedSections ?? [];
    dungeon.unlockedSections = data.unlockedSections ?? [];
    return dungeon;
}

function hydrateSection(sectionData, game) {
    const dungeon = hydrateDungeon(sectionData.dungeon);
    const monsters = sectionData.monsters
        .map(record => hydrateMonster(record, game.monsterDB))
        .filter(Boolean);
    const items = sectionData.items
        .map(ground => {
            const item = hydrateItem(ground.item, game.itemManager);
            return item ? { item, x: ground.x, y: ground.y } : null;
        })
        .filter(Boolean);

    // Same shape worldManager.sectionStates uses; map shares dungeon.tiles,
    // exactly as it does in the live game.
    return { dungeon, map: dungeon.tiles, monsters, items };
}

/**
 * Rebuild the player with the double-apply-safe ordering:
 * 1. new Player() grants and equips the starting kit, whose stat bonuses
 *    leak into attributes and are NOT reversed by inventory.clear().
 * 2. clear() drops the kit; overwriting the base attributes afterwards
 *    erases the leaked deltas.
 * 3. Equipment is restored through the equip path (inventory slot + equip()),
 *    which applies each item's bonuses exactly once on top of base values.
 * 4. updateStats() recomputes every derived stat, then current health/mana
 *    are clamped to the recomputed maxima.
 */
function hydratePlayer(data, game) {
    const player = new Player(data.x, data.y);
    player.inventory.clear();

    player.name = data.name;
    player.level = data.level;
    player.experience = data.experience;
    player.experienceToNextLevel = data.experienceToNextLevel;
    for (const attr of CORE_ATTRIBUTES) {
        player[attr] = data.attributes[attr];
    }
    player.skillPoints = data.skillPoints;
    player.statPoints = data.statPoints;
    for (const saved of data.skills) {
        const skill = player.availableSkills.find(s => s.id === saved.id);
        if (skill) skill.level = saved.level;
    }

    // Equipment before inventory items so restoring can never be blocked by
    // maxSize, and via item.equip() so stat bonuses apply exactly once.
    for (const [slot, record] of Object.entries(data.inventory.equipment)) {
        if (!record) continue;
        const item = hydrateItem(record, game.itemManager);
        if (!item) continue;
        player.inventory.equipment[slot] = item;
        item.equip(player);
    }

    // Direct push (not addItem) so stackables keep their saved layout instead
    // of re-merging.
    for (const record of data.inventory.items) {
        const item = hydrateItem(record, game.itemManager);
        if (item) player.inventory.items.push(item);
    }
    player.inventory.gold = data.inventory.gold;
    player.inventory.maxSize = data.inventory.maxSize;

    player.updateStats();
    player.health = Math.min(data.health, player.maxHealth);
    player.mana = Math.min(data.mana, player.maxMana);

    // Rewire the live spell database reference (dropped by any JSON round
    // trip), then restore the learned spells and hotbar. Mirrors the wiring
    // in worldManager.initializeFirstSection, minus the new-game
    // unlockSpell('magic_dart') grant.
    player.spellbook.setSpellDatabase(game.spellDatabase);
    player.spellbook.knownSpellIds = new Set(data.spellbook.knownSpellIds);
    player.spellbook.spellSlots = [...data.spellbook.spellSlots];

    return player;
}

/**
 * Restore a serialized state onto a game whose managers are constructed but
 * whose world is not yet initialized (the point in main.js#init() where
 * initializeFirstSection would otherwise run). Returns true on success.
 */
export function restoreGame(game, state) {
    const wm = game.worldManager;

    // World bookkeeping.
    wm.currentSectionId = state.world.currentSectionId;
    wm.previousSectionId = state.world.previousSectionId;
    wm.visitedSections = new Set(state.world.visitedSections);
    wm.worldCoordinates = new Set(state.world.worldCoordinates);
    wm.sectionDifficulty = { ...state.world.sectionDifficulty };
    wm.sectionHistory = { ...state.world.sectionHistory };
    wm.explorationMemory = {};
    for (const [sectionId, tiles] of Object.entries(state.world.explorationMemory)) {
        wm.explorationMemory[sectionId] = new Set(tiles);
    }

    game.worldX = state.gameMisc.worldX;
    game.worldY = state.gameMisc.worldY;
    game.dungeonLevel = state.gameMisc.dungeonLevel;
    game.dungeonArea = state.gameMisc.dungeonArea;
    // The run's mode is fixed at creation; a loaded run keeps it regardless
    // of what the menu toggle currently shows. Old saves without the field
    // default to hardcore, the original behavior.
    game.hardcore = state.gameMisc.hardcore ?? true;

    // Sections, then install the current one (the entry stays in
    // sectionStates too, matching loadOrGenerateSection's revisit behavior).
    wm.sectionStates = {};
    for (const [sectionId, sectionData] of Object.entries(state.sections)) {
        wm.sectionStates[sectionId] = hydrateSection(sectionData, game);
    }
    const current = wm.sectionStates[wm.currentSectionId];
    if (!current) {
        throw new Error(`Save is missing its current section "${wm.currentSectionId}"`);
    }
    game.dungeon = current.dungeon;
    game.map = current.map;
    game.monsters = current.monsters;
    game.itemManager.itemsOnGround = current.items;

    // Player last: hydratePlayer needs the item database and spell database,
    // both already live on the constructed managers.
    game.player = hydratePlayer(state.player, game);

    // FOV: point explored at this section's memory (same Set reference, as
    // initializeFirstSection does); visible is recomputed next frame.
    if (!wm.explorationMemory[wm.currentSectionId]) {
        wm.explorationMemory[wm.currentSectionId] = new Set();
    }
    if (game.fov) {
        game.fov.explored = wm.explorationMemory[wm.currentSectionId];
        game.fov.visible = new Set();
    }

    game.stateManager.setState('playing');
    console.log(`💾 Restored save: ${wm.currentSectionId}, player level ${game.player.level}`);
    return true;
}
