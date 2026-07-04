// Octonion hub SSO client. Mirrors the flow proven in DungeonGPT-JS:
//   1. signIn() sends the browser to {HUB_URL}/auth/login?redirect=<here>
//   2. The hub redirects back with ?token=<one-time-token>
//   3. init() exchanges it via POST {HUB_URL}/auth/exchange for a Supabase
//      session ({access_token, refresh_token}) and installs it.
//
// supabase-js is lazy-imported from a CDN only when the cloud config is
// present AND an auth operation actually runs, so the offline game loads
// zero external code. Session persistence and token refresh come from
// supabase-js itself (localStorage under the hood).

import { CONFIG, cloudConfigured } from '../../config.js';

let supabasePromise = null;

function getSupabase() {
    if (!cloudConfigured()) return Promise.resolve(null);
    if (!supabasePromise) {
        supabasePromise = import('https://esm.sh/@supabase/supabase-js@2')
            .then(({ createClient }) => createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY))
            .catch(error => {
                console.error('🔐 Could not load supabase-js:', error);
                supabasePromise = null;
                return null;
            });
    }
    return supabasePromise;
}

export class AuthClient {
    isConfigured() {
        return cloudConfigured();
    }

    /**
     * Complete a pending hub callback (?token=...) if present, then return
     * the current user or null. Call once on page load, before any cloud
     * save operations. Always strips the one-time token from the URL.
     */
    async init() {
        const supabase = await getSupabase();
        if (!supabase) return null;

        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        if (token) {
            try {
                const resp = await fetch(`${CONFIG.HUB_URL}/auth/exchange`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });
                if (resp.ok) {
                    const { access_token, refresh_token } = await resp.json();
                    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
                    if (error) console.error('🔐 Could not install hub session:', error);
                } else {
                    console.error('🔐 Hub token exchange failed:', resp.status);
                }
            } catch (error) {
                console.error('🔐 Hub token exchange failed:', error);
            }
            // One-time token: remove it from the URL whether or not the
            // exchange worked, so reloads and copied links stay clean.
            params.delete('token');
            const query = params.toString();
            history.replaceState(null, '', window.location.pathname + (query ? `?${query}` : ''));
        }

        return this.getUser();
    }

    async getUser() {
        const supabase = await getSupabase();
        if (!supabase) return null;
        const { data: { session } } = await supabase.auth.getSession();
        return session?.user ?? null;
    }

    // Fresh JWT for Authorization headers; supabase-js refreshes as needed.
    async getAccessToken() {
        const supabase = await getSupabase();
        if (!supabase) return null;
        const { data: { session } } = await supabase.auth.getSession();
        return session?.access_token ?? null;
    }

    signIn() {
        if (!this.isConfigured()) return;
        const callback = window.location.origin + window.location.pathname;
        window.location.href = `${CONFIG.HUB_URL}/auth/login?redirect=${encodeURIComponent(callback)}`;
    }

    // Local sign-out only. A hub-wide logout would redirect through
    // {HUB_URL}/auth/logout; keep the game session-local for now.
    async signOut() {
        const supabase = await getSupabase();
        if (supabase) await supabase.auth.signOut();
    }

    async onAuthChange(callback) {
        const supabase = await getSupabase();
        if (!supabase) return () => {};
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => callback(session?.user ?? null)
        );
        return () => subscription.unsubscribe();
    }
}

export const authClient = new AuthClient();
