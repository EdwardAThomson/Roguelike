import { describe, it, expect, beforeEach } from 'vitest';
import { bootFakeGame } from '../helpers/fakeGame.js';
import { AudioDirector } from '../../src/js/modules/audio/audioDirector.js';

// Records what the director asks the engine to play.
function recorder() {
    return {
        sounds: [],
        music: [],
        play(name) { this.sounds.push(name); },
        playMusic(name) { this.music.push(name); }
    };
}

describe('AudioDirector on a live game', () => {
    let game;
    let engine;
    let director;
    let now;
    const frame = (ms = 16) => { now += ms; director.update(game, now); };

    beforeEach(() => {
        game = bootFakeGame();
        // Start out of combat: nobody has noticed the player yet.
        for (const m of game.monsters) m.awareOfPlayer = false;
        engine = recorder();
        director = new AudioDirector(engine);
        now = 0;
        frame();
        engine.sounds.length = 0;
    });

    it('plays the section theme and stays quiet when nothing happens', () => {
        expect(engine.music).toEqual([game.dungeon.theme]);
        frame();
        frame();
        expect(engine.sounds).toEqual([]);
    });

    it('hurts, heals and levels up', () => {
        game.player.health -= 3;
        frame();
        game.player.health += 2;
        frame();
        game.player.gainExperience(100000);
        frame();
        expect(engine.sounds).toEqual(['hurt', 'heal', 'levelup']);
    });

    it('hits and kills monsters', () => {
        const [a, b] = game.monsters;
        a.health -= 1;
        frame();
        game.monsters = game.monsters.filter(m => m !== b);
        frame();
        expect(engine.sounds).toEqual(['hit', 'kill']);
    });

    it('picks up items, keys and gold, and equips gear', () => {
        const inv = game.player.inventory;
        inv.addItem({ id: 'test_trinket', type: 'misc', name: 'Trinket' });
        frame();
        inv.addItem({ id: 'gate_key', type: 'key', name: 'Gate Key', gateId: 1 });
        frame();
        inv.gold += 10;
        frame();
        const weaponSlot = Object.keys(inv.equipment).find(s => inv.equipment[s]);
        inv.unequipItem(weaponSlot, game.player);
        frame();
        expect(engine.sounds).toEqual(['pickup', 'key', 'gold', 'equip']);
    });

    it('opens gates, launches spells and blasts', () => {
        game.dungeon.gates[0].locked = true;
        frame();
        game.dungeon.gates[0].locked = false;
        frame();
        const bolt = { damageType: 'fire', aoeRadius: 2 };
        game.projectileManager.projectiles.push(bolt);
        frame();
        game.projectileManager.projectiles.length = 0;
        frame();
        expect(engine.sounds).toEqual(['gate', 'cast_fire', 'explode']);
    });

    it('chimes on pause and on section change without false kills', () => {
        game.stateManager.openMenu();
        frame();
        game.stateManager.closeMenu();
        frame();
        game.worldManager.transitionToSection(1, 0, 'west');
        frame();
        expect(engine.sounds).toEqual(['uiOpen', 'uiClose', 'transition']);
        expect(engine.music.at(-1)).toBe(game.dungeon.theme);
    });

    it('switches to battle music while an aware monster is in sight, then back', () => {
        const m = game.monsters[0];
        m.x = game.player.x + 2;
        m.y = game.player.y;
        m.awareOfPlayer = true;
        game.fov.visible.add(`${m.x},${m.y}`);
        frame();
        expect(engine.music.at(-1)).toBe('combat');
        m.awareOfPlayer = false;
        frame(1000);
        expect(engine.music.at(-1)).toBe('combat'); // held briefly
        frame(5000);
        expect(engine.music.at(-1)).toBe(game.dungeon.theme);
    });

    it('plays the death sound and dirge on game over', () => {
        game.stateManager.setState('gameOver');
        frame();
        expect(engine.sounds).toEqual(['death']);
        expect(engine.music.at(-1)).toBe('death');
    });
});
