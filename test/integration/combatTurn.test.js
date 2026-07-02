import { describe, it, expect } from 'vitest';
import { bootFakeGame } from '../helpers/fakeGame.js';

// Exercise the full melee kill flow end-to-end: handlePlayerAttack →
// handleMeleeAttack → monster.takeDamageFromPlayer → monster.takeDamage →
// XP grant + monster removal + loot drop. Everything we've been fixing this
// session (double-defense, XP scaling, corpse removal) runs live here.

function placeMonsterNextToPlayer(game, type = 'rat') {
    const monster = game.monsterDB.createMonster(type, game.player.x + 1, game.player.y);
    game.monsters = [monster];
    return monster;
}

describe('melee kill flow', () => {
    it('one hit lands damage without removing a healthy monster', () => {
        const game = bootFakeGame();
        const rat = placeMonsterNextToPlayer(game);
        // Ensure it survives (rat HP 24, one hit does ~11 avg under new model)
        rat.health = rat.maxHealth;
        const xpBefore = game.player.experience;

        game.combat.handlePlayerAttack(rat.x, rat.y);

        expect(rat.health).toBeLessThan(rat.maxHealth);
        expect(rat.health).toBeGreaterThan(0);
        expect(game.monsters).toContain(rat);
        expect(game.player.experience).toBe(xpBefore); // no XP until dead
    });

    it('the killing blow removes the monster and grants XP', () => {
        const game = bootFakeGame();
        const rat = placeMonsterNextToPlayer(game);
        rat.health = 1; // one hit will finish it
        const xpBefore = game.player.experience;

        game.combat.handlePlayerAttack(rat.x, rat.y);

        expect(rat.health).toBeLessThanOrEqual(0);
        expect(game.monsters).not.toContain(rat);
        expect(game.player.experience).toBeGreaterThan(xpBefore);
    });

    it('mitigation stops damage from doubling (regression for the double-defense bug)', () => {
        const game = bootFakeGame();
        // An Orc has DEF 16 → percentage mitigation should keep hits comfortably
        // above the 1-damage floor. Under the old double-subtraction bug an
        // Orc took 1 per hit almost always. Assert we're doing better than that.
        const orc = placeMonsterNextToPlayer(game, 'orc');
        orc.health = orc.maxHealth;

        const startHealth = orc.health;
        // Multiple hits to average out variance/crit.
        for (let i = 0; i < 3; i++) {
            if (orc.health > 0) game.combat.handlePlayerAttack(orc.x, orc.y);
        }
        const totalDamage = startHealth - Math.max(0, orc.health);
        // 3 hits × >1 dmg each; even with rotten variance we should see > 3.
        expect(totalDamage).toBeGreaterThan(3);
    });
});
