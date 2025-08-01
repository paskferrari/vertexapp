import { createClient } from '@supabase/supabase-js'

// Sostituisci con i tuoi valori reali da Supabase Dashboard
const supabaseUrl = 'https://vatxcmmmxwqzmojsbpwl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdHhjbW1teHdxem1vanNicHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4ODM3NjgsImV4cCI6MjA2OTQ1OTc2OH0.jDiHGC7qGl8J6NbGc8_L1qHRJIpfdtzfj0GCKNdoB98'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)