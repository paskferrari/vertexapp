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
  const activateAccount = async (email, activationCode) => {
    try {
      setLoading(true);
      
      // Verifica il codice di attivazione
      const { data: request, error: requestError } = await supabase
        .from('pre_registration_requests')
        .select('*')
        .eq('email', email)
        .eq('activation_code', activationCode)
        .eq('status', 'approved')
        .single();
      
      if (requestError || !request) {
        return { success: false, error: 'Codice di attivazione non valido o scaduto.' };
      }
      
      // Crea l'account in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: request.email,
        password: 'temp_password_' + Date.now(), // ❌ Password temporanea!
        options: {
          data: {
            role: request.role || 'user',
            name: request.name
          }
        }
      });
      
      if (authError) {
        console.error('Supabase auth error:', authError);
        return { success: false, error: 'Errore durante la creazione dell\'account.' };
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
        message: 'Account attivato! Ora puoi fare login.',
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