import { test, expect } from '@playwright/test';

// Single boot-and-play smoke test. Catches the class of regressions Vitest
// can't touch: real DOM wire-up, sprite loading, input listeners, the
// requestAnimationFrame loop, and the menu → game handoff.

test('boots from the menu, initializes managers, and survives a few input turns', async ({ page }) => {
    // Fail fast on runtime errors / console errors from real gameplay code.
    // Resource-load 404s (menu-background.jpg, favicon.ico) are known cosmetic
    // gaps and get filtered out — we care about JS runtime health, not assets.
    const isResourceLoadNoise = (text) =>
        /Failed to load resource/i.test(text) ||
        /favicon\.ico/i.test(text) ||
        /menu-background/i.test(text);

    const consoleErrors = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error' && !isResourceLoadNoise(msg.text())) {
            consoleErrors.push(msg.text());
        }
    });
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');

    // Menu is rendered — Quick Play opens the mode chooser; pick Adventure.
    await expect(page.locator('#quick-play-btn')).toBeVisible();
    await page.locator('#quick-play-btn').click();
    await expect(page.locator('#mode-select')).toBeVisible();
    await page.locator('#mode-adventure').click();

    // main.js exposes the live game object on window.__game once init runs.
    await page.waitForFunction(() => window.__game && window.__game.player, null, { timeout: 10_000 });

    // Sanity: game is in the expected initial state.
    const initial = await page.evaluate(() => ({
        health: window.__game.player.health,
        maxHealth: window.__game.player.maxHealth,
        theme: window.__game.dungeon.theme,
        monsterCount: window.__game.monsters.length,
        playing: window.__game.stateManager.isPlaying(),
        sectionId: window.__game.dungeon.worldSectionId
    }));

    expect(initial.playing).toBe(true);
    expect(initial.sectionId).toBe('0_0');
    expect(initial.theme).toBe('castle');            // '0_0' is pinned
    expect(initial.health).toBeGreaterThan(0);
    expect(initial.health).toBe(initial.maxHealth);
    expect(initial.monsterCount).toBeGreaterThan(0);

    // Play a handful of turns via the real keyboard listener. Any direction
    // works — we don't care about outcome, just that the input path doesn't
    // throw and the loop keeps ticking.
    const canvas = page.locator('#game-canvas');
    await canvas.focus().catch(() => {}); // canvas isn't focusable, but page has focus
    for (const key of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'ArrowRight']) {
        await page.keyboard.press(key);
        await page.waitForTimeout(150); // longer than the 125ms moveDelay
    }

    // After input, the game should still be alive and running.
    const after = await page.evaluate(() => ({
        health: window.__game.player.health,
        playing: window.__game.stateManager.isPlaying(),
        theme: window.__game.dungeon.theme
    }));
    expect(after.playing).toBe(true);
    expect(after.health).toBeGreaterThan(0);
    expect(after.theme).toBe(initial.theme);

    // Whole run should be quiet — no runtime exceptions, no console.errors.
    expect(pageErrors, `page errors: ${pageErrors.join('\n')}`).toEqual([]);
    expect(consoleErrors, `console errors: ${consoleErrors.join('\n')}`).toEqual([]);
});
