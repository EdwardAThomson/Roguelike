import { test, expect } from '@playwright/test';

// The unified tabbed modal (Character / Inventory / Spellbook): real-key
// open/switch/close, fixed frame size across tabs, genuine gameplay pause
// while open, and the prompt()-free hotkey capture flow.

// I/C/B/H are POLLED by the input handler each frame, so hold them long
// enough for the game loop to observe the press.
const HOLD = { delay: 120 };

test('tabbed modal: fixed size, pause, capture-mode spell binding', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    // The whole point of the new binding flow: no native dialogs, ever.
    page.on('dialog', (dialog) => {
        pageErrors.push(`unexpected native dialog: ${dialog.message()}`);
        dialog.dismiss().catch(() => {});
    });

    await page.goto('/');
    await page.locator('#quick-play-btn').click();
    await page.locator('#mode-adventure').click();
    await page.waitForFunction(() => window.__game && window.__game.player, null, { timeout: 10_000 });

    const modal = page.locator('#game-modal');
    await expect(modal).toBeHidden();

    // I opens the modal on the inventory tab and pauses the game.
    await page.keyboard.press('i', HOLD);
    await expect(modal).toBeVisible();
    await expect(page.locator('.gm-tab[data-tab="inventory"]')).toHaveClass(/active/);
    expect(await page.evaluate(() => window.__game.stateManager.state)).toBe('menu');
    const rectInventory = await modal.boundingBox();

    // C switches to the character tab (same open modal), B to spellbook;
    // the frame must not move or resize at all.
    await page.keyboard.press('c', HOLD);
    await expect(page.locator('.gm-tab[data-tab="character"]')).toHaveClass(/active/);
    const rectCharacter = await modal.boundingBox();

    await page.keyboard.press('b', HOLD);
    await expect(page.locator('.gm-tab[data-tab="spellbook"]')).toHaveClass(/active/);
    const rectSpellbook = await modal.boundingBox();

    expect(rectCharacter).toEqual(rectInventory);
    expect(rectSpellbook).toEqual(rectInventory);

    // While paused, arrow keys must not move the player.
    const posBefore = await page.evaluate(() => ({ x: window.__game.player.x, y: window.__game.player.y }));
    await page.keyboard.press('ArrowRight', HOLD);
    await page.waitForTimeout(200);
    const posAfter = await page.evaluate(() => ({ x: window.__game.player.x, y: window.__game.player.y }));
    expect(posAfter).toEqual(posBefore);

    // Capture-mode binding on the spellbook tab: click Assign on the first
    // unlocked spell (magic_dart), hint strip appears, F binds to slot 2.
    await page.locator('.spell-assign-button').first().click();
    await expect(page.locator('.sb-hint')).toHaveClass(/active/);
    await page.keyboard.press('f');
    expect(await page.evaluate(() => window.__game.player.spellbook.spellSlots[2])).toBe('magic_dart');
    await expect(page.locator('.sb-hint')).not.toHaveClass(/active/);

    // Two-stage Escape: first cancels an active capture (modal stays open),
    // second closes the modal and resumes play.
    await page.locator('.spell-assign-button').first().click();
    await expect(page.locator('.sb-hint')).toHaveClass(/active/);
    await page.keyboard.press('Escape');
    await expect(page.locator('.sb-hint')).not.toHaveClass(/active/);
    await expect(modal).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
    expect(await page.evaluate(() => window.__game.stateManager.state)).toBe('playing');

    // Same-key toggle: B opens on spellbook, B again closes.
    await page.keyboard.press('b', HOLD);
    await expect(modal).toBeVisible();
    await page.keyboard.press('b', HOLD);
    await expect(modal).toBeHidden();
    expect(await page.evaluate(() => window.__game.stateManager.state)).toBe('playing');

    expect(pageErrors, `page errors: ${pageErrors.join('\n')}`).toEqual([]);
});
