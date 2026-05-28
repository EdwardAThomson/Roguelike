import { describe, it, expect } from 'vitest';
import { Character, DEFENSE_K } from '../src/js/modules/entity/character.js';
import { MonsterDatabase } from '../src/js/modules/entity/monsterDatabase.js';
import { CombatManager } from '../src/js/modules/combatManager.js';

const expectedDamage = (amount, defense) =>
    Math.max(1, Math.round(amount * (1 - defense / (defense + DEFENSE_K))));

describe('takeDamage — percentage mitigation', () => {
    it('reduces damage by defense/(defense + K)', () => {
        const c = new Character();
        c.defense = DEFENSE_K; // exactly 50% mitigation
        expect(c.takeDamage(100).damage).toBe(50);
    });

    it('takes full damage with zero defense', () => {
        const c = new Character();
        c.defense = 0;
        expect(c.takeDamage(40).damage).toBe(40);
    });

    it('never reduces a hit below 1, even with huge defense', () => {
        const c = new Character();
        c.defense = 1000;
        expect(c.takeDamage(3).damage).toBe(1);
    });

    it('applies diminishing returns rather than a hard wall', () => {
        const c = new Character();
        c.defense = 18; // a heavily-armoured monster
        // ~37.5% mitigation, not immunity
        expect(c.takeDamage(20).damage).toBe(expectedDamage(20, 18));
        expect(c.takeDamage(20).damage).toBeGreaterThan(1);
    });
});

describe('monster damage uses its own template defense (not calculateDefense)', () => {
    const db = new MonsterDatabase();

    it('an Orc mitigates per its template defense of 16', () => {
        const orc = db.createMonster('orc', 0, 0);
        expect(orc.defense).toBe(16);
        expect(orc.takeDamage(100).damage).toBe(expectedDamage(100, 16));
    });
});

describe('difficulty scaling boosts the stats monsters actually use', () => {
    const db = new MonsterDatabase();
    const combat = new CombatManager(null); // scaling doesn't touch game

    it('raises attackPower, defense, maxHealth and XP, and refills health', () => {
        const orc = db.createMonster('orc', 0, 0);
        const base = {
            atk: orc.attackPower,
            def: orc.defense,
            hp: orc.maxHealth,
            xp: orc.xpValue
        };

        combat.applyDifficultyScaling(orc, 4);

        expect(orc.attackPower).toBeGreaterThan(base.atk);
        expect(orc.defense).toBeGreaterThan(base.def);
        expect(orc.maxHealth).toBeGreaterThan(base.hp);
        expect(orc.xpValue).toBeGreaterThan(base.xp);
        expect(orc.health).toBe(orc.maxHealth);
    });

    it('leaves difficulty 1 monsters untouched', () => {
        const rat = db.createMonster('rat', 0, 0);
        const atk = rat.attackPower;
        const hp = rat.maxHealth;
        combat.applyDifficultyScaling(rat, 1);
        expect(rat.attackPower).toBe(atk);
        expect(rat.maxHealth).toBe(hp);
    });
});
