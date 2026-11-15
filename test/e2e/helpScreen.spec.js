import { test, expect } from '@playwright/test';

// The Help overlay (H) uses the same fixed frame as the game modal: every
// page opens at exactly the same size and only the page body scrolls.

test('help screen keeps one fixed size across pages', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');
    await page.locator('#quick-play-btn').click();
    await page.locator('#mode-adventure').click();
    await page.waitForFunction(() => window.__game && window.__game.player, null, { timeout: 10_000 });

    const help = page.locator('#help-screen');
    // H is polled by the input handler each frame, so hold it briefly.
    await page.keyboard.press('h', { delay: 120 });
    await expect(help).toBeVisible();

    const boxes = [];
    for (const pg of ['controls', 'items', 'stats', 'about']) {
        await help.locator(`.help-tab[data-page="${pg}"]`).click();
        await expect(help.locator(`.help-tab[data-page="${pg}"]`)).toHaveClass(/active/);
        boxes.push(await help.boundingBox());
    }
    for (const box of boxes) expect(box).toEqual(boxes[0]);

    await page.keyboard.press('Escape');
    await expect(help).toBeHidden();
    expect(pageErrors).toEqual([]);
});
