import { test, expect } from '@playwright/test';

// The HUD in a real browser: L switches between the sidebar and the action
// bar (the map resizes to fit and the choice is remembered), the belt key
// drinks a potion, and the inventory grid selects and equips by keyboard.

const HOLD = { delay: 120 }; // polled keys need to be held for a frame or two
const isResourceLoadNoise = (text) =>
    /Failed to load resource/i.test(text) || /favicon\.ico/i.test(text);

test('HUD layouts, belt quick-use and inventory equip', async ({ page }) => {
    const errors = [];
    page.on('console', (msg) => { if (msg.type() === 'error' && !isResourceLoadNoise(msg.text())) errors.push(msg.text()); });
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('dialog', (d) => { errors.push(`native dialog: ${d.message()}`); d.dismiss(); });

    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('modernrogue.hudLayout'));
    await page.locator('#quick-play-btn').click();
    await page.locator('#mode-adventure').click();
    await page.waitForFunction(() => window.__game && window.__game.player, null, { timeout: 10_000 });

    const main = page.locator('#main-container');
    await expect(main).toHaveClass(/hud-layout-sidebar/);
    await expect(page.locator('.hud-bar-hp')).toBeVisible();
    await expect(page.locator('#message-area')).toContainText('Welcome to Modern Rogue!');

    const canvasBox = () => page.locator('#game-canvas').boundingBox();
    const sidebarBox = await canvasBox();

    // L: action bar. The map gets the full width and the canvas still
    // matches the camera exactly.
    await page.keyboard.press('l');
    await expect(main).toHaveClass(/hud-layout-actionbar/);
    const barBox = await canvasBox();
    expect(barBox.width).toBeGreaterThan(sidebarBox.width);
    expect(await page.evaluate(() => {
        const g = window.__game;
        return g.canvas.width === g.camera.viewportWidth * g.tileSize;
    })).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('modernrogue.hudLayout'))).toBe('actionbar');

    // Belt: hurt the player, press 1, the starting health potion is drunk.
    const before = await page.evaluate(() => {
        const p = window.__game.player;
        p.health = Math.max(1, p.maxHealth - 30);
        const potion = p.inventory.items.find(i => i.type === 'potion');
        return { health: p.health, quantity: potion.quantity };
    });
    await expect(page.locator('.hud-slot.belt.filled').first()).toBeVisible();
    await page.keyboard.press('1', HOLD);
    await expect.poll(() => page.evaluate(() => window.__game.player.health)).toBeGreaterThan(before.health);
    expect(await page.evaluate(() => {
        const potion = window.__game.player.inventory.items.find(i => i.type === 'potion');
        return potion ? potion.quantity : 0;
    })).toBe(before.quantity - 1);

    // Inventory: pick the bow with its number key, see the comparison, equip with E.
    await page.keyboard.press('i', HOLD);
    await expect(page.locator('.inv-grid')).toBeVisible();
    const bowIndex = await page.evaluate(() =>
        window.__game.player.inventory.items.findIndex(i => /bow/i.test(i.name)));
    expect(bowIndex).toBeGreaterThanOrEqual(0);
    await page.mouse.move(5, 5); // keep the pointer off the grid so hover does not preview
    await page.keyboard.press(String(bowIndex + 1));
    await expect(page.locator('.inv-detail-name')).toContainText(/bow/i);
    await expect(page.locator('.inv-stats-caption')).toContainText('Compared with');
    await page.keyboard.press('e');
    await expect.poll(() => page.evaluate(() => window.__game.player.inventory.equipment.weapon?.name))
        .toMatch(/bow/i);
    await page.keyboard.press('Escape');

    // Back to the sidebar, and the menu's Options shows the saved layout.
    await page.keyboard.press('l');
    await expect(main).toHaveClass(/hud-layout-sidebar/);
    await page.keyboard.press('l');
    await page.reload();
    await page.locator('#options-btn').click();
    await expect(page.locator('[data-hud-layout="actionbar"]')).toHaveAttribute('aria-checked', 'true');
    await page.locator('[data-hud-layout="sidebar"]').click();
    expect(await page.evaluate(() => localStorage.getItem('modernrogue.hudLayout'))).toBe('sidebar');

    expect(errors).toEqual([]);
});
