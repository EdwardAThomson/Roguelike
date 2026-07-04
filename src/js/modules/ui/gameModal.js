// GameModal: the single tabbed modal hosting the Character sheet, Inventory
// and Spellbook. It owns the shell (fixed-size frame, tab bar, close button,
// keyboard lifecycle, pause integration); the three screens are content
// providers implementing a small interface:
//
//   mountPanel(panelEl)  called once at initialize; the provider keeps the
//                        panel element and renders into it from then on
//   onShow(options)      tab became visible (options: { dropMode } etc.)
//   onHide()             tab hidden / modal closed: cancel transient state
//   handleKey(e)         optional per-tab keys (inventory item actions)
//
// The frame size is fixed (see .game-modal in src/css/style.css) so switching
// tabs never resizes or reflows the modal. Opening the modal genuinely pauses
// gameplay via stateManager.openMenu(); UI polling keeps running so the
// I/C/B/H toggles still work while paused.

export class GameModal {
    constructor(game, providers) {
        this.game = game;
        // { character: GameUI, inventory: InventoryUI, spellbook: SpellbookUI }
        this.providers = providers;
        this.tabs = ['character', 'inventory', 'spellbook'];
        this.tabLabels = { character: 'Character', inventory: 'Inventory', spellbook: 'Spellbook' };
        this.activeTab = null;
        this.isOpen = false;
        this.tabButtons = {};
        this.panels = {};
        // Bound once so add/removeEventListener match.
        this.keydownHandler = (e) => this.handleKeydown(e);
    }

    initialize() {
        const overlay = document.getElementById('overlay-container');

        this.root = document.createElement('div');
        this.root.id = 'game-modal';
        this.root.className = 'game-modal';
        this.root.style.display = 'none';

        // Tab bar + close button.
        const tabBar = document.createElement('div');
        tabBar.className = 'gm-tabs';
        for (const tab of this.tabs) {
            const button = document.createElement('button');
            button.className = 'gm-tab';
            button.dataset.tab = tab;
            button.textContent = this.tabLabels[tab];
            button.addEventListener('click', () => this.setTab(tab));
            tabBar.appendChild(button);
            this.tabButtons[tab] = button;
        }
        const closeButton = document.createElement('button');
        closeButton.className = 'gm-close';
        closeButton.textContent = '✕ Esc';
        closeButton.addEventListener('click', () => this.close());
        tabBar.appendChild(closeButton);
        this.root.appendChild(tabBar);

        // Content host with one persistent panel per tab. Panels persist so
        // switching tabs swaps visibility only: zero rebuild, zero reflow.
        const content = document.createElement('div');
        content.className = 'gm-content';
        for (const tab of this.tabs) {
            const panel = document.createElement('div');
            panel.className = 'gm-panel';
            panel.dataset.tab = tab;
            content.appendChild(panel);
            this.panels[tab] = panel;

            const provider = this.providers[tab];
            if (provider && typeof provider.mountPanel === 'function') {
                provider.mountPanel(panel);
            }
        }
        this.root.appendChild(content);

        overlay.appendChild(this.root);
    }

    open(tab = 'character', options = {}) {
        if (this.isOpen) {
            this.setTab(tab, options);
            return;
        }

        // Mutual exclusivity with the help overlay.
        const help = this.game.ui && this.game.ui.helpScreen;
        if (help && help.isOpen) {
            help.closeHelpScreen();
        }

        this.isOpen = true;
        this.root.style.display = 'flex';
        document.getElementById('overlay-container').classList.add('active');
        this.game.stateManager.openMenu();
        document.addEventListener('keydown', this.keydownHandler);
        this.activeTab = null;
        this.setTab(tab, options);
        console.log(`📋 GameModal: opened on ${tab}`);
    }

    close() {
        if (!this.isOpen) return;

        const provider = this.providers[this.activeTab];
        if (provider && typeof provider.onHide === 'function') {
            provider.onHide();
        }

        this.isOpen = false;
        this.activeTab = null;
        this.root.style.display = 'none';
        document.getElementById('overlay-container').classList.remove('active');
        document.removeEventListener('keydown', this.keydownHandler);
        this.game.stateManager.closeMenu();
        console.log('📋 GameModal: closed');
    }

    // Key-toggle semantics: closed -> open on that tab; open on the same
    // tab -> close; open on another tab -> switch.
    toggleTab(tab, options = {}) {
        if (!this.isOpen) {
            this.open(tab, options);
        } else if (this.activeTab === tab) {
            this.close();
        } else {
            this.setTab(tab, options);
        }
    }

    setTab(tab, options = {}) {
        if (!this.tabs.includes(tab) || !this.isOpen) return;

        if (this.activeTab && this.activeTab !== tab) {
            const previous = this.providers[this.activeTab];
            if (previous && typeof previous.onHide === 'function') {
                previous.onHide();
            }
        }

        this.activeTab = tab;
        for (const t of this.tabs) {
            this.tabButtons[t].classList.toggle('active', t === tab);
            this.panels[t].classList.toggle('active', t === tab);
        }

        const provider = this.providers[tab];
        if (provider && typeof provider.onShow === 'function') {
            provider.onShow(options);
        }
    }

    // One keyboard entry point while the modal is open (attached on open,
    // detached on close). Priority: spellbook capture mode, then Escape
    // (two-stage: cancel capture first, close second), then the active
    // tab's own keys.
    handleKeydown(e) {
        const spellbookUI = this.providers.spellbook;
        if (spellbookUI && typeof spellbookUI.isCapturing === 'function' && spellbookUI.isCapturing()) {
            if (e.key === 'Escape') {
                e.preventDefault();
                spellbookUI.cancelCapture();
                return;
            }
            // Slot key order comes from the live spellbook, not a copy.
            const slotKeys = (this.game.player && this.game.player.spellbook)
                ? this.game.player.spellbook.slotKeys
                : ['Q', 'R', 'F', 'V', 'X'];
            const slotIndex = slotKeys.findIndex(k => k.toLowerCase() === e.key.toLowerCase());
            if (slotIndex !== -1) {
                e.preventDefault();
                spellbookUI.completeCapture(slotIndex);
            }
            return;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
            return;
        }

        const provider = this.providers[this.activeTab];
        if (provider && typeof provider.handleKey === 'function') {
            provider.handleKey(e);
        }
    }
}
