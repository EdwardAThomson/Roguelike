import { test, expect } from '@playwright/test';

// The graphics styles in the real browser: T cycles both, each one renders
// frames without errors, and the choice is remembered and shown in Options.

const isResourceLoadNoise = (text) =>
    /Failed to load resource/i.test(text) || /favicon\.ico/i.test(text) || /menu-background/i.test(text);

test('T cycles every graphics style and the choice persists', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => { if (msg.type() === 'error' && !isResourceLoadNoise(msg.text())) errors.push(msg.text()); });
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('dialog', (d) => { errors.push(`native dialog: ${d.message()}`); d.dismiss(); });

    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('modernrogue.displayMode'));
    await page.locator('#quick-play-btn').click();
    await page.locator('#mode-adventure').click();
    await page.waitForFunction(() => window.__game && window.__game.player, null, { timeout: 10_000 });

    const state = () => page.evaluate(() => ({
        mode: window.__game.displayMode,
        tileSize: window.__game.tileSize,
        canvasWidth: window.__game.canvas.width,
        viewportWidth: window.__game.camera.viewportWidth
    }));

    const first = await state();
    expect(first.mode).toBe('classic');
    expect(first.tileSize).toBe(24);
    expect(first.canvasWidth).toBe(first.viewportWidth * 24);

    const seen = [first.mode];
    for (let i = 0; i < 2; i++) {
        await page.keyboard.press('t');
        await page.waitForTimeout(250); // a few frames in the new style
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(200);
        const s = await state();
        expect(s.canvasWidth).toBe(s.viewportWidth * s.tileSize);
        seen.push(s.mode);
    }
    expect(seen).toEqual(['classic', 'ascii', 'classic']);

    // Pick ASCII and check the menu's Options shows it after a reload.
    await page.keyboard.press('t');
    expect((await state()).mode).toBe('ascii');
    await page.reload();
    await page.locator('#options-btn').click();
    await expect(page.locator('[data-display-mode="ascii"]')).toHaveAttribute('aria-checked', 'true');
    await page.locator('[data-display-mode="classic"]').click();
    await expect(page.locator('[data-display-mode="classic"]')).toHaveAttribute('aria-checked', 'true');
    expect(await page.evaluate(() => localStorage.getItem('modernrogue.displayMode'))).toBe('classic');

    expect(errors).toEqual([]);
});
