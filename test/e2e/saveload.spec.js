import { test, expect } from '@playwright/test';

// Real-browser save/load round trip: play, Ctrl+S into actual IndexedDB,
// reload the page, resume via the menu's Continue button, and verify the run
// came back. This is the only tier that exercises IndexedDB itself; the
// serialization logic is covered by the Vitest round-trip suite.

test('saves with Ctrl+S, then continues the run after a page reload', async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/');

    // Fresh browser context: no save yet, so no Continue button. Quick Play
    // opens the mode chooser; pick Hardcore for this run.
    await expect(page.locator('#quick-play-btn')).toBeVisible();
    await expect(page.locator('#continue-btn')).toBeHidden();
    await page.locator('#quick-play-btn').click();
    await expect(page.locator('#mode-select')).toBeVisible();
    await page.locator('#mode-hardcore').click();
    await page.waitForFunction(() => window.__game && window.__game.player, null, { timeout: 10_000 });
    expect(await page.evaluate(() => window.__game.hardcore)).toBe(true);

    // Play a few real turns, then stamp identifiable state.
    for (const key of ['ArrowRight', 'ArrowDown', 'ArrowLeft']) {
        await page.keyboard.press(key);
        await page.waitForTimeout(150);
    }
    const saved = await page.evaluate(() => {
        window.__game.player.inventory.gold = 4321;
        return {
            x: window.__game.player.x,
            y: window.__game.player.y,
            level: window.__game.player.level,
            sectionId: window.__game.worldManager.currentSectionId,
            theme: window.__game.dungeon.theme
        };
    });

    // Manual save via the real keyboard shortcut.
    await page.keyboard.press('Control+s');
    await expect(page.locator('#message-area')).toContainText('Game saved.');

    // Reload: back to the menu, which should now offer Continue with meta,
    // including the run's (immutable) mode.
    await page.reload();
    const continueBtn = page.locator('#continue-btn');
    await expect(continueBtn).toBeVisible();
    await expect(continueBtn).toContainText(`Lv ${saved.level}`);
    await expect(continueBtn).toContainText(saved.sectionId);
    await expect(continueBtn).toContainText('hardcore');

    // Continue bypasses the mode chooser entirely; the run keeps the mode
    // it was created with regardless of any remembered preference.
    await page.evaluate(() => localStorage.setItem('modernrogue.lastMode', 'adventure'));

    // Resume and verify the run state came back from IndexedDB.
    await continueBtn.click();
    await page.waitForFunction(() => window.__game && window.__game.player, null, { timeout: 10_000 });

    const restored = await page.evaluate(() => ({
        x: window.__game.player.x,
        y: window.__game.player.y,
        level: window.__game.player.level,
        gold: window.__game.player.inventory.gold,
        sectionId: window.__game.worldManager.currentSectionId,
        theme: window.__game.dungeon.theme,
        playing: window.__game.stateManager.isPlaying(),
        hardcore: window.__game.hardcore
    }));
    expect(restored.hardcore).toBe(true); // from the save, not the remembered menu preference
    expect(restored.playing).toBe(true);
    expect(restored.x).toBe(saved.x);
    expect(restored.y).toBe(saved.y);
    expect(restored.level).toBe(saved.level);
    expect(restored.gold).toBe(4321);
    expect(restored.sectionId).toBe(saved.sectionId);
    expect(restored.theme).toBe(saved.theme);
    await expect(page.locator('#message-area')).toContainText('Game loaded. Welcome back!');

    expect(pageErrors, `page errors: ${pageErrors.join('\n')}`).toEqual([]);
});
