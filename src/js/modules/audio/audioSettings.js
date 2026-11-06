// Sound settings: master / music / effects volume and a mute switch. Like the
// graphics style and HUD layout this is a per-player setting kept in
// localStorage and never in the save file. Change it from the menu's Options
// or mute in game with N.

export const AUDIO_SETTINGS_KEY = 'modernrogue.audio';

export const DEFAULT_AUDIO_SETTINGS = Object.freeze({
    master: 0.8,
    music: 0.5,
    sfx: 0.8,
    muted: false
});

const clamp01 = (v, fallback) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
};

// Fill in and clamp whatever came out of storage (or a partial update).
export function normalizeAudioSettings(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    return {
        master: clamp01(src.master, DEFAULT_AUDIO_SETTINGS.master),
        music: clamp01(src.music, DEFAULT_AUDIO_SETTINGS.music),
        sfx: clamp01(src.sfx, DEFAULT_AUDIO_SETTINGS.sfx),
        muted: typeof src.muted === 'boolean' ? src.muted : DEFAULT_AUDIO_SETTINGS.muted
    };
}

export function loadAudioSettings(storage = globalThis.localStorage) {
    try {
        const text = storage && storage.getItem(AUDIO_SETTINGS_KEY);
        return normalizeAudioSettings(text ? JSON.parse(text) : null);
    } catch (e) {
        return normalizeAudioSettings(null);
    }
}

export function saveAudioSettings(settings, storage = globalThis.localStorage) {
    const clean = normalizeAudioSettings(settings);
    try {
        if (storage) storage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(clean));
    } catch (e) {
        // Private windows can refuse storage; the setting still applies this session.
    }
    return clean;
}

// Effective gain of a bus (0 when muted).
export function busGain(settings, bus) {
    const s = normalizeAudioSettings(settings);
    if (s.muted) return 0;
    return s.master * (bus === 'music' ? s.music : bus === 'sfx' ? s.sfx : 1);
}
