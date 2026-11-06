// Decides what the player hears. Like the render EffectsTracker, the
// director only OBSERVES game state once per frame (health, levels, items,
// gates, monsters, projectiles, the pause state) and turns the differences
// into sound effects and music changes, so gameplay code needs no audio
// calls and sound can never change how the game plays.
//
// It talks to any object with play(name) and playMusic(name), so tests can
// pass a recorder instead of the Web Audio engine.

import { projectileSfx } from './sfxPresets.js';
import { trackForTheme } from './musicTracks.js';

const COMBAT_RANGE = 8;     // an aware monster this close (and visible) means a fight
const COMBAT_HOLD_MS = 4000; // keep the battle music this long after the last sighting
const HEAL_REPEAT_MS = 600;  // regeneration ticks should not chime every turn

const chebyshev = (a, b) => Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

export class AudioDirector {
    constructor(engine) {
        this.engine = engine;
        this.prev = null;
        this.lastCombatAt = -Infinity;
        this.lastHealAt = -Infinity;
        this.music = null;
    }

    snapshot(game) {
        const player = game.player;
        const inv = player && player.inventory;
        const equipped = inv ? Object.values(inv.equipment || {}).filter(Boolean) : [];
        const dungeon = game.dungeon;
        return {
            dungeon,
            theme: dungeon && dungeon.theme,
            state: game.stateManager ? game.stateManager.state : 'playing',
            player,
            hp: player ? player.health : 0,
            mana: player ? player.mana : 0,
            level: player ? player.level : 0,
            gold: inv ? inv.gold || 0 : 0,
            items: new Set(inv ? [...(inv.items || []), ...equipped] : []),
            equipped: new Set(equipped),
            openGates: dungeon && Array.isArray(dungeon.gates) ? dungeon.gates.filter(g => !g.locked).length : 0,
            monsters: new Map((game.monsters || []).map(m => [m, m.health])),
            projectiles: new Set(game.projectileManager ? game.projectileManager.projectiles || [] : [])
        };
    }

    update(game, now = Date.now()) {
        if (!game || !game.player) return;
        const cur = this.snapshot(game);
        const prev = this.prev;
        this.prev = cur;
        if (prev && prev.player === cur.player) this.compare(prev, cur, now);
        this.updateMusic(game, cur, now);
    }

    play(name) {
        if (name && this.engine) this.engine.play(name);
    }

    compare(prev, cur, now) {
        // Death and pause screens.
        if (cur.state === 'gameOver' && prev.state !== 'gameOver') {
            this.play('death');
            return;
        }
        if (cur.state === 'menu' && prev.state !== 'menu') this.play('uiOpen');
        if (prev.state === 'menu' && cur.state === 'playing') this.play('uiClose');

        // A new section: everything else differs for unrelated reasons.
        if (cur.dungeon !== prev.dungeon) {
            this.play('transition');
            return;
        }

        // Player.
        if (cur.level > prev.level) {
            this.play('levelup');
        } else if (cur.hp < prev.hp) {
            this.play('hurt');
        } else if (cur.hp > prev.hp && now - this.lastHealAt > HEAL_REPEAT_MS) {
            this.lastHealAt = now;
            this.play('heal');
        }
        if (cur.mana > prev.mana + 1 && cur.level === prev.level) this.play('mana');

        // Items: new things in the pack, gold, and gear changes.
        let pickedUp = null;
        for (const item of cur.items) {
            if (!prev.items.has(item)) {
                pickedUp = item.type === 'key' || item.gateId ? 'key' : pickedUp || 'pickup';
            }
        }
        if (pickedUp) this.play(pickedUp);
        if (cur.gold > prev.gold) this.play('gold');
        if (!pickedUp && !sameSet(cur.equipped, prev.equipped)) this.play('equip');

        if (cur.openGates > prev.openGates) this.play('gate');

        // Monsters: wounds and kills.
        let hit = false;
        let killed = false;
        for (const [monster, hp] of prev.monsters) {
            if (!cur.monsters.has(monster) || monster.health <= 0) {
                if (hp > 0) killed = true;
            } else if (cur.monsters.get(monster) < hp) {
                hit = true;
            }
        }
        if (killed) this.play('kill');
        else if (hit) this.play('hit');

        // Projectiles: a launch sound per new bolt, a blast for area spells.
        for (const p of cur.projectiles) {
            if (!prev.projectiles.has(p)) this.play(projectileSfx(p.damageType));
        }
        for (const p of prev.projectiles) {
            if (!cur.projectiles.has(p) && p.aoeRadius > 0) this.play('explode');
        }
    }

    // Theme music, battle music while an aware monster is in sight, and a
    // short dirge on death.
    updateMusic(game, cur, now) {
        let want;
        if (cur.state === 'gameOver') {
            want = 'death';
        } else {
            if (this.inCombat(game, cur.player)) this.lastCombatAt = now;
            want = now - this.lastCombatAt < COMBAT_HOLD_MS ? 'combat' : trackForTheme(cur.theme);
        }
        if (want !== this.music) {
            this.music = want;
            if (this.engine) this.engine.playMusic(want);
        }
    }

    inCombat(game, player) {
        const fov = game.fov;
        return (game.monsters || []).some(m =>
            m.health > 0 &&
            m.awareOfPlayer &&
            chebyshev(m, player) <= COMBAT_RANGE &&
            (!fov || typeof fov.isTileVisible !== 'function' || fov.isTileVisible(m.x, m.y)));
    }
}

function sameSet(a, b) {
    if (a.size !== b.size) return false;
    for (const x of a) if (!b.has(x)) return false;
    return true;
}
