// SaveManager behavior against the in-memory store: envelope shape, state
// gating, the autosave and permadeath triggers, and write serialization.

import { describe, it, expect, vi } from 'vitest';
import { bootFakeGame, makeFakeGame } from './helpers/fakeGame.js';
import { SaveManager } from '../src/js/modules/persistence/saveManager.js';
import { InMemorySaveStore } from '../src/js/modules/persistence/saveStore.js';
import { FORMAT_VERSION, SAVE_SLOT } from '../src/js/modules/persistence/saveSchema.js';

function bootWithSaves(options = {}) {
    const game = bootFakeGame(options);
    const store = new InMemorySaveStore();
    game.saveManager = new SaveManager(game, store);
    return { game, store };
}

describe('SaveManager', () => {
    it('manual save writes a well-formed envelope and messages the player', async () => {
        const { game, store } = bootWithSaves();
        const ok = await game.saveManager.saveGame('manual');
        expect(ok).toBe(true);

        const envelope = await store.load(SAVE_SLOT);
        expect(envelope.formatVersion).toBe(FORMAT_VERSION);
        expect(envelope.reason).toBe('manual');
        expect(envelope.game.version).toMatch(/^\d+\.\d+\.\d+$/);
        expect(typeof envelope.savedAt).toBe('string');
        expect(envelope.meta.playerLevel).toBe(game.player.level);
        expect(envelope.meta.currentSectionId).toBe('0_0');
        expect(envelope.state.player).toBeTruthy();
        expect(game.ui.messages.some(m => m.text === 'Game saved.')).toBe(true);
    });

    it('does not save when the game is not in the playing state', async () => {
        const { game, store } = bootWithSaves();
        game.stateManager.setState('gameOver');
        const ok = await game.saveManager.saveGame('manual');
        expect(ok).toBe(false);
        expect(await store.load(SAVE_SLOT)).toBeNull();
    });

    it('section transitions trigger exactly one autosave', async () => {
        const { game } = bootWithSaves();
        const spy = vi.spyOn(game.saveManager, 'autosave');
        game.worldManager.transitionToSection(1, 0, 'east');
        expect(spy).toHaveBeenCalledTimes(1);

        // Let the fire-and-forget write settle, then confirm it stored.
        await game.saveManager.writeChain;
        const envelope = await game.saveManager.loadEnvelope();
        expect(envelope.reason).toBe('autosave');
        expect(envelope.meta.currentSectionId).toBe('1_0');
        expect(game.ui.messages.some(m => m.text === 'Autosaved.')).toBe(true);
    });

    it('player death deletes the save on a hardcore run', async () => {
        const { game, store } = bootWithSaves({ hardcore: true });
        await game.saveManager.saveGame('manual');
        expect(await store.load(SAVE_SLOT)).toBeTruthy();

        game.stateManager.handlePlayerDeath();
        await game.saveManager.writeChain;
        expect(await store.load(SAVE_SLOT)).toBeNull();
        expect(game.stateManager.isGameOver()).toBe(true);
        expect(game.ui.messages.some(m => m.text.includes('Hardcore run'))).toBe(true);
    });

    it('player death keeps the save on a softcore run', async () => {
        const { game, store } = bootWithSaves({ hardcore: false });
        await game.saveManager.saveGame('manual');

        game.stateManager.handlePlayerDeath();
        await game.saveManager.writeChain;
        expect(await store.load(SAVE_SLOT)).toBeTruthy();
        expect(game.stateManager.isGameOver()).toBe(true);
        expect(game.ui.messages.some(m => m.text.includes('Continue from your last save'))).toBe(true);
    });

    it('persists the run mode and defaults old saves to hardcore', async () => {
        // Softcore round trip: the mode survives save/load.
        const { game } = bootWithSaves({ hardcore: false });
        await game.saveManager.saveGame('manual');
        const envelope = await game.saveManager.loadEnvelope();
        expect(envelope.meta.hardcore).toBe(false);
        expect(envelope.state.gameMisc.hardcore).toBe(false);

        const game2 = makeFakeGame({ hardcore: true }); // menu toggle must not leak in
        game2.saveManager = new SaveManager(game2, new InMemorySaveStore());
        expect(game2.saveManager.restore(envelope)).toBe(true);
        expect(game2.hardcore).toBe(false);

        // Pre-toggle saves (no field) restore as hardcore, the old behavior.
        delete envelope.state.gameMisc.hardcore;
        const game3 = makeFakeGame({ hardcore: false });
        game3.saveManager = new SaveManager(game3, new InMemorySaveStore());
        expect(game3.saveManager.restore(envelope)).toBe(true);
        expect(game3.hardcore).toBe(true);
    });

    it('restores a saved envelope onto a fresh game', async () => {
        const { game } = bootWithSaves();
        game.player.inventory.gold = 77;
        await game.saveManager.saveGame('manual');
        const envelope = await game.saveManager.loadEnvelope();

        const game2 = makeFakeGame();
        game2.saveManager = new SaveManager(game2, new InMemorySaveStore());
        expect(game2.saveManager.restore(envelope)).toBe(true);
        expect(game2.player.inventory.gold).toBe(77);
        expect(game2.worldManager.currentSectionId).toBe('0_0');
    });

    it('rejects corrupt and future-format envelopes without touching the game', () => {
        const game2 = makeFakeGame();
        game2.saveManager = new SaveManager(game2, new InMemorySaveStore());

        expect(game2.saveManager.restore(null)).toBe(false);
        expect(game2.saveManager.restore({ formatVersion: FORMAT_VERSION + 1, state: {} })).toBe(false);
        expect(game2.saveManager.restore({ formatVersion: FORMAT_VERSION, state: { player: {} } })).toBe(false);
        // The game was never initialized and restore must not have half-built it.
        expect(game2.player).toBeUndefined();
        expect(game2.map).toEqual([]);
    });

    it('serializes concurrent writes and increments the generation', async () => {
        const { game, store } = bootWithSaves();
        const saveSpy = vi.spyOn(store, 'save');
        await Promise.all([
            game.saveManager.saveGame('manual'),
            game.saveManager.saveGame('autosave')
        ]);
        expect(saveSpy).toHaveBeenCalledTimes(2);
        expect(game.saveManager.generation).toBe(2);
    });

    it('reports failure and keeps working when the store write throws', async () => {
        const { game, store } = bootWithSaves();
        vi.spyOn(store, 'save').mockRejectedValueOnce(new Error('quota exceeded'));

        const first = await game.saveManager.saveGame('manual');
        expect(first).toBe(false);
        expect(game.ui.messages.some(m => m.text.startsWith('Save failed'))).toBe(true);

        // The write chain survives the failure; the next save succeeds.
        const second = await game.saveManager.saveGame('manual');
        expect(second).toBe(true);
        expect(await store.load(SAVE_SLOT)).toBeTruthy();
    });
});
