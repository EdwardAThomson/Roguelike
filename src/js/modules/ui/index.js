import { GameUI } from './gameUI.js';
import { InventoryUI } from './inventoryUI.js';
import { Hud } from './hud.js';
import { HelpScreen } from './helpScreen.js';
import { SpellbookUI } from './spellbookUI.js';
import { GameModal } from './gameModal.js';

export class UI {
    constructor(game) {
        this.game = game;

        // Initialize UI components
        this.gameUI = new GameUI(game);
        this.inventoryUI = new InventoryUI(game);
        this.hud = new Hud(game);
        this.helpScreen = new HelpScreen(game);
        this.spellbookUI = new SpellbookUI(game);

        // The tabbed modal hosting character sheet, inventory and spellbook.
        this.gameModal = new GameModal(game, {
            character: this.gameUI,
            inventory: this.inventoryUI,
            spellbook: this.spellbookUI
        });
    }

    initialize() {
        this.gameUI.initialize();
        // Builds the modal shell and mounts the three tab panels; must run
        // after gameUI.initialize() (GameUI defers its DOM to initialize()).
        this.gameModal.initialize();
        this.hud.initialize();
    }
    
    addMessage(message, color = '#fff') {
        this.gameUI.addMessage(message, color);
    }
    
    update() {
        this.gameUI.update();
        this.hud.update();
        
        // UI input is now handled in InputManager.handleUIInput()
        // This keeps all input logic centralized in one place
    }
    
    toggleInventory() {
        this.gameModal.toggleTab('inventory');
    }

    toggleSpellbook() {
        this.gameModal.toggleTab('spellbook');
    }
}