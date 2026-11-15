import { test, expect } from '@playwright/test';

// The Map tab (M): opens on Area mode and pauses, switches to the World view
// and back, closes on M, and leaves Shift+M as the map-reveal cheat.

// UI keys are POLLED by the input handler each frame, so hold them long
// enough for the game loop to observe the press.
const HOLD = { delay: 120 };

test('M opens the map tab with area and world modes', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('dialog', (dialog) => {
        pageErrors.push(`unexpected native dialog: ${dialog.message()}`);
        dialog.dismiss().catch(() => {});
    });

    await page.goto('/');
    await page.locator('#quick-play-btn').click();
    await page.locator('#mode-adventure').click();
    await page.waitForFunction(() => window.__game && window.__game.player, null, { timeout: 10_000 });

    // Visit a neighbour so the world view has more than one section.
    await page.evaluate(() => window.__game.worldManager.transitionToSection(1, 0, 'east'));

    const modal = page.locator('#game-modal');
    await page.keyboard.press('m', HOLD);
    await expect(modal).toBeVisible();
    await expect(page.locator('.gm-tab[data-tab="map"]')).toHaveClass(/active/);
    await expect(page.locator('.wm-mode[data-mode="area"]')).toHaveClass(/active/);
    await expect(page.locator('.wm-title')).toContainText('1, 0');
    expect(await page.evaluate(() => window.__game.stateManager.state)).toBe('menu');

    // Something was actually drawn: the canvas is not a single flat colour.
    const distinctColours = () => page.evaluate(() => {
        const canvas = document.querySelector('.wm-canvas');
        const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
        const seen = new Set();
        for (let i = 0; i < data.length; i += 4 * 37) seen.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
        return seen.size;
    });
    expect(await distinctColours()).toBeGreaterThan(3);

    // 2 switches to the world view; both visited sections are listed.
    await page.keyboard.press('2');
    await expect(page.locator('.wm-mode[data-mode="world"]')).toHaveClass(/active/);
    await expect(page.locator('.wm-footer')).toContainText('2 sections explored');
    expect(await distinctColours()).toBeGreaterThan(3);

    // Tab flips back to area.
    await page.keyboard.press('Tab');
    await expect(page.locator('.wm-mode[data-mode="area"]')).toHaveClass(/active/);

    // M on its own tab closes the modal and resumes play.
    await page.keyboard.press('m', HOLD);
    await expect(modal).toBeHidden();
    expect(await page.evaluate(() => window.__game.stateManager.state)).toBe('playing');

    // Shift+M is the reveal cheat and must not open the map.
    await page.keyboard.down('Shift');
    await page.keyboard.press('M', HOLD);
    await page.keyboard.up('Shift');
    await page.waitForTimeout(150);
    await expect(modal).toBeHidden();
    expect(await page.evaluate(() => window.__game.stateManager.mapRevealed)).toBe(true);

    expect(pageErrors).toEqual([]);
});
