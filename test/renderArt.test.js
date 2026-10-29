import { describe, it, expect } from 'vitest';
import { rasterizeSprite, bitmapText, liftColor, hash01, OUTLINE } from '../src/js/modules/render/pixelArt.js';
import { CHARACTER_SPRITES, ITEM_SPRITES } from '../src/js/modules/render/spriteDefs.js';
import { itemVisual, monsterSpriteKey } from '../src/js/modules/render/visuals.js';
import { SLOT_SPRITES } from '../src/js/modules/render/itemIcons.js';
import { MonsterDatabase } from '../src/js/modules/entity/monsterDatabase.js';
import { ItemDatabase } from '../src/js/modules/items/itemDatabase.js';

// The 16-bit art is generated from letter grids, so the checks here are the
// "art as code" kind: every sprite rasterises, every game thing has a picture.

describe('rasterizeSprite', () => {
    it('outlines the silhouette and lights it from the top-left', () => {
        const { pixels } = rasterizeSprite(['....', '.aa.', '.aa.', '....'], { a: '#808080' });
        const at = (x, y) => pixels.find(p => p.x === x && p.y === y);
        expect(at(0, 1).color).toBe(OUTLINE);
        expect(at(0, 0)).toBeUndefined(); // diagonal corners stay clear
        const topLeft = at(1, 1).color, bottomRight = at(2, 2).color;
        const lum = (c) => c.match(/\d+/g).map(Number).reduce((a, b) => a + b, 0);
        expect(lum(topLeft)).toBeGreaterThan(lum(bottomRight));
    });

    it('rejects a letter missing from the palette', () => {
        expect(() => rasterizeSprite(['.x.'], {})).toThrow(/no colour/);
    });

    it('rasterises every sprite in the game within a 16x16 cell', () => {
        for (const [key, def] of Object.entries({ ...CHARACTER_SPRITES, ...ITEM_SPRITES })) {
            const r = rasterizeSprite(def.rows, def.palette);
            expect(r.pixels.length, key).toBeGreaterThan(10);
            expect(r.width, key).toBeLessThanOrEqual(16);
            expect(r.height, key).toBeLessThanOrEqual(16);
        }
    });
});

describe('visual registry coverage', () => {
    it('has a sprite for every monster type in the database', () => {
        const db = new MonsterDatabase();
        for (const type of Object.keys(db.monsterTypes)) {
            expect(monsterSpriteKey(type), type).toBe(type);
        }
    });

    it('maps every database item to a defined sprite and a single glyph', () => {
        const db = new ItemDatabase();
        for (const item of Object.values(db.items)) {
            const v = itemVisual(item);
            expect(ITEM_SPRITES[v.sprite], item.id).toBeDefined();
            expect([...v.glyph].length, item.id).toBe(1);
            expect(v.color, item.id).toMatch(/^#/);
        }
    });

    it('has an empty-slot picture for every equipment slot', () => {
        for (const slot of ['head', 'body', 'feet', 'weapon', 'offhand', 'ring', 'amulet']) {
            expect(ITEM_SPRITES[SLOT_SPRITES[slot]], slot).toBeDefined();
        }
    });

    it('tells health and mana potions apart', () => {
        const db = new ItemDatabase();
        const health = Object.values(db.items).find(i => i.type === 'potion' && /health/.test(i.id));
        const mana = Object.values(db.items).find(i => i.type === 'potion' && /mana/.test(i.id));
        expect(itemVisual(health).sprite).toBe('potion_health');
        expect(itemVisual(mana).sprite).toBe('potion_mana');
    });
});

describe('small helpers', () => {
    it('bitmapText lays digits out on a 4px advance', () => {
        const t = bitmapText('12');
        expect(t.width).toBe(7);
        expect(t.pixels.some(p => p.x >= 4)).toBe(true);
    });

    it('liftColor brightens dark glyph colours and keeps bright ones', () => {
        expect(liftColor('#654')).not.toBe('#665544');
        expect(liftColor('#ffffff')).toBe('#ffffff');
    });

    it('hash01 is deterministic and in range', () => {
        expect(hash01(3, 4, 5)).toBe(hash01(3, 4, 5));
        for (let i = 0; i < 100; i++) {
            const v = hash01(i, i * 7, 2);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(1);
        }
    });
});
