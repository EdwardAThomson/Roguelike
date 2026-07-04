// Cloud-save client behavior: the SaveManager local-first mirror policy
// (with a scripted fake cloud store) and the CloudSaveStore mapping onto the
// Octonion gateway HTTP contract (with a stubbed fetch).

import { describe, it, expect, vi, afterEach } from 'vitest';
import { bootFakeGame } from './helpers/fakeGame.js';
import { SaveManager } from '../src/js/modules/persistence/saveManager.js';
import { InMemorySaveStore } from '../src/js/modules/persistence/saveStore.js';
import { CloudSaveStore } from '../src/js/modules/persistence/cloudSaveStore.js';
import { FORMAT_VERSION, SAVE_SLOT } from '../src/js/modules/persistence/saveSchema.js';
import { CONFIG } from '../src/js/config.js';
import { authClient } from '../src/js/modules/persistence/authClient.js';

function cloudErr(code, extra = {}) {
    const error = new Error(code);
    error.code = code;
    Object.assign(error, extra);
    return error;
}

function bootWithCloud(cloud) {
    const game = bootFakeGame();
    game.saveManager = new SaveManager(game, new InMemorySaveStore(), cloud);
    return game;
}

describe('SaveManager cloud mirror (local-first)', () => {
    it('pushes to the cloud after a successful local save and tracks the generation', async () => {
        const cloud = { save: vi.fn().mockResolvedValue({ generation: 1 }), delete: vi.fn() };
        const game = bootWithCloud(cloud);

        expect(await game.saveManager.saveGame('manual')).toBe(true);
        await game.saveManager.cloudChain;

        expect(cloud.save).toHaveBeenCalledTimes(1);
        const [slot, envelope, opts] = cloud.save.mock.calls[0];
        expect(slot).toBe(SAVE_SLOT);
        expect(envelope.formatVersion).toBe(FORMAT_VERSION);
        expect(opts.expectedGeneration).toBeUndefined(); // first push
        expect(game.saveManager.cloudGeneration).toBe(1);

        // Second push carries the acknowledged generation.
        await game.saveManager.saveGame('manual');
        await game.saveManager.cloudChain;
        expect(cloud.save.mock.calls[1][2].expectedGeneration).toBe(1);
    });

    it('resolves a 409 conflict last-write-wins by retrying against the server generation', async () => {
        const cloud = {
            save: vi.fn()
                .mockRejectedValueOnce(cloudErr('conflict', { current: { generation: 7 } }))
                .mockResolvedValueOnce({ generation: 8 }),
            delete: vi.fn()
        };
        const game = bootWithCloud(cloud);

        await game.saveManager.saveGame('manual');
        await game.saveManager.cloudChain;

        expect(cloud.save).toHaveBeenCalledTimes(2);
        expect(cloud.save.mock.calls[1][2].expectedGeneration).toBe(7);
        expect(game.saveManager.cloudGeneration).toBe(8);
        expect(game.ui.messages.some(m => m.text.includes('another device'))).toBe(true);
    });

    it('degrades quietly to local-only, warning exactly once', async () => {
        const cloud = { save: vi.fn().mockRejectedValue(cloudErr('network')), delete: vi.fn() };
        const game = bootWithCloud(cloud);

        await game.saveManager.saveGame('manual');
        await game.saveManager.cloudChain;
        await game.saveManager.saveGame('manual');
        await game.saveManager.cloudChain;

        const warnings = game.ui.messages.filter(m => m.text.includes('Cloud sync unavailable'));
        expect(warnings.length).toBe(1);
        // Local saves kept succeeding regardless.
        expect(game.ui.messages.filter(m => m.text === 'Game saved.').length).toBe(2);
    });

    it('deletes the cloud copy on player death too', async () => {
        const cloud = { save: vi.fn().mockResolvedValue({ generation: 1 }), delete: vi.fn().mockResolvedValue() };
        const game = bootWithCloud(cloud);
        await game.saveManager.saveGame('manual');

        game.stateManager.handlePlayerDeath();
        await game.saveManager.writeChain;
        await vi.waitFor(() => expect(cloud.delete).toHaveBeenCalledWith(SAVE_SLOT));
    });
});

describe('CloudSaveStore gateway contract', () => {
    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
        CONFIG.HUB_URL = '';
        CONFIG.SUPABASE_URL = '';
        CONFIG.SUPABASE_ANON_KEY = '';
        CONFIG.GATEWAY_URL = '';
    });

    function configure() {
        CONFIG.HUB_URL = 'https://hub.test';
        CONFIG.SUPABASE_URL = 'https://sb.test';
        CONFIG.SUPABASE_ANON_KEY = 'anon';
        CONFIG.GATEWAY_URL = 'https://api.test';
        vi.spyOn(authClient, 'getAccessToken').mockResolvedValue('jwt-token');
    }

    function jsonResponse(status, body) {
        return { ok: status >= 200 && status < 300, status, json: async () => body };
    }

    it('PUTs the envelope in the gateway body shape and returns the generation', async () => {
        configure();
        const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { save: { generation: 3 } }));
        vi.stubGlobal('fetch', fetchMock);

        const store = new CloudSaveStore();
        const envelope = { formatVersion: FORMAT_VERSION, game: { version: '0.5.0' }, state: { player: {} } };
        const result = await store.save(0, envelope, { expectedGeneration: 2 });

        expect(result.generation).toBe(3);
        const [url, options] = fetchMock.mock.calls[0];
        expect(url).toBe('https://api.test/api/saves/0');
        expect(options.method).toBe('PUT');
        expect(options.headers.Authorization).toBe('Bearer jwt-token');
        const body = JSON.parse(options.body);
        expect(body).toEqual({
            engineVersion: FORMAT_VERSION,
            contentVersion: '0.5.0',
            state: envelope,
            expectedGeneration: 2
        });
    });

    it('maps 404 to null on load and unwraps save.state otherwise', async () => {
        configure();
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(jsonResponse(404, { error: 'not_found' }))
            .mockResolvedValueOnce(jsonResponse(200, { save: { state: { formatVersion: 1 }, generation: 5 } }));
        vi.stubGlobal('fetch', fetchMock);

        const store = new CloudSaveStore();
        expect(await store.load(0)).toBeNull();
        expect(await store.load(0)).toEqual({ formatVersion: 1 });
    });

    it('surfaces 409 as a typed conflict with the server row', async () => {
        configure();
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
            jsonResponse(409, { error: 'conflict', current: { generation: 9 } })
        ));

        const store = new CloudSaveStore();
        await expect(store.save(0, { game: { version: 'x' } }))
            .rejects.toMatchObject({ code: 'conflict', current: { generation: 9 } });
    });

    it('surfaces 503 as unavailable and network failure as network', async () => {
        configure();
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(503, { error: 'cloud_saves_unavailable' })));
        const store = new CloudSaveStore();
        await expect(store.load(0)).rejects.toMatchObject({ code: 'unavailable' });

        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
        await expect(store.load(0)).rejects.toMatchObject({ code: 'network' });
    });

    it('is unavailable when unconfigured or signed out', async () => {
        const store = new CloudSaveStore();
        expect(await store.isAvailable()).toBe(false); // unconfigured

        configure();
        authClient.getAccessToken.mockRestore?.();
        vi.spyOn(authClient, 'getUser').mockResolvedValue(null);
        expect(await store.isAvailable()).toBe(false); // signed out
    });
});
