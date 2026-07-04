// New module for managing game states

export class GameStateManager {
    constructor(game) {
        this.game = game;
        this.state = 'playing'; // playing, characterScreen, inventory, etc., combat
        this.mapRevealed = false;
    }

    setState(newState) {
        this.state = newState;
        // Trigger any state change events if needed
    }

    isPlaying() {
        return this.state === 'playing';
    }

    isGameOver() {
        return this.state === 'gameOver';
    }

    // Menu pause: opening a UI screen (game modal, help) parks the game in
    // 'menu' so isPlaying() gates halt gameplay input, player/monster updates
    // and status-effect ticks. The guards keep gameOver sticky: opening or
    // closing a screen after death never resurrects 'playing'.
    openMenu() {
        if (this.state === 'playing') {
            this.setState('menu');
        }
    }

    closeMenu() {
        if (this.state === 'menu') {
            this.setState('playing');
        }
    }

    isInMenu() {
        return this.state === 'menu';
    }

    toggleMapReveal() {
        this.mapRevealed = !this.mapRevealed;
        return this.mapRevealed;
    }

    handlePlayerDeath() {
        this.setState('gameOver');
        this.game.ui.addMessage('Game Over!', '#f00');
        if (this.game.hardcore) {
            this.game.ui.addMessage('Hardcore run: your save is gone. Reload the page for a new adventure.', '#fff');
        } else {
            this.game.ui.addMessage('Reload the page and Continue from your last save.', '#fff');
        }

        // Whether the save survives the death is SaveManager policy
        // (hardcore deletes it, softcore keeps it).
        if (this.game.saveManager) {
            this.game.saveManager.onPlayerDeath();
        }
    }
} 