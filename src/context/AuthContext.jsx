import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Controlla la sessione corrente
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          role: session.user.user_metadata?.role || 'user',
          name: session.user.user_metadata?.name || session.user.email.split('@')[0]
        });
      }
      setLoading(false);
    };

    getSession();

    // Ascolta i cambiamenti di autenticazione
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            role: session.user.user_metadata?.role || 'user',
            name: session.user.user_metadata?.name || session.user.email.split('@')[0]
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, name, message) => {
    try {
      setLoading(true);
      
      // Inserisci richiesta di pre-registrazione
      const { data, error } = await supabase
        .from('pre_registration_requests')
        .insert({
          email,
          name,
          message,
          role: 'user', // Default user
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { 
        success: true, 
        message: 'Richiesta di registrazione inviata! Attendi l\'approvazione dell\'amministratore.' 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const getAuthHeaders = () => {
    return {}; // Non più necessario con Supabase
  };

  // Attivazione account con codice
  // Nella funzione activateAccount, modifica la riga della password:
  const activateAccount = async (email, activationCode, password) => {
    try {
      setLoading(true);
      
      console.log('Attempting activation for:', email);
      
      // Verifica il codice di attivazione
      const { data: request, error: requestError } = await supabase
        .from('pre_registration_requests')
        .select('*')
        .eq('email', email)
        .eq('activation_code', activationCode)
        .eq('status', 'approved')
        .single();
      
      console.log('Request found:', request);
      console.log('Request error:', requestError);
      
      if (requestError || !request) {
        return { success: false, error: 'Codice di attivazione non valido o scaduto.' };
      }
      
      // Crea l'account in Supabase Auth con la password dell'utente
      console.log('Creating auth user for:', request.email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: request.email,
        password: password, // ✅ Password scelta dall'utente
        options: {
          data: {
            role: request.role || 'user',
            name: request.name
          }
        }
      });
      
      console.log('Auth data:', authData);
      console.log('Auth error:', authError);
      
      if (authError) {
        console.error('Supabase auth error details:', authError);
        return { 
          success: false, 
          error: `Errore Supabase: ${authError.message}` 
        };
      }
      
      // Segna la richiesta come completata
      await supabase
        .from('pre_registration_requests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', request.id);
      
      return { 
        success: true, 
        message: 'Account attivato con successo! Ora puoi fare login con la tua password.',
        userData: {
          email: request.email,
          name: request.name,
          role: request.role || 'user'
        }
      };
    } catch (error) {
      console.error('Activation error:', error);
      return { success: false, error: 'Errore durante l\'attivazione dell\'account.' };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAdmin,
    getAuthHeaders,
    activateAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


const activateAccount = async (activationCode, password) => {
  try {
    console.log('🔍 Inizio attivazione con codice:', activationCode);
    
    // Verifica il codice nella tabella pre_registration_requests
    const { data: requestData, error: requestError } = await supabase
      .from('pre_registration_requests')
      .select('*')
      .eq('activation_code', activationCode)
      .eq('status', 'pending')
      .single();

    if (requestError) {
      console.error('❌ Errore verifica codice:', requestError);
      throw new Error('Codice di attivazione non valido o già utilizzato');
    }

    console.log('✅ Richiesta trovata:', requestData);
    console.log('📧 Email da attivare:', requestData.email); // Usa requestData.email
    
    // Crea l'account in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: requestData.email, // Usa requestData.email invece di email
      password: password,
      options: {
        emailRedirectTo: undefined
      }
    });

    if (authError) {
      console.error('❌ Errore creazione account:', authError);
      throw authError;
    }

    console.log('✅ Account creato:', authData);
    
    // Aggiorna lo stato della richiesta
    const { error: updateError } = await supabase
      .from('pre_registration_requests')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', requestData.id);

    if (updateError) {
      console.error('❌ Errore aggiornamento stato:', updateError);
      throw updateError;
    }

    // Login automatico dopo attivazione
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: requestData.email, // Usa requestData.email
      password: password
    });

    if (loginError) {
      console.error('❌ Errore login automatico:', loginError);
      throw loginError;
    }

    setUser(loginData.user);
    console.log('✅ Attivazione completata e login effettuato');
    
    return { success: true, user: loginData.user };
    
  } catch (error) {
    console.error('❌ Errore completo attivazione:', error);
    throw error;
  }
};