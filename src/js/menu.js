// Menu handling functionality
import { Version } from './version.js';
import { IndexedDBSaveStore } from './modules/persistence/indexedDBSaveStore.js';
import { SAVE_SLOT, isCompatibleEnvelope } from './modules/persistence/saveSchema.js';
import { authClient } from './modules/persistence/authClient.js';
import { CloudSaveStore } from './modules/persistence/cloudSaveStore.js';
import { DISPLAY_MODES, loadDisplayMode, saveDisplayMode } from './modules/render/displayModes.js';
import { HUD_LAYOUTS, loadHudLayout, saveHudLayout } from './modules/ui/hudLayouts.js';

document.addEventListener('DOMContentLoaded', () => {
    // Update version display dynamically
    const versionElement = document.querySelector('.game-version');
    if (versionElement) {
        versionElement.textContent = `v${Version.version} "${Version.CODENAME}"`;
    }

    // Get UI elements
    const landingPage = document.getElementById('landing-page');
    const mainContainer = document.getElementById('main-container');
    const menuOptions = document.getElementById('menu-options');
    const continueBtn = document.getElementById('continue-btn');
    const quickPlayBtn = document.getElementById('quick-play-btn');
    const multiplayerBtn = document.getElementById('multiplayer-btn');
    const optionsBtn = document.getElementById('options-btn');
    const creditsBtn = document.getElementById('credits-btn');
    const signinBtn = document.getElementById('signin-btn');
    const modeSelect = document.getElementById('mode-select');
    const modeAdventure = document.getElementById('mode-adventure');
    const modeHardcore = document.getElementById('mode-hardcore');
    const modeBack = document.getElementById('mode-back');
    const modalBackdrop = document.getElementById('menu-modal-backdrop');
    const modalTitle = document.getElementById('menu-modal-title');
    const modalBody = document.getElementById('menu-modal-body');
    const modalClose = document.getElementById('menu-modal-close');

    // Remember the player's last mode pick to highlight it as the default.
    const LAST_MODE_KEY = 'modernrogue.lastMode';

    // Event Listeners. Quick Play leads to the mode chooser; the mode only
    // applies to NEW runs. A continued run keeps the mode it was created
    // with (stored in the save).
    continueBtn.addEventListener('click', () => startSinglePlayerGame({ continue: true }));
    quickPlayBtn.addEventListener('click', showModeSelect);
    modeAdventure.addEventListener('click', () => pickMode(false));
    modeHardcore.addEventListener('click', () => pickMode(true));
    modeBack.addEventListener('click', hideModeSelect);
    multiplayerBtn.addEventListener('click', () => openMenuModal('Multiplayer', `
        <p>Multiplayer is on the roadmap but not implemented yet.</p>
        <p>For now, brave the dungeon solo. Adventurers wanted!</p>
    `));
    optionsBtn.addEventListener('click', openOptions);
    creditsBtn.addEventListener('click', () => openMenuModal('Credits', `
        <p><strong>Developed by:</strong> Edward Thomson</p>
        <p>Built with vanilla JavaScript and HTML5 Canvas.</p>
        <p>Inspired by classic roguelike games.</p>
        <p>Thank you for playing!</p>
    `));
    modalClose.addEventListener('click', closeMenuModal);
    modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeMenuModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || landingPage.style.display === 'none') return;
        if (modalBackdrop.style.display !== 'none') {
            closeMenuModal();
        } else if (modeSelect.style.display !== 'none') {
            hideModeSelect();
        }
    });

    // Run mode chooser
    function showModeSelect() {
        menuOptions.style.display = 'none';
        modeSelect.style.display = 'flex';

        // Highlight the previous pick as the suggested default.
        let lastMode = null;
        try {
            lastMode = localStorage.getItem(LAST_MODE_KEY);
        } catch { /* private mode etc.; no highlight */ }
        modeAdventure.classList.toggle('preferred', lastMode === 'adventure');
        modeHardcore.classList.toggle('preferred', lastMode === 'hardcore');
    }

    function hideModeSelect() {
        modeSelect.style.display = 'none';
        menuOptions.style.display = 'flex';
    }

    function pickMode(hardcore) {
        try {
            localStorage.setItem(LAST_MODE_KEY, hardcore ? 'hardcore' : 'adventure');
        } catch { /* best effort */ }
        startSinglePlayerGame({ hardcore });
    }

    // In-menu modal (replaces the old alert() popups)
    function openMenuModal(title, bodyHtml) {
        modalTitle.textContent = title;
        modalBody.innerHTML = bodyHtml;
        modalBackdrop.style.display = 'flex';
    }

    // Options: the graphics style and the HUD layout are display settings
    // stored per player, separate from any run (T and L cycle them in game).
    function openOptions() {
        const currentMode = loadDisplayMode();
        const currentLayout = loadHudLayout();
        const radioGroup = (label, attr, options, current) => `
            <p class="menu-option-label">${label}</p>
            <div class="display-mode-list" role="radiogroup" aria-label="${label}">
                ${options.map(o => `
                    <button type="button" class="display-mode-btn" role="radio" ${attr}="${o.id}"
                        aria-checked="${o.id === current}">${o.label}</button>`).join('')}
            </div>`;
        openMenuModal('Options', `
            ${radioGroup('Graphics', 'data-display-mode', DISPLAY_MODES, currentMode)}
            <p class="menu-option-hint">Press T in game to switch between them.</p>
            ${radioGroup('Layout', 'data-hud-layout', HUD_LAYOUTS, currentLayout)}
            <p class="menu-option-hint">Sidebar keeps everything beside the map; Action bar puts it along the bottom. Press L in game to switch.</p>
        `);
        const wire = (attr, save) => {
            const buttons = modalBody.querySelectorAll(`[${attr}]`);
            buttons.forEach(btn => {
                btn.addEventListener('click', () => {
                    save(btn.getAttribute(attr));
                    buttons.forEach(b => b.setAttribute('aria-checked', String(b === btn)));
                });
            });
        };
        wire('data-display-mode', saveDisplayMode);
        wire('data-hud-layout', saveHudLayout);
    }

    function closeMenuModal() {
        modalBackdrop.style.display = 'none';
    }

    // Menu boot: optional Octonion sign-in (completes the hub callback and
    // pulls a newer cloud save into IndexedDB), then the Continue probe.
    // Storage/auth failures just leave the extra buttons hidden.
    (async () => {
        if (authClient.isConfigured()) {
            try {
                const user = await authClient.init();
                setupAccountButton(user);
                if (user) await pullNewerCloudSave();
            } catch (error) {
                console.warn('Octonion sign-in unavailable:', error);
            }
        }
        await refreshContinueButton();
    })();

    // Show the Continue button when a loadable save exists.
    async function refreshContinueButton() {
        try {
            const store = new IndexedDBSaveStore();
            const envelope = await store.load(SAVE_SLOT);
            if (isCompatibleEnvelope(envelope)) {
                const meta = envelope.meta || {};
                const mode = meta.hardcore ? ', hardcore' : '';
                continueBtn.innerHTML = `Continue <span class="menu-btn-meta">Lv ${meta.playerLevel ?? '?'} · section ${
                    String(meta.currentSectionId ?? '?').replace('_', ', ')}${mode}</span>`;
                continueBtn.style.display = '';
            } else {
                continueBtn.style.display = 'none';
            }
        } catch (error) {
            console.warn('Could not check for a saved game:', error);
        }
    }

    // Local-first sync, menu-time pull: when the cloud copy is newer than
    // the local one (progress from another device), mirror it into
    // IndexedDB before the Continue probe reads it. savedAt is an ISO
    // string, so string comparison is chronological.
    async function pullNewerCloudSave() {
        try {
            const cloud = new CloudSaveStore();
            const cloudEnvelope = await cloud.load(SAVE_SLOT);
            if (!isCompatibleEnvelope(cloudEnvelope)) return;
            const store = new IndexedDBSaveStore();
            const local = await store.load(SAVE_SLOT);
            if (!local || cloudEnvelope.savedAt > local.savedAt) {
                await store.save(SAVE_SLOT, cloudEnvelope);
                console.log('☁️ Pulled newer cloud save into local storage');
            }
        } catch (error) {
            console.warn('Cloud save check failed:', error);
        }
    }

    function setupAccountButton(user) {
        signinBtn.style.display = '';
        if (user) {
            const label = user.user_metadata?.display_name || user.email || 'account';
            signinBtn.textContent = `Sign Out (${label})`;
            signinBtn.onclick = async () => {
                await authClient.signOut();
                setupAccountButton(null);
            };
        } else {
            signinBtn.textContent = 'Sign In (Octonion)';
            signinBtn.onclick = () => authClient.signIn();
        }
    }

    // Game Start Functions
    function startSinglePlayerGame(options = {}) {
        console.log(options.continue ? 'Continuing saved game...' : 'Starting single player game...');

        // Hide the landing page
        landingPage.style.display = 'none';

        // Show the game; the HUD layout class on it decides the arrangement.
        mainContainer.style.display = '';

        // Initialize the game
        if (window.startGame && typeof window.startGame === 'function') {
            window.startGame(options);
        } else {
            console.error('Game initialization function not found!');
        }
    }
});