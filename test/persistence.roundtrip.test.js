// Round-trip tests for the save/load serialization core: a booted fake game
// with meaningful mutations must survive serializeGame -> JSON -> restoreGame
// onto a fresh manager set with nothing lost and, critically, no equipment
// stat double-apply.

import { describe, it, expect, beforeEach } from 'vitest';
import { bootFakeGame, makeFakeGame } from './helpers/fakeGame.js';
import { serializeGame } from '../src/js/modules/persistence/serializer.js';
import { restoreGame } from '../src/js/modules/persistence/hydrator.js';

// Boot a game and apply a broad set of mutations that exercise every
// serialization special case. Returns the game plus the bits the assertions
// need to reference.
function bootMutatedGame() {
    const game = bootFakeGame();
    const player = game.player;

    // Progression: level up once (100xp threshold), spend the earned points.
    player.gainExperience(150);
    expect(player.level).toBe(2);
    player.spendSkillPoint('toughness');
    player.allocateStatPoint('strength');

    // Equip the staff (attribute-bonus equipment) over the starting sword so
    // the base-attribute math is exercised by a real intelligence delta.
    const staffIndex = player.inventory.items.findIndex(i => i.id === 'staff');
    expect(staffIndex).toBeGreaterThanOrEqual(0);
    player.inventory.equipItem(staffIndex, player);

    // Spellbook: learn fireball on hotbar slot 1 (R key).
    player.spellbook.unlockSpell('fireball', 1);

    // Wand with spent charges.
    const wand = game.itemManager.itemDB.getItem('wand_of_frost');
    expect(wand).toBeTruthy();
    wand.charges -= 2;
    const expectedCharges = wand.charges;
    player.inventory.addItem(wand);

    // Gold.
    player.inventory.gold = 120;

    // Unlock the first gate (mutates tiles, gate.locked, unlockedSections).
    const unlockedGateId = game.dungeon.gates[0].id;
    game.dungeon.unlockGate(unlockedGateId);

    // An elite, damaged, aggro'd monster (difficulty scaling mutates combat
    // stats and the name that drives loot behavior).
    const monster = game.monsters[0];
    game.combat.applyDifficultyScaling(monster, 4);
    monster.health = Math.max(1, monster.maxHealth - 7);
    monster.awareOfPlayer = true;
    monster.lastKnownPlayerPos = { x: player.x, y: player.y };
    monster.turnsSincePlayerSeen = 2;

    // A custom gate key on the ground (customized clone, not rebuildable
    // from the gate_key template).
    const keyGateId = game.dungeon.gates[1].id;
    game.itemManager.createGateKey(keyGateId, 5, 5);

    // Visit a second section and come back, so sectionStates holds a
    // non-current section and exploration memory spans two sections.
    game.worldManager.transitionToSection(1, 0, 'east');
    game.worldManager.transitionToSection(0, 0, 'west');
    expect(game.worldManager.currentSectionId).toBe('0_0');

    // Settle the player on a known floor tile and record some exploration.
    const pos = game.dungeon.getRandomFloorPosition();
    player.x = pos.x;
    player.y = pos.y;
    game.fov.update();

    return { game, expectedCharges, unlockedGateId, keyGateId };
}

describe('save/load round trip', () => {
    let game, game2, state, expectedCharges, unlockedGateId, keyGateId;

    beforeEach(() => {
        ({ game, expectedCharges, unlockedGateId, keyGateId } = bootMutatedGame());
        // Prove the state is plain JSON (no Sets, Maps or class instances
        // leaking through) by round-tripping it through JSON text.
        state = JSON.parse(JSON.stringify(serializeGame(game)));
        game2 = makeFakeGame();
        expect(restoreGame(game2, state)).toBe(true);
    });

    it('restores player identity, position and progression', () => {
        expect(game2.player.name).toBe(game.player.name);
        expect(game2.player.x).toBe(game.player.x);
        expect(game2.player.y).toBe(game.player.y);
        expect(game2.player.level).toBe(2);
        expect(game2.player.experience).toBe(game.player.experience);
        expect(game2.player.experienceToNextLevel).toBe(game.player.experienceToNextLevel);
        expect(game2.player.skillPoints).toBe(game.player.skillPoints);
        expect(game2.player.statPoints).toBe(game.player.statPoints);
        expect(game2.player.getSkillLevel('toughness')).toBe(1);
        expect(game2.player.inventory.gold).toBe(120);
        expect(game2.player.health).toBe(game.player.health);
        expect(game2.player.mana).toBe(game.player.mana);
    });

    it('does not double-apply equipment bonuses (attributes and derived stats exact)', () => {
        for (const attr of ['strength', 'dexterity', 'constitution', 'intelligence']) {
            expect(game2.player[attr]).toBe(game.player[attr]);
        }
        expect(game2.player.maxHealth).toBe(game.player.maxHealth);
        expect(game2.player.maxMana).toBe(game.player.maxMana);
        expect(game2.player.attackPower).toBe(game.player.attackPower);
        expect(game2.player.defense).toBe(game.player.defense);
    });

    it('is idempotent across a second round trip', () => {
        const state2 = JSON.parse(JSON.stringify(serializeGame(game2)));
        const game3 = makeFakeGame();
        expect(restoreGame(game3, state2)).toBe(true);
        for (const attr of ['strength', 'dexterity', 'constitution', 'intelligence']) {
            expect(game3.player[attr]).toBe(game.player[attr]);
        }
        expect(game3.player.maxHealth).toBe(game.player.maxHealth);
        expect(game3.player.maxMana).toBe(game.player.maxMana);
        expect(game3.player.attackPower).toBe(game.player.attackPower);
        expect(game3.player.inventory.items.length).toBe(game.player.inventory.items.length);
    });

    it('restores inventory and equipment with per-instance item state', () => {
        expect(game2.player.inventory.equipment.weapon?.id).toBe('staff');
        expect(game2.player.inventory.equipment.body?.id).toBe('leather_armor');
        expect(game2.player.inventory.items.map(i => i.id))
            .toEqual(game.player.inventory.items.map(i => i.id));

        const wand = game2.player.inventory.items.find(i => i.id === 'wand_of_frost');
        expect(wand).toBeTruthy();
        expect(wand.charges).toBe(expectedCharges);
        expect(typeof wand.use).toBe('function'); // rebuilt as a real Wand, not a plain Item
    });

    it('restores the spellbook wired to the live spell database', () => {
        const spellbook = game2.player.spellbook;
        expect([...spellbook.knownSpellIds].sort())
            .toEqual([...game.player.spellbook.knownSpellIds].sort());
        expect(spellbook.spellSlots).toEqual(game.player.spellbook.spellSlots);
        expect(spellbook.spellSlots[1]).toBe('fireball');
        // Rewired database reference: slot lookups resolve real spell data.
        expect(spellbook.getSpellInSlot(1)?.name).toBeTruthy();
    });

    it('restores world bookkeeping and both sections', () => {
        const wm = game.worldManager;
        const wm2 = game2.worldManager;
        expect(wm2.currentSectionId).toBe('0_0');
        expect([...wm2.visitedSections].sort()).toEqual([...wm.visitedSections].sort());
        expect(wm2.sectionDifficulty).toEqual(wm.sectionDifficulty);
        expect(wm2.sectionHistory).toEqual(wm.sectionHistory);
        expect(Object.keys(wm2.sectionStates).sort()).toEqual(['0_0', '1_0']);

        // Tile-exact dungeons for both the current and the stored section.
        expect(game2.dungeon.tiles).toEqual(game.dungeon.tiles);
        expect(wm2.sectionStates['1_0'].dungeon.tiles)
            .toEqual(wm.sectionStates['1_0'].dungeon.tiles);
        expect(game2.dungeon.theme).toBe(game.dungeon.theme);
        expect(game2.map).toBe(game2.dungeon.tiles); // shared reference, as live
    });

    it('restores gate lock state and unlocked sections', () => {
        const gate = game2.dungeon.gates.find(g => g.id === unlockedGateId);
        expect(gate).toBeTruthy();
        expect(gate.locked).toBe(false);
        expect(game2.dungeon.unlockedSections.length).toBe(game.dungeon.unlockedSections.length);
        // The other gates keep their saved locked flags.
        expect(game2.dungeon.gates.map(g => g.locked))
            .toEqual(game.dungeon.gates.map(g => g.locked));
    });

    it('restores monsters with scaled stats, elite naming and aggro state', () => {
        expect(game2.monsters.length).toBe(game.monsters.length);
        expect(wmMonsterCount(game2, '1_0')).toBe(wmMonsterCount(game, '1_0'));

        const original = game.monsters[0];
        const restored = game2.monsters.find(m => m.x === original.x && m.y === original.y && m.type === original.type);
        expect(restored).toBeTruthy();
        expect(restored.name).toBe(original.name); // keeps the 'Elite ' prefix
        expect(restored.health).toBe(original.health);
        expect(restored.maxHealth).toBe(original.maxHealth);
        expect(restored.attackPower).toBe(original.attackPower);
        expect(restored.defense).toBe(original.defense);
        expect(restored.xpValue).toBe(original.xpValue);
        expect(restored.awareOfPlayer).toBe(true);
        expect(restored.lastKnownPlayerPos).toEqual(original.lastKnownPlayerPos);
        expect(restored.turnsSincePlayerSeen).toBe(original.turnsSincePlayerSeen);
        expect(typeof restored.act).toBe('function'); // real Monster instance
    });

    it('restores the customized gate key on the ground', () => {
        const originalGround = game.itemManager.itemsOnGround.find(g => g.item.gateId === keyGateId);
        const restoredGround = game2.itemManager.itemsOnGround.find(g => g.item.gateId === keyGateId);
        expect(originalGround).toBeTruthy();
        expect(restoredGround).toBeTruthy();
        expect(restoredGround.x).toBe(originalGround.x);
        expect(restoredGround.y).toBe(originalGround.y);
        expect(restoredGround.item.id).toBe(`gate_key_${keyGateId}`);
        expect(restoredGround.item.name).toBe(originalGround.item.name);
        expect(restoredGround.item.color).toBe(originalGround.item.color);
        expect(restoredGround.item.icon).toBe(originalGround.item.icon);
        // The referenced gate exists in the restored dungeon and is unlockable.
        expect(game2.dungeon.gates.some(g => g.id === keyGateId)).toBe(true);
    });

    it('restores exploration memory and rewires fov.explored to it', () => {
        const mem = game.worldManager.explorationMemory;
        const mem2 = game2.worldManager.explorationMemory;
        expect(Object.keys(mem2).sort()).toEqual(Object.keys(mem).sort());
        for (const id of Object.keys(mem)) {
            expect([...mem2[id]].sort()).toEqual([...mem[id]].sort());
        }
        // Same identity wiring initializeFirstSection uses: exploring updates
        // the section memory directly.
        expect(game2.fov.explored).toBe(mem2['0_0']);
        expect(game2.fov.visible.size).toBe(0);
        expect(game2.stateManager.isPlaying()).toBe(true);
    });
});

function wmMonsterCount(g, sectionId) {
    return g.worldManager.sectionStates[sectionId].monsters.length;
}
