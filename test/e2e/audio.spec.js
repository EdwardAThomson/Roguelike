import { test, expect } from '@playwright/test';

// Sound in a real browser: the title music is waiting for the first
// gesture, the game swaps to the section theme, effects play without
// errors, N mutes (and is remembered), and Options has the volume sliders.

const isResourceLoadNoise = (text) =>
    /Failed to load resource/i.test(text) || /favicon\.ico/i.test(text);

test('music, effects, mute and volume options', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => { if (msg.type() === 'error' && !isResourceLoadNoise(msg.text())) errors.push(msg.text()); });
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('dialog', (d) => { errors.push(`native dialog: ${d.message()}`); d.dismiss(); });

    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('modernrogue.audio'));

    // Options: three sliders and a mute switch, saved per player.
    await page.locator('#options-btn').click();
    const music = page.locator('[data-volume="music"]');
    await expect(music).toBeVisible();
    await expect(page.locator('[data-volume]')).toHaveCount(3);
    await music.fill('20');
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('modernrogue.audio')).music)).toBeCloseTo(0.2);
    await page.locator('#menu-modal-close').click();

    await page.locator('#quick-play-btn').click();
    await page.locator('#mode-adventure').click();
    await page.waitForFunction(() => window.__game && window.__game.player, null, { timeout: 10_000 });

    // The clicks unlocked audio; the director swapped the title tune for
    // the section's theme.
    await page.waitForFunction(() => window.__game.audio.ctx && window.__game.audio.ctx.state === 'running');
    const state = await page.evaluate(() => {
        const g = window.__game;
        return { music: g.audio.musicName, theme: g.dungeon.theme, tracks: g.audio.tracks.length };
    });
    expect(['combat', state.theme]).toContain(state.music);
    expect(state.tracks).toBeGreaterThan(0);

    // Every effect can be synthesized.
    const played = await page.evaluate(async () => {
        const { SFX_NAMES } = await import('/src/js/modules/audio/sfxPresets.js');
        const a = window.__game.audio;
        return SFX_NAMES.filter(name => { a.liveVoices = 0; return a.play(name); }).length === SFX_NAMES.length;
    });
    expect(played).toBe(true);

    // Hurting the player is heard (the director asks the engine for 'hurt').
    await page.evaluate(() => {
        const a = window.__game.audio;
        a.heard = [];
        const play = a.play.bind(a);
        a.play = (name) => { a.heard.push(name); return play(name); };
        window.__game.player.health -= 1;
    });
    await page.waitForFunction(() => window.__game.audio.heard.includes('hurt'));

    // N mutes and the choice is remembered.
    await page.keyboard.press('n');
    expect(await page.evaluate(() => window.__game.audio.settings.muted)).toBe(true);
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('modernrogue.audio')).muted)).toBe(true);
    await expect(page.locator('#message-area')).toContainText('Sound off');
    await page.keyboard.press('n');
    expect(await page.evaluate(() => window.__game.audio.settings.muted)).toBe(false);

    expect(errors).toEqual([]);
});
