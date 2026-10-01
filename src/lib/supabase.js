import { createClient } from '@supabase/supabase-js';

const fallbackSupabaseUrl = 'https://qnqmmrvhqxpenhqyesbc.supabase.co';
const fallbackSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFucW1tcnZocXhwZW5ocXllc2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0NDcyMDMsImV4cCI6MjEwNDAyMzIwM30.D-p9PGuOEUBKuRo2iURkI02lJ1enuyt7v3B34YbYTyY';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || fallbackSupabaseUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || fallbackSupabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
