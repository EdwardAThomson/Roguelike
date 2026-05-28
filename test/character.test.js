import { describe, it, expect } from 'vitest';
import { Character, DEFENSE_K } from '../src/js/modules/entity/character.js';

describe('Character derived stats', () => {
    it('derives health and defense from attributes at level 1', () => {
        const c = new Character();
        // base health = 20 + constitution*5 + (level-1)*10
        expect(c.calculateMaxHealth()).toBe(70);
        // defense = floor(constitution/2) + floor(level/3)
        expect(c.calculateDefense()).toBe(5);
    });
});

describe('Character.takeDamage', () => {
    it('mitigates damage by defense/(defense + K)', () => {
        const c = new Character(); // defense 5
        // round(10 * (1 - 5/35)) = round(8.57) = 9
        const result = c.takeDamage(10);
        expect(result.damage).toBe(9);
        expect(result.blocked).toBe(1);
        expect(result.isDead).toBe(false);
        expect(c.health).toBe(c.maxHealth - 9);
    });

    it('exactly halves damage when defense equals K', () => {
        const c = new Character();
        c.defense = DEFENSE_K;
        expect(c.takeDamage(40).damage).toBe(20);
    });

    it('always deals at least 1 damage even against high defense', () => {
        const c = new Character();
        c.defense = 1000; // overwhelming armour
        const result = c.takeDamage(2);
        expect(result.damage).toBe(1);
    });

    it('clamps health at zero and reports death', () => {
        const c = new Character();
        c.health = 3;
        const result = c.takeDamage(999);
        expect(c.health).toBe(0);
        expect(result.isDead).toBe(true);
    });
});

describe('Character leveling', () => {
    it('levels up and grants points when XP crosses the threshold', () => {
        const c = new Character();
        expect(c.experienceToNextLevel).toBe(100);
        const leveled = c.gainExperience(100);
        expect(leveled).toBe(true);
        expect(c.level).toBe(2);
        expect(c.skillPoints).toBe(1);
        expect(c.statPoints).toBe(1);
    });

    it('does not level when XP stays below the threshold', () => {
        const c = new Character();
        expect(c.gainExperience(50)).toBe(false);
        expect(c.level).toBe(1);
    });
});

describe('Character skills', () => {
    it('spends a skill point and raises the skill level', () => {
        const c = new Character();
        c.skillPoints = 1;
        expect(c.spendSkillPoint('toughness')).toBe(true);
        expect(c.getSkillLevel('toughness')).toBe(1);
        expect(c.skillPoints).toBe(0);
    });

    it('refuses to spend when no points are available', () => {
        const c = new Character();
        c.skillPoints = 0;
        expect(c.spendSkillPoint('toughness')).toBe(false);
    });
});
