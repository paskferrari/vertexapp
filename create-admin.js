import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseServiceKey = 'YOUR_SUPABASE_SERVICE_ROLE_KEY'; // Chiave di servizio!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createFirstAdmin() {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@vertex.com',
      password: 'admin123',
      user_metadata: {
        role: 'admin',
        name: 'Administrator'
      },
      email_confirm: true
    });
    
    if (error) throw error;
    
    // Inserisci nella tabella users
    await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: data.user.email,
        role: 'admin',
        password: 'managed_by_supabase_auth'
      });
    
    console.log('Admin creato con successo:', data.user.email);
  } catch (error) {
    console.error('Errore nella creazione dell\'admin:', error);
  }
}

createFirstAdmin();