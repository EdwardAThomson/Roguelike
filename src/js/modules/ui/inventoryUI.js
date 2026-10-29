import { itemIconHtml, emptySlotIconHtml, spriteIconHtml } from '../render/itemIcons.js';
import { escapeHtml } from './hud.js';

// The inventory tab of the game modal: equipped gear on the left, the pack as
// a grid in the middle, and a detail pane on the right that shows the
// selected (or hovered) item, how it compares with what is equipped, and its
// actions. Styles live in src/css/style.css (.inv-*).

const EQUIP_SLOTS = [
    ['head', 'Head'], ['body', 'Body'], ['feet', 'Feet'], ['weapon', 'Weapon'],
    ['offhand', 'Off-hand'], ['ring', 'Ring'], ['amulet', 'Amulet']
];

const STAT_LABELS = {
    attackPower: 'Attack',
    defense: 'Defense',
    criticalChance: 'Crit %',
    maxHealth: 'Max HP',
    maxMana: 'Max MP',
    strength: 'Strength',
    dexterity: 'Dexterity',
    constitution: 'Constitution',
    intelligence: 'Intelligence',
    healAmount: 'Heals',
    manaRestore: 'Restores MP'
};

// Stat rows for an item, with the change against the item currently equipped
// in the same slot (delta is null when nothing is there to compare with).
export function compareStats(item, equipped) {
    const stats = (item && item.stats) || {};
    const other = (equipped && equipped.stats) || {};
    const keys = [...new Set([...Object.keys(stats), ...(equipped ? Object.keys(other) : [])])];
    return keys.map(key => {
        const value = stats[key] || 0;
        return {
            key,
            label: STAT_LABELS[key] || key,
            value,
            delta: equipped ? value - (other[key] || 0) : null
        };
    });
}

export class InventoryUI {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.selectedItemIndex = -1;
        this.selectedEquipSlot = null;
        this.hovered = null; // { kind: 'item'|'slot', key } previewed in the detail pane
        this.dropMode = false;
        this.panelEl = null; // inventory tab panel inside the game modal
    }

    // GameModal provider interface: the inventory tab.
    mountPanel(panelEl) {
        this.panelEl = panelEl;
        panelEl.addEventListener('click', (e) => this.handleClick(e));
        panelEl.addEventListener('mouseover', (e) => {
            const target = e.target.closest('[data-index], [data-slot]');
            if (!target) {
                // Off the items (e.g. onto the detail pane's buttons): show the selection again.
                if (this.hovered) {
                    this.hovered = null;
                    this.renderDetail();
                }
                return;
            }
            const hovered = target.dataset.index != null
                ? { kind: 'item', key: Number(target.dataset.index) }
                : { kind: 'slot', key: target.dataset.slot };
            if (!this.hovered || this.hovered.kind !== hovered.kind || this.hovered.key !== hovered.key) {
                this.hovered = hovered;
                this.renderDetail();
            }
        });
        panelEl.addEventListener('mouseleave', () => {
            if (this.hovered) {
                this.hovered = null;
                this.renderDetail();
            }
        });
    }

    onShow(options = {}) {
        this.isOpen = true;
        this.dropMode = !!options.dropMode;
        this.updateInventory();
    }

    onHide() {
        this.isOpen = false;
        this.dropMode = false;
        this.selectedItemIndex = -1;
        this.selectedEquipSlot = null;
        this.hovered = null;
    }

    // Per-tab keys, delegated from the GameModal keydown handler while this
    // tab is active (Escape is handled by the shell).
    handleKey(e) {
        const items = this.game.player.inventory.items;
        const numKey = parseInt(e.key);
        const isNumber = !isNaN(numKey) && numKey >= 1 && numKey <= 9;

        if (this.dropMode) {
            // Z exits drop mode (Escape does too, via the shell close).
            if (e.key === 'z' || e.key === 'Z') {
                this.game.ui.gameModal.close();
                return;
            }
            if (isNumber && numKey - 1 < items.length) {
                this.handleItemAction('drop', numKey - 1);
            }
            return;
        }

        const selected = items[this.selectedItemIndex];
        const key = e.key.toLowerCase();
        if (key === 'e' && selected && selected.canEquip) {
            this.handleItemAction('equip', this.selectedItemIndex);
            return;
        }
        if (key === 'u' && selected && selected.canUse) {
            this.handleItemAction('use', this.selectedItemIndex);
            return;
        }
        if (key === 'd' && selected) {
            this.handleItemAction('drop', this.selectedItemIndex);
            return;
        }
        // Number keys select; Shift+number equips, Alt+number uses
        if (isNumber && numKey - 1 < items.length) {
            const index = numKey - 1;
            this.selectItem(index);
            const item = items[index];
            if (e.altKey && item.canUse) {
                this.handleItemAction('use', index);
            } else if (e.shiftKey && item.canEquip) {
                this.handleItemAction('equip', index);
            }
        }
    }

    handleClick(e) {
        const action = e.target.closest('[data-action]');
        if (action) {
            if (action.dataset.action === 'unequip') {
                this.handleEquipAction('unequip', this.selectedEquipSlot);
            } else {
                this.handleItemAction(action.dataset.action, this.selectedItemIndex);
            }
            return;
        }
        const cell = e.target.closest('[data-index]');
        if (cell) {
            const index = Number(cell.dataset.index);
            if (this.dropMode) {
                this.handleItemAction('drop', index);
            } else {
                this.selectItem(index);
            }
            return;
        }
        const slot = e.target.closest('[data-slot]');
        if (slot) {
            this.selectEquipSlot(slot.dataset.slot);
        }
    }

    updateInventory() {
        if (!this.isOpen || !this.panelEl) return;

        const inventory = this.game.player.inventory;
        if (this.selectedItemIndex >= inventory.items.length) this.selectedItemIndex = -1;

        const slotsHtml = EQUIP_SLOTS.map(([slot, label]) => {
            const item = inventory.equipment[slot];
            const selected = slot === this.selectedEquipSlot ? 'selected' : '';
            return `
                <button type="button" class="inv-equip ${item ? 'filled' : 'empty'} ${selected}" data-slot="${slot}">
                    <span class="inv-equip-icon">${item ? itemIconHtml(item) : emptySlotIconHtml(slot)}</span>
                    <span class="inv-equip-text">
                        <span class="inv-equip-slot">${label}</span>
                        <span class="inv-equip-name ${item ? `rarity-${escapeHtml(item.rarity)}` : ''}">${item ? escapeHtml(item.name) : 'Empty'}</span>
                    </span>
                </button>`;
        }).join('');

        const cells = [];
        for (let i = 0; i < inventory.maxSize; i++) {
            const item = inventory.items[i];
            if (!item) {
                cells.push('<div class="inv-cell empty" aria-hidden="true"></div>');
                continue;
            }
            const selected = i === this.selectedItemIndex ? 'selected' : '';
            const quantity = item.stackable && item.quantity > 1 ? item.quantity : '';
            cells.push(`
                <button type="button" class="inv-cell rarity-border-${escapeHtml(item.rarity)} ${selected}" data-index="${i}"
                    aria-label="${escapeHtml(item.name)}${quantity ? ` x${quantity}` : ''}">
                    ${itemIconHtml(item)}
                    ${i < 9 ? `<span class="inv-cell-key">${i + 1}</span>` : ''}
                    <span class="inv-cell-qty">${quantity}</span>
                </button>`);
        }

        const hint = this.dropMode
            ? 'Click an item or press its number to drop it · <kbd>Z</kbd> or <kbd>Esc</kbd> to cancel'
            : '<kbd>1</kbd>–<kbd>9</kbd> select · <kbd>E</kbd> equip · <kbd>U</kbd> use · <kbd>D</kbd> drop · Shift+number equips · Alt+number uses';

        this.panelEl.innerHTML = `
            <div class="inv-layout">
                <section class="inv-equipped" aria-label="Equipped">
                    <h3 class="inv-heading">Equipped</h3>
                    ${slotsHtml}
                </section>
                <section class="inv-pack" aria-label="Pack">
                    <div class="inv-pack-head">
                        <h3 class="inv-heading">${this.dropMode ? 'Choose an item to drop' : 'Pack'}</h3>
                        <span class="inv-pack-meta">
                            <span>${inventory.items.length} / ${inventory.maxSize}</span>
                            <span class="inv-gold">${spriteIconHtml('gold', 'pixel-icon-inline')} ${inventory.gold}</span>
                        </span>
                    </div>
                    <div class="inv-grid">${cells.join('')}</div>
                    <p class="inv-hint">${hint}</p>
                </section>
                <section class="inv-detail" aria-label="Item details" aria-live="polite"></section>
            </div>`;
        this.renderDetail();
    }

    // What the detail pane shows: the hovered item, else the selection.
    detailTarget() {
        return this.resolveTarget(this.hovered) || this.resolveTarget(this.selectedEquipSlot
            ? { kind: 'slot', key: this.selectedEquipSlot }
            : this.selectedItemIndex >= 0 ? { kind: 'item', key: this.selectedItemIndex } : null);
    }

    resolveTarget(pick) {
        if (!pick) return null;
        const inventory = this.game.player.inventory;
        if (pick.kind === 'slot') {
            const item = inventory.equipment[pick.key];
            return item ? { item, slot: pick.key, equipped: true,
                isSelection: pick.key === this.selectedEquipSlot } : null;
        }
        const item = inventory.items[pick.key];
        return item ? { item, index: pick.key, equipped: false,
            isSelection: pick.key === this.selectedItemIndex && !this.selectedEquipSlot } : null;
    }

    renderDetail() {
        const pane = this.panelEl && this.panelEl.querySelector('.inv-detail');
        if (!pane) return;
        const target = this.detailTarget();
        if (!target) {
            pane.innerHTML = '<p class="inv-detail-empty">Select an item to see its details.</p>';
            return;
        }

        const inventory = this.game.player.inventory;
        const { item } = target;
        const rarity = item.rarity || 'common';
        const rarityName = rarity.charAt(0).toUpperCase() + rarity.slice(1);
        const current = !target.equipped && item.canEquip && item.slot ? inventory.equipment[item.slot] : null;
        const rows = compareStats(item, current);
        const statsHtml = rows.length ? `
            <div class="inv-stats">
                ${current ? `<div class="inv-stats-caption">Compared with ${escapeHtml(current.name)}</div>` : ''}
                ${rows.map(r => `
                    <div class="inv-stat-row">
                        <span>${escapeHtml(r.label)}</span>
                        <span>${r.value > 0 && r.key !== 'healAmount' && r.key !== 'manaRestore' ? '+' : ''}${r.value}${
                            r.delta ? ` <span class="${r.delta > 0 ? 'inv-up' : 'inv-down'}">(${r.delta > 0 ? '+' : '−'}${Math.abs(r.delta)})</span>` : ''}</span>
                    </div>`).join('')}
                ${item.isRanged && item.isRanged() ? `<div class="inv-stat-row"><span>Range</span><span>${item.range}</span></div>` : ''}
            </div>` : '';

        let actions = '';
        if (target.isSelection) {
            if (target.equipped) {
                const full = inventory.items.length >= inventory.maxSize;
                actions = `<button type="button" class="inv-action" data-action="unequip" ${full ? 'disabled' : ''}>
                    ${full ? 'Pack full' : 'Unequip'}</button>`;
            } else {
                const buttons = [];
                if (item.canUse) buttons.push(['use', 'Use', 'U']);
                if (item.canEquip && item.slot) buttons.push(['equip', current ? 'Swap' : 'Equip', 'E']);
                buttons.push(['drop', 'Drop', 'D']);
                actions = buttons.map(([action, label, key], i) => `
                    <button type="button" class="inv-action ${i === 0 ? 'primary' : ''}" data-action="${action}">
                        ${label} <kbd>${key}</kbd></button>`).join('');
            }
        } else {
            actions = `<p class="inv-detail-empty">${target.equipped ? 'Click to select it and unequip.' : 'Click to select it for actions.'}</p>`;
        }

        pane.innerHTML = `
            <div class="inv-detail-head">
                <div class="inv-detail-icon rarity-border-${escapeHtml(rarity)}">${itemIconHtml(item)}</div>
                <div>
                    <div class="inv-detail-name rarity-${escapeHtml(rarity)}">${escapeHtml(item.name)}</div>
                    <div class="inv-detail-type">${rarityName} · ${escapeHtml(this.getItemTypeDescription(item))}${target.equipped ? ' · equipped' : ''}</div>
                </div>
            </div>
            ${item.description ? `<p class="inv-detail-desc">${escapeHtml(item.description)}</p>` : ''}
            ${statsHtml}
            <div class="inv-actions">${actions}</div>`;
    }

    selectItem(index) {
        if (!this.game.player.inventory.items[index]) return;
        this.selectedItemIndex = index;
        this.selectedEquipSlot = null;
        this.hovered = null;
        this.updateInventory();
    }

    selectEquipSlot(slot) {
        if (!this.game.player.inventory.equipment[slot]) return;
        this.selectedEquipSlot = slot;
        this.selectedItemIndex = -1;
        this.hovered = null;
        this.updateInventory();
    }

    handleItemAction(action, index) {
        const inventory = this.game.player.inventory;
        const item = inventory.items[index];

        if (!item) return;

        console.log(`Handling item action: ${action} for item ${item.name} at index ${index}`);

        switch (action) {
            case 'use':
                this.game.player.useItemFromInventory(index, this.game);
                break;

            case 'equip':
                this.game.player.equipItemFromInventory(index, this.game);
                this.selectedItemIndex = -1;
                break;

            case 'drop':
                this.dropItem(index);
                this.selectedItemIndex = -1;
                break;
        }

        this.hovered = null;
        this.updateInventory();
    }

    handleEquipAction(action, slot) {
        const player = this.game.player;
        const inventory = player.inventory;

        if (action === 'unequip' && slot) {
            if (inventory.items.length < inventory.maxSize) {
                player.unequipItem(slot, this.game);
            } else {
                this.game.ui.addMessage('Inventory full, cannot unequip item!', '#f55');
            }
        }

        this.selectedEquipSlot = null;
        this.hovered = null;
        this.updateInventory();
    }

    dropItem(index) {
        const item = this.game.player.inventory.items[index];
        if (!item) return;

        console.log(`Dropping item: ${item.name} at position (${this.game.player.x}, ${this.game.player.y})`);

        // Add item to the ground at player's position
        this.game.itemManager.addItemToGround(item, this.game.player.x, this.game.player.y);

        // Remove from player's inventory
        this.game.player.inventory.items.splice(index, 1);

        this.game.ui.addMessage(`Dropped ${item.name} on the ground.`, '#aaa');

        if (item.equipped) {
            this.game.player.unequipItem(item);
        }

        // In drop mode the modal closes after the drop completes.
        if (this.dropMode) {
            this.game.ui.gameModal.close();
        }
    }

    getItemTypeDescription(item) {
        if (!item) return '';

        switch (item.type) {
            case 'weapon':
                return item.isRanged && item.isRanged() ? 'Ranged weapon' : 'Weapon';
            case 'armor':
                return `Armour (${item.slot})`;
            case 'accessory':
                return `Accessory (${item.slot})`;
            case 'potion':
                return 'Potion';
            case 'scroll':
                return 'Scroll';
            case 'wand':
                return `Wand (${item.charges ?? 0} charges)`;
            case 'currency':
                return 'Currency';
            case 'key':
                return 'Key';
            default:
                return item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'Item';
        }
    }
}
