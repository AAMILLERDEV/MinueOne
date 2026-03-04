import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[Supabase] Missing env vars — check your .env.local file.\n' +
    `  VITE_SUPABASE_URL: ${supabaseUrl ? 'set' : 'MISSING'}\n` +
    `  VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'set' : 'MISSING'}`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
