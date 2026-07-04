// Deployment configuration for optional Octonion online features.
//
// All values ship empty in the repo: with an empty config the game is fully
// offline (local IndexedDB saves only) and every account UI element stays
// hidden. Fill these in per deployment to light up hub sign-in + cloud saves.
//
// HUB_URL            The Octonion SSO hub, e.g. 'https://octonion.io'
// SUPABASE_URL       The hub's Supabase project URL (issues the session JWTs)
// SUPABASE_ANON_KEY  The hub's Supabase anon (public) key
// GATEWAY_URL        This game's saves gateway, exposing /api/saves/:slot

export const CONFIG = {
    HUB_URL: '',
    SUPABASE_URL: '',
    SUPABASE_ANON_KEY: '',
    GATEWAY_URL: ''
};

export function cloudConfigured() {
    return Boolean(
        CONFIG.HUB_URL &&
        CONFIG.SUPABASE_URL &&
        CONFIG.SUPABASE_ANON_KEY &&
        CONFIG.GATEWAY_URL
    );
}
