
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
// YOUR SUPABASE KEYS
// ------------------------------------------------------------------
// Database connection removed. Please provide new keys or use mock mode.

const DEFAULT_URL = 'https://eannpgaknjctmcrhhnqw.supabase.co'; 
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhbm5wZ2FrbmpjdG1jcmhobnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2NTk4MjYsImV4cCI6MjA4MDIzNTgyNn0.zPI39Lr7vAgfs9J6FEC8SiQ1fyWdE9bvnVb674dpbeE'; 

// ------------------------------------------------------------------

const getUrl = () => localStorage.getItem('sb_url') || DEFAULT_URL;
const getKey = () => localStorage.getItem('sb_key') || DEFAULT_KEY;

// Prevent crash if keys are missing (e.g. during initial setup)
const rawUrl = getUrl();
const rawKey = getKey();

// Check if URL is valid or placeholder. 
// Robust check: must exist, not be empty, not contain "placeholder"
const isValidUrl = (url: string) => {
    try { return new URL(url).protocol === 'https:'; } catch { return false; }
};

const isPlaceholder = !rawUrl || rawUrl.trim() === '' || rawUrl.includes('placeholder') || !isValidUrl(rawUrl);

// Use a safe dummy URL if placeholder to prevent "Failed to fetch" on auth init
// 'https://example.invalid' is reserved and will fail fast without network noise in most browsers, 
// or simply won't resolve, preventing the auth error loop.
const supabaseUrl = isPlaceholder ? 'https://example.invalid' : rawUrl;
const supabaseKey = isPlaceholder ? 'placeholder-key' : rawKey;

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        // CRITICAL: Disable all auth network activity if keys are missing
        autoRefreshToken: !isPlaceholder,
        persistSession: !isPlaceholder,
        detectSessionInUrl: !isPlaceholder,
        // Only use storage if we have a valid configuration to avoid reading stale tokens with invalid keys
        storage: isPlaceholder ? undefined : window.localStorage 
    },
    global: {
        // Mock fetch to prevent "Failed to fetch" errors when offline/disconnected
        // We return status 200 to prevent AuthApiError (which triggers on 4xx/5xx)
        fetch: isPlaceholder ? (url, options) => {
            return Promise.resolve(new Response(JSON.stringify({
                data: null,
                error: null,
                message: "Database disconnected (Demo Mode)"
            }), { 
                status: 200, 
                statusText: 'OK',
                headers: new Headers({'Content-Type': 'application/json'}) 
            }));
        } : undefined
    }
});

export const getSupabaseConfig = () => ({
    url: getUrl(),
    key: getKey()
});

// Helper to check if we are connected
export const isSupabaseConfigured = () => {
    return !isPlaceholder;
};

// No longer needed, but kept for compatibility
export const saveSupabaseConfig = (url: string, key: string) => {
    localStorage.setItem('sb_url', url);
    localStorage.setItem('sb_key', key);
};

export const clearSupabaseConfig = () => {
    localStorage.removeItem('sb_url');
    localStorage.removeItem('sb_key');
};
