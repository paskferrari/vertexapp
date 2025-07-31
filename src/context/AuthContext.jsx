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
    // Controlla la sessione attuale di Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            role: session.user.user_metadata.role || 'user',
            name: session.user.user_metadata.name || session.user.email.split('@')[0]
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Controlla se c'è già una sessione attiva
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          role: session.user.user_metadata.role || 'user',
          name: session.user.user_metadata.name || session.user.email.split('@')[0]
        });
      }
      setLoading(false);
    };

    checkUser();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Login error:', error);
      let errorMessage = error.message;
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Credenziali non valide';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Email non confermata. Controlla la tua casella di posta.';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const getAuthHeaders = () => {
    return {}; // Supabase gestisce automaticamente i token nelle richieste
  };

  // Dopo la registrazione, assicurati che la sessione sia impostata correttamente
  const register = async (email, password) => {
    try {
      setLoading(true);
      
      // Registrazione con Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: 'user',
            name: email.split('@')[0]
          }
        }
      });
  
      if (error) throw error;
      
      // Verifica se c'è una sessione e imposta l'utente
      if (data.session) {
        // Imposta esplicitamente l'utente qui per assicurarti che sia disponibile subito
        setUser({
          id: data.user.id,
          email: data.user.email,
          role: data.user.user_metadata.role || 'user',
          name: data.user.user_metadata.name || data.user.email.split('@')[0]
        });
      }
      
      return { 
        success: true, 
        user: data.user,
        message: data.session ? 'Registrazione completata' : 'Controlla la tua email per verificare l\'account'
      };
    } catch (error) {
      console.error('Registration error:', error);
      let errorMessage = error.message;
      
      if (error.message.includes('already registered')) {
        errorMessage = 'Email già registrata';
      }
      
      return { success: false, error: errorMessage };
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
    getAuthHeaders
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};