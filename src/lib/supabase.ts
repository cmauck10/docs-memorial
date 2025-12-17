import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}

// For backwards compatibility and simpler imports in client components
export const supabase = {
  get client() {
    return getSupabase();
  }
};

export type Post = {
  id: string;
  guest_name: string;
  message: string;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  guest_token: string;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
};
