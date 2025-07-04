// This might be redundant going forward??

export class InputHandler {
    constructor() {
        this.keys = {};
        this.lastKeys = {};
        
        //console.log("InputHandler initialized");
        
        // Set up event listeners
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }
    
    handleKeyDown(e) {
        // Prevent default for game keys to avoid browser scrolling, etc.
        const gameKeys = [
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'w', 'a', 's', 'd', 'i', 'c', 'e', 'g', 'h', 'u', 'm', ' '
        ];
        
        if (gameKeys.includes(e.key)) {
            e.preventDefault();
        }
        
        // Store key state
        const lowerKey = e.key.toLowerCase();
        this.keys[lowerKey] = true;
    }
    
    handleKeyUp(e) {
        this.keys[e.key.toLowerCase()] = false;
    }
    
    isKeyDown(key) {
        return !!this.keys[key.toLowerCase()];
    }
    
    isKeyPressed(key) {
        // Key was just pressed this frame (down now but wasn't down last frame)
        const lowerKey = key.toLowerCase();
        const isDown = !!this.keys[lowerKey];
        const wasDown = !!this.lastKeys[lowerKey];
        
        return isDown && !wasDown;
    }
    
    isKeyReleased(key) {
        // Key was just released this frame (not down now but was down last frame)
        const lowerKey = key.toLowerCase();
        const isDown = !!this.keys[lowerKey];
        const wasDown = !!this.lastKeys[lowerKey];
        
        return !isDown && wasDown;
    }
    
    resetKey(key) {
        this.keys[key.toLowerCase()] = false;
    }
    
    update() {
        // Store the current key states for next frame comparison
        this.lastKeys = {...this.keys};
    }
}