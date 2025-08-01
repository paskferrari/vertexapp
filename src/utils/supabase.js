import { createClient } from '@supabase/supabase-js'

// Sostituisci con i tuoi valori reali da Supabase Dashboard
const supabaseUrl = 'https://your-project-id.supabase.co'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)