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
            'w', 'a', 's', 'd', 'i', 'c', 'e', 'g', 'h', 'u', 'p', 'm',
            'q', 'r', 'f', 'v', 'x', // Spell hotkeys
            't', 'z', 'Escape',
            '1', '2', '3', '4', '5', '6', '7', '8', '9' // Inventory number keys
        ];
        const numpadCodes = [
            'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4',
            'Numpad6', 'Numpad7', 'Numpad8', 'Numpad9'
        ];

        // Numpad keys are tracked under their `code` (e.g. 'numpad7') so they
        // stay distinct from the top-row digit hotkeys used by the inventory,
        // and work the same regardless of NumLock state.
        const isNumpad = typeof e.code === 'string' && numpadCodes.includes(e.code);

        if (isNumpad || gameKeys.includes(e.key)) {
            e.preventDefault();
        }

        const lowerKey = isNumpad ? e.code.toLowerCase() : e.key.toLowerCase();
        this.keys[lowerKey] = true;
        
        // Only log F, T, Z keys
        //if (lowerKey === 'f' || lowerKey === 't' || lowerKey === 'z') {
            // console.log(`🔑 InputHandler.handleKeyDown: key='${e.key}' stored as keys['${lowerKey}'] = true`);
        //}
    }
    
    handleKeyUp(e) {
        const isNumpad = typeof e.code === 'string' && e.code.startsWith('Numpad');
        const lowerKey = isNumpad ? e.code.toLowerCase() : e.key.toLowerCase();
        this.keys[lowerKey] = false;
        
        // Only log F, T, Z keys
        //if (lowerKey === 'f' || lowerKey === 't' || lowerKey === 'z') {
            // console.log(`🔑 InputHandler.handleKeyUp: key='${e.key}' -> keys['${lowerKey}'] = false`);
        //}
    }
    
    isKeyDown(key) {
        return !!this.keys[key.toLowerCase()];
    }
    
    isKeyPressed(key) {
        // Key was just pressed this frame (down now but wasn't down last frame)
        const lowerKey = key.toLowerCase();
        const isDown = !!this.keys[lowerKey];
        const wasDown = !!this.lastKeys[lowerKey];
        const result = isDown && !wasDown;
        
        //if (lowerKey === 'f' || lowerKey === 't' || lowerKey === 'z') {
            // console.log(`🔑 InputHandler.isKeyPressed('${key}'): isDown=${isDown}, wasDown=${wasDown}, result=${result}`);
        //}
        
        return result;
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