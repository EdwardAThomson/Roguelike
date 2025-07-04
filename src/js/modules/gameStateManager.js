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

    toggleMapReveal() {
        this.mapRevealed = !this.mapRevealed;
        return this.mapRevealed;
    }

    handlePlayerDeath() {
        this.setState('gameOver');
        this.game.ui.addMessage('Game Over!', '#f00');
        this.game.ui.addMessage('Press R to restart', '#fff');
    }
} 