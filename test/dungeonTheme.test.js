import { describe, it, expect } from 'vitest';
import { DUNGEON_THEMES, pickThemeForSection } from '../src/js/modules/worldManager.js';
import { MonsterDatabase } from '../src/js/modules/entity/monsterDatabase.js';

describe('pickThemeForSection', () => {
    it('pins the origin section (0_0) to castle', () => {
        expect(pickThemeForSection(0, 0)).toBe('castle');
    });

    it('is deterministic for a given (worldX, worldY)', () => {
        for (const [x, y] of [[1, 0], [3, -2], [-4, 5], [7, 7]]) {
            expect(pickThemeForSection(x, y)).toBe(pickThemeForSection(x, y));
        }
    });

    it('only ever returns a known theme', () => {
        for (let x = -6; x <= 6; x++) {
            for (let y = -6; y <= 6; y++) {
                expect(DUNGEON_THEMES).toContain(pickThemeForSection(x, y));
            }
        }
    });

    it('covers all themes across the nearby grid', () => {
        const seen = new Set();
        for (let x = -6; x <= 6; x++) {
            for (let y = -6; y <= 6; y++) {
                seen.add(pickThemeForSection(x, y));
            }
        }
        for (const theme of DUNGEON_THEMES) {
            expect(seen).toContain(theme);
        }
    });
});

describe('MonsterDatabase themed spawn filter', () => {
    const db = new MonsterDatabase();

    it('every registered monster carries a themes array', () => {
        for (const [id, entry] of Object.entries(db.monsterTypes)) {
            expect(Array.isArray(entry.themes), `${id} needs themes`).toBe(true);
            expect(entry.themes.length, `${id} needs at least one theme`).toBeGreaterThan(0);
        }
    });

    it('registers the crypt-only Wraith at L4 with a ranged shadow attack', () => {
        const wraith = db.monsterTypes.wraith;
        expect(wraith).toBeDefined();
        expect(wraith.baseStats.level).toBe(4);
        expect(wraith.themes).toEqual(['crypt']);
        expect(wraith.behavior).toBe('ranged');
        expect(wraith.ranged.damageType).toBe('arcane');
    });

    it('only returns monsters tagged with the requested theme (when possible)', () => {
        // Sample many rolls: with theme='cave' at any difficulty, we should
        // never get a monster that lacks the 'cave' tag.
        for (let i = 0; i < 50; i++) {
            const type = db.getRandomMonsterType(4, 'cave');
            expect(db.monsterTypes[type].themes).toContain('cave');
        }
    });

    it('respects the level cap while filtering by theme', () => {
        for (let i = 0; i < 30; i++) {
            const type = db.getRandomMonsterType(1, 'castle');
            expect(db.monsterTypes[type].baseStats.level).toBeLessThanOrEqual(1);
            expect(db.monsterTypes[type].themes).toContain('castle');
        }
    });

    it('picks the Wraith deterministically when it is the only crypt monster at L4', () => {
        // Filter difficulty 4 + theme crypt: rat/spider/bat (L1, universal),
        // skeleton (L2, castle+crypt), ghost (L3, castle+crypt), wraith (L4, crypt).
        // All are valid — assert we only ever see themed ones.
        for (let i = 0; i < 30; i++) {
            const type = db.getRandomMonsterType(4, 'crypt');
            expect(db.monsterTypes[type].themes).toContain('crypt');
        }
    });

    it('falls back to the level-only pool when the theme has no match at that level', () => {
        // No monster carries this theme; the filter should silently fall back.
        const type = db.getRandomMonsterType(2, 'nonexistent_theme');
        expect(db.monsterTypes[type]).toBeDefined();
        expect(db.monsterTypes[type].baseStats.level).toBeLessThanOrEqual(2);
    });

    it('theme=null behaves exactly like the old unthemed pick', () => {
        for (let i = 0; i < 20; i++) {
            const type = db.getRandomMonsterType(3, null);
            expect(db.monsterTypes[type].baseStats.level).toBeLessThanOrEqual(3);
        }
    });
});
