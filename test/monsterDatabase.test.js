import { describe, it, expect, vi } from 'vitest';
import { MonsterDatabase } from '../src/js/modules/entity/monsterDatabase.js';

describe('MonsterDatabase.createMonster', () => {
    const db = new MonsterDatabase();

    it('applies base stats and identity', () => {
        const spider = db.createMonster('spider', 3, 4);
        expect(spider.name).toBe('Giant Spider');
        expect(spider.x).toBe(3);
        expect(spider.y).toBe(4);
        expect(spider.maxHealth).toBe(24);
        expect(spider.health).toBe(24);
        expect(spider.attackPower).toBe(7);
    });

    it('wires the ranged archetype and projectile config', () => {
        const spider = db.createMonster('spider', 0, 0);
        expect(spider.behavior).toBe('ranged');
        expect(spider.attackRange).toBe(5);
        expect(spider.preferredDistance).toBe(3);
        expect(spider.rangedDamageType).toBe('poison');
        expect(spider.rangedProjectileSymbol).toBe('*');

        const centaur = db.createMonster('centaur', 0, 0);
        expect(centaur.behavior).toBe('ranged');
        expect(centaur.attackRange).toBe(6);
        expect(centaur.rangedProjectileSymbol).toBe('»');
    });

    it('assigns skittish, erratic, and pack archetypes', () => {
        expect(db.createMonster('rat', 0, 0).behavior).toBe('skittish');
        expect(db.createMonster('goblin', 0, 0).behavior).toBe('skittish');
        expect(db.createMonster('bat', 0, 0).behavior).toBe('erratic');
        expect(db.createMonster('bat', 0, 0).erraticChance).toBe(0.5);
        expect(db.createMonster('wolf', 0, 0).behavior).toBe('pack');
        expect(db.createMonster('wolf', 0, 0).packRallyRange).toBe(8);
    });

    it('defaults to melee when a type declares no behavior', () => {
        // skeleton has no `behavior` field, so it should keep the constructor default
        expect(db.createMonster('skeleton', 0, 0).behavior).toBe('melee');
    });

    it('returns a default monster for unknown types', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const unknown = db.createMonster('dragon', 0, 0);
        expect(unknown.name).toBe('Unknown Monster');
        spy.mockRestore();
    });
});

describe('MonsterDatabase.getRandomMonsterType', () => {
    const db = new MonsterDatabase();

    it('only returns types at or below the requested dungeon level', () => {
        for (let i = 0; i < 30; i++) {
            const type = db.getRandomMonsterType(1);
            expect(db.monsterTypes[type].baseStats.level).toBeLessThanOrEqual(1);
        }
    });

    it('returns higher-level types as the dungeon level rises', () => {
        const seen = new Set();
        for (let i = 0; i < 100; i++) seen.add(db.getRandomMonsterType(4));
        // At level 4 the pool should include at least one type above level 1.
        const hasDeeper = [...seen].some(t => db.monsterTypes[t].baseStats.level > 1);
        expect(hasDeeper).toBe(true);
    });
});
