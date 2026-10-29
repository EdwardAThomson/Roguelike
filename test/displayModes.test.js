import { describe, it, expect } from 'vitest';
import {
    DISPLAY_MODES, DEFAULT_DISPLAY_MODE, DISPLAY_MODE_KEY,
    getDisplayMode, nextDisplayMode, loadDisplayMode, saveDisplayMode, viewportFor, canvasTarget
} from '../src/js/modules/render/displayModes.js';

function memoryStorage() {
    const data = {};
    return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, data };
}

describe('display modes', () => {
    it('defaults to 16-bit with lighting and falls back on unknown ids', () => {
        expect(DEFAULT_DISPLAY_MODE).toBe('lit');
        expect(getDisplayMode('nonsense').id).toBe('lit');
        expect(loadDisplayMode(memoryStorage())).toBe('lit');
    });

    it('cycles through every mode and wraps', () => {
        let id = DISPLAY_MODES[0].id;
        const seen = new Set([id]);
        for (let i = 0; i < DISPLAY_MODES.length; i++) {
            id = nextDisplayMode(id).id;
            seen.add(id);
        }
        expect(seen.size).toBe(DISPLAY_MODES.length);
        expect(id).toBe(DISPLAY_MODES[0].id);
    });

    it('persists the choice and survives storage that throws', () => {
        const storage = memoryStorage();
        saveDisplayMode('ascii', storage);
        expect(storage.data[DISPLAY_MODE_KEY]).toBe('ascii');
        expect(loadDisplayMode(storage)).toBe('ascii');

        const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
        expect(() => saveDisplayMode('tiles', broken)).not.toThrow();
        expect(loadDisplayMode(broken)).toBe('lit');
    });

    it('fits the viewport to the tile size, the container shape and the map', () => {
        expect(viewportFor(getDisplayMode('classic'), 80, 40)).toEqual({ width: 40, height: 30 });
        expect(viewportFor(getDisplayMode('lit'), 80, 40)).toEqual({ width: 30, height: 22 });
        const tall = canvasTarget(800, 1000);
        expect(tall.width).toBe(960);
        expect(tall.height).toBe(1200);
        expect(viewportFor(getDisplayMode('classic'), 80, 40, tall).height).toBe(40); // clamped to the map
        expect(canvasTarget(0, 0)).toEqual({ width: 960, height: 720 });
    });
});
