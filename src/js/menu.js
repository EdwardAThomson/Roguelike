// Menu handling functionality
document.addEventListener('DOMContentLoaded', () => {
    // Get UI elements
    const landingPage = document.getElementById('landing-page');
    const mainContainer = document.getElementById('main-container');
    const quickPlayBtn = document.getElementById('quick-play-btn');
    const multiplayerBtn = document.getElementById('multiplayer-btn');
    const optionsBtn = document.getElementById('options-btn');
    const creditsBtn = document.getElementById('credits-btn');
    
    // Event Listeners
    quickPlayBtn.addEventListener('click', startSinglePlayerGame);
    multiplayerBtn.addEventListener('click', showMultiplayerOptions);
    optionsBtn.addEventListener('click', showOptions);
    creditsBtn.addEventListener('click', showCredits);
    
    // Game Start Functions
    function startSinglePlayerGame() {
        console.log('Starting single player game...');
        
        // Hide the landing page
        landingPage.style.display = 'none';
        
        // Show the main container and explicitly set its display to flex
        mainContainer.style.display = 'flex';
        
        // Explicitly set the UI container's display properties
        const uiContainer = document.getElementById('ui-container');
        uiContainer.style.display = 'flex';
        uiContainer.style.flexDirection = 'column';
        
        // Initialize the game
        if (window.startGame && typeof window.startGame === 'function') {
            window.startGame();
        } else {
            console.error('Game initialization function not found!');
        }
    }
    
    function showMultiplayerOptions() {
        alert('Multiplayer mode coming soon!');
        // This will be implemented later
    }
    
    function showOptions() {
        alert('Options menu coming soon!');
        // This could be a settings panel
    }
    
    function showCredits() {
        alert('Credits:\n\nDeveloped by: Edward Thomson\n\nBuilt with vanilla JavaScript and HTML5 Canvas\nInspired by classic roguelike games\n\nThank you for playing!');
        // This could be a modal with credits
    }
}); 