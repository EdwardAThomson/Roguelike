/**
 * Version management module
 * Single source of truth for game version
 */
export class Version {
    static MAJOR = 0;
    static MINOR = 4;
    static PATCH = 0;
    static CODENAME = "Arcane Awakening";
    static RELEASE_DATE = "2025-10-17";
    
    /**
     * Get version string (e.g., "0.4.0")
     */
    static get version() {
        return `${this.MAJOR}.${this.MINOR}.${this.PATCH}`;
    }
    
    /**
     * Get full version with codename (e.g., "0.4.0 'Arcane Awakening'")
     */
    static get fullVersion() {
        return `${this.version} "${this.CODENAME}"`;
    }
    
    /**
     * Get display version (e.g., "Modern Rogue v0.4.0")
     */
    static get displayVersion() {
        return `Modern Rogue v${this.version}`;
    }
    
    /**
     * Log version information to console
     */
    static logVersion() {
        console.log(`%c${this.displayVersion}`, 'color: #0f0; font-size: 16px; font-weight: bold');
        console.log(`%cCodename: ${this.CODENAME}`, 'color: #0af');
        console.log(`%cRelease: ${this.RELEASE_DATE}`, 'color: #aaa');
    }
    
    /**
     * Get version object for save files
     */
    static getVersionInfo() {
        return {
            version: this.version,
            major: this.MAJOR,
            minor: this.MINOR,
            patch: this.PATCH,
            codename: this.CODENAME,
            releaseDate: this.RELEASE_DATE
        };
    }
}
