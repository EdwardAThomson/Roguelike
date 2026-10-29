// The in-game HUD: hero bars, stats, equipped gear, the spell hotbar with a
// potion belt, the message log and clickable key hints. One set of elements
// serves both layouts (see hudLayouts.js); the layout is a class on
// #main-container and the CSS in src/css/style.css arranges the pieces.
//
// update() runs every frame, so each section rebuilds only when the data it
// shows has changed (a signature string per section).

import { itemIconHtml, emptySlotIconHtml, spriteIconHtml, spellIconHtml } from '../render/itemIcons.js';

const GEAR_SLOTS = [
    ['head', 'Head'], ['body', 'Body'], ['feet', 'Feet'], ['weapon', 'Weapon'],
    ['offhand', 'Off-hand'], ['ring', 'Ring'], ['amulet', 'Amulet']
];

const BELT_KEYS = ['1', '2', '3'];

const KEY_HINTS = [
    { key: 'I', label: 'Pack', action: 'tab', tab: 'inventory' },
    { key: 'C', label: 'Hero', action: 'tab', tab: 'character' },
    { key: 'B', label: 'Spells', action: 'tab', tab: 'spellbook' },
    { key: 'H', label: 'Help', action: 'help' },
    { key: 'T', label: 'Style', action: 'style' },
    { key: 'L', label: 'Layout', action: 'layout' }
];

const MAX_LOG_LINES = 40;

export function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, ch => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
}

function percent(value, max) {
    if (!(max > 0)) return 0;
    return Math.max(0, Math.min(100, (value / max) * 100));
}

// Up to three quick-use items for the belt: potions first, then wands, one
// entry per item name, in pack order. `index` is the first matching pack
// slot (what a belt key uses) and `count` how many uses the pack holds.
export function beltItems(items = []) {
    const rank = (item) => (item.type === 'potion' ? 0 : item.type === 'wand' ? 1 : -1);
    const byName = new Map();
    items.forEach((item, index) => {
        if (!item || !item.canUse || rank(item) < 0) return;
        const uses = item.type === 'wand' ? (item.charges || 0) : (item.quantity || 1);
        const entry = byName.get(item.name);
        if (entry) {
            entry.count += uses;
        } else {
            byName.set(item.name, { index, item, count: uses });
        }
    });
    return [...byName.values()]
        .sort((a, b) => rank(a.item) - rank(b.item) || a.index - b.index)
        .slice(0, BELT_KEYS.length);
}

export class Hud {
    constructor(game) {
        this.game = game;
        this.root = null;
        this.els = {};
        this.signatures = {};
    }

    initialize() {
        this.root = document.getElementById('ui-container');
        if (!this.root) return;
        this.root.classList.add('hud');
        this.root.innerHTML = `
            <section class="hud-hero" aria-label="Hero"></section>
            <section class="hud-stats" aria-label="Stats"></section>
            <section class="hud-gear" aria-label="Equipped">
                <h2 class="hud-title">Equipped</h2>
                <div class="hud-slots hud-gear-slots"></div>
            </section>
            <section class="hud-hotbar" aria-label="Spells and belt">
                <h2 class="hud-title">Spells &amp; belt</h2>
                <div class="hud-slots hud-hotbar-slots"></div>
            </section>
            <section id="message-area" class="hud-log" aria-label="Message log">
                <h2 class="hud-title">Log</h2>
                <ol class="hud-log-list" aria-live="polite"></ol>
            </section>
            <nav class="hud-keys" aria-label="Screens"></nav>
        `;
        this.els = {
            hero: this.root.querySelector('.hud-hero'),
            stats: this.root.querySelector('.hud-stats'),
            gear: this.root.querySelector('.hud-gear-slots'),
            hotbar: this.root.querySelector('.hud-hotbar-slots'),
            log: this.root.querySelector('.hud-log-list'),
            keys: this.root.querySelector('.hud-keys')
        };
        this.els.keys.innerHTML = KEY_HINTS.map(h => `
            <button type="button" class="hud-key" data-action="${h.action}" ${h.tab ? `data-tab="${h.tab}"` : ''}>
                <kbd>${h.key}</kbd>${h.label}
            </button>`).join('');

        this.root.addEventListener('click', (e) => this.handleClick(e));
        this.root.addEventListener('mouseover', (e) => this.handleHover(e));
        this.root.addEventListener('mouseout', (e) => {
            if (e.target.closest('[data-tooltip-slot]')) this.hideTooltip();
        });

        this.tooltip = document.createElement('div');
        this.tooltip.className = 'hud-tooltip';
        this.tooltip.style.display = 'none';
        document.body.appendChild(this.tooltip);

        this.update();
    }

    // Rebuild a section only when its signature changes.
    renderSection(name, signature, build) {
        if (this.signatures[name] === signature) return;
        this.signatures[name] = signature;
        this.els[name].innerHTML = build();
    }

    update() {
        const player = this.game.player;
        if (!this.root || !player) return;

        const s = player.getSummary();
        const modeLabel = this.game.hardcore ? 'Hardcore' : 'Adventure';

        this.renderSection('hero', [s.level, s.health, s.maxHealth, s.mana, s.maxMana, s.experience,
            s.experienceToNextLevel, modeLabel].join('|'), () => `
            <div class="hud-hero-head">
                <span class="hud-name">Adventurer</span>
                <span class="hud-level">Lv ${s.level} · <span class="hud-mode hud-mode-${modeLabel.toLowerCase()}">${modeLabel}</span></span>
            </div>
            ${this.barHtml('hp', 'HP', s.health, s.maxHealth)}
            ${this.barHtml('mp', 'MP', s.mana, s.maxMana)}
            <div class="hud-xp" title="Experience">
                <div class="hud-xp-track"><div class="hud-xp-fill" style="width:${percent(s.experience, s.experienceToNextLevel)}%"></div></div>
                <span>XP ${s.experience} / ${s.experienceToNextLevel}</span>
            </div>`);

        this.renderSection('stats', [s.attackPower, s.defense, s.criticalChance, s.gold].join('|'), () => `
            <div class="hud-stat"><span>ATK</span><b>${s.attackPower}</b></div>
            <div class="hud-stat"><span>DEF</span><b>${s.defense}</b></div>
            <div class="hud-stat"><span>CRIT</span><b>${s.criticalChance}%</b></div>
            <div class="hud-stat hud-stat-gold"><span>GOLD</span><b>${spriteIconHtml('gold', 'hud-gold-icon')}${s.gold || 0}</b></div>`);

        const equipment = (player.inventory && player.inventory.equipment) || {};
        this.renderSection('gear', GEAR_SLOTS.map(([slot]) => {
            const item = equipment[slot];
            return item ? `${item.name}:${item.rarity}` : '';
        }).join('|'), () => GEAR_SLOTS.map(([slot, label]) => {
            const item = equipment[slot];
            const name = item ? `${label}: ${item.name}` : `${label}: empty`;
            return `
                <button type="button" class="hud-slot ${item ? `filled rarity-border-${item.rarity}` : 'empty'}"
                    data-action="tab" data-tab="inventory" data-tooltip-slot="${slot}"
                    aria-label="${escapeHtml(name)}">
                    ${item ? itemIconHtml(item) : emptySlotIconHtml(slot)}
                </button>`;
        }).join(''));

        const slots = player.spellbook ? player.spellbook.getSummary().spellSlots : [];
        const belt = beltItems(player.inventory ? player.inventory.items : []);
        const manaShort = (spell) => spell && s.mana < (spell.manaCost || 0);
        this.renderSection('hotbar', [
            slots.map(sl => `${sl.spellId || ''}:${manaShort(sl.spell) ? 1 : 0}`).join(','),
            belt.map(b => `${b.item.name}:${b.count}`).join(',')
        ].join('|'), () => {
            const spellHtml = slots.map(sl => {
                const spell = sl.spell;
                if (!spell) {
                    return `
                        <button type="button" class="hud-slot empty" data-action="tab" data-tab="spellbook"
                            aria-label="${sl.key}: empty, open the spellbook to assign">
                            <span class="hud-slot-key">${sl.key}</span>
                        </button>`;
                }
                const label = `${sl.key}: ${spell.name}, ${spell.manaCost} mana`;
                return `
                    <button type="button" class="hud-slot spell ${manaShort(spell) ? 'unaffordable' : ''}"
                        data-action="cast" data-slot-index="${sl.slotIndex}" title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">
                        ${spellIconHtml(spell.id)}
                        <span class="hud-slot-key">${sl.key}</span>
                        <span class="hud-slot-count">${spell.manaCost}</span>
                    </button>`;
            }).join('');
            const beltHtml = BELT_KEYS.map((key, i) => {
                const entry = belt[i];
                if (!entry) {
                    return `
                        <button type="button" class="hud-slot empty belt" data-action="tab" data-tab="inventory"
                            aria-label="${key}: empty belt slot">
                            <span class="hud-slot-key">${key}</span>
                        </button>`;
                }
                const label = `${key}: ${entry.item.name}${entry.count > 1 ? ` x${entry.count}` : ''}`;
                return `
                    <button type="button" class="hud-slot filled belt" data-action="belt" data-belt-index="${i}"
                        title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}">
                        ${itemIconHtml(entry.item)}
                        <span class="hud-slot-key">${key}</span>
                        <span class="hud-slot-count">${entry.count > 1 ? entry.count : ''}</span>
                    </button>`;
            }).join('');
            return spellHtml + beltHtml;
        });

        const gameUI = this.game.ui && this.game.ui.gameUI;
        if (gameUI) {
            this.renderSection('log', String(gameUI.logVersion), () => gameUI.messageLog
                .slice(0, MAX_LOG_LINES)
                .map((m, i) => `<li class="hud-log-line" style="color:${escapeHtml(m.color)};--age:${i}">${escapeHtml(m.text)}</li>`)
                .reverse()
                .join(''));
        }
    }

    barHtml(kind, label, value, max) {
        return `
            <div class="hud-bar hud-bar-${kind}" role="meter" aria-label="${label}"
                aria-valuemin="0" aria-valuemax="${max}" aria-valuenow="${value}">
                <div class="hud-bar-fill" style="width:${percent(value, max)}%"></div>
                <span class="hud-bar-text"><span>${label}</span><span>${value} / ${max}</span></span>
            </div>`;
    }

    handleClick(e) {
        const button = e.target.closest('[data-action]');
        if (!button || !this.root.contains(button)) return;
        button.blur(); // keep keyboard focus off the HUD so game keys still work
        const ui = this.game.ui;
        switch (button.dataset.action) {
            case 'tab':
                if (ui && ui.gameModal) ui.gameModal.open(button.dataset.tab);
                break;
            case 'help':
                if (ui && ui.gameModal && ui.gameModal.isOpen) ui.gameModal.close();
                if (ui && ui.helpScreen) ui.helpScreen.toggleHelpScreen();
                break;
            case 'style':
                if (typeof this.game.cycleDisplayMode === 'function') this.game.cycleDisplayMode();
                break;
            case 'layout':
                if (typeof this.game.cycleHudLayout === 'function') this.game.cycleHudLayout();
                break;
            case 'cast':
                if (this.isPlaying() && this.game.inputManager) {
                    this.game.inputManager.castSpellFromSlot(Number(button.dataset.slotIndex));
                }
                break;
            case 'belt':
                this.useBeltSlot(Number(button.dataset.beltIndex));
                break;
        }
    }

    isPlaying() {
        return !this.game.stateManager || this.game.stateManager.isPlaying();
    }

    // Use the belt item in position i (keys 1-3 while playing).
    useBeltSlot(i) {
        const player = this.game.player;
        if (!player || !player.inventory || !this.isPlaying()) return false;
        const entry = beltItems(player.inventory.items)[i];
        if (!entry) {
            if (this.game.ui) this.game.ui.addMessage(`Belt slot ${i + 1} is empty.`, '#aaa');
            return false;
        }
        return player.useItemFromInventory(entry.index, this.game);
    }

    handleHover(e) {
        const slot = e.target.closest('[data-tooltip-slot]');
        if (!slot) return;
        const item = this.game.player && this.game.player.inventory &&
            this.game.player.inventory.equipment[slot.dataset.tooltipSlot];
        if (!item) return;
        const stats = typeof item.getStatDescription === 'function' ? item.getStatDescription() : '';
        this.tooltip.innerHTML = `
            <div class="hud-tooltip-name rarity-${escapeHtml(item.rarity)}">${escapeHtml(item.name)}</div>
            ${item.description ? `<div class="hud-tooltip-desc">${escapeHtml(item.description)}</div>` : ''}
            ${stats ? `<div class="hud-tooltip-stats">${escapeHtml(stats).replace(/\n/g, '<br>')}</div>` : ''}`;
        const rect = slot.getBoundingClientRect();
        this.tooltip.style.display = 'block';
        const width = this.tooltip.offsetWidth;
        const left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.left + rect.width / 2 - width / 2));
        const above = rect.top - this.tooltip.offsetHeight - 8;
        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${above > 8 ? above : rect.bottom + 8}px`;
    }

    hideTooltip() {
        if (this.tooltip) this.tooltip.style.display = 'none';
    }
}
