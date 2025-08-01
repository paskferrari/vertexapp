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
  const activateAccount = async (email, activationCode, password) => {
    try {
      setLoading(true);
      
      // Validazione email lato client
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Formato email non valido' };
      }
      
      // Pulisci l'email da eventuali spazi
      const cleanEmail = email.trim().toLowerCase();
      
      console.log('Attempting activation for:', cleanEmail);
      console.log('Activation code:', activationCode);
      
      // Debug: vedi tutte le richieste per questa email
      const { data: allRequests, error: debugError } = await supabase
        .from('pre_registration_requests')
        .select('*')
        .eq('email', email);
      
      console.log('All requests for email:', allRequests);
      console.log('Debug error:', debugError);
      
      if (debugError) {
        console.error('Debug query error:', debugError);
        return { success: false, error: 'Errore durante la verifica delle richieste di registrazione' };
      }
      
      // Verifica il codice di attivazione
      const { data: request, error: requestError } = await supabase
        .from('pre_registration_requests')
        .select('*')
        .eq('email', cleanEmail)
        .eq('activation_code', activationCode)
        .eq('status', 'approved')
        .single();
      
      console.log('Query executed');
      console.log('Request found:', request);
      console.log('Request error:', requestError);
      console.log('Request error details:', JSON.stringify(requestError, null, 2));
      
      if (requestError) {
        console.error('Request verification error:', requestError);
        // Controlla casi di errore specifici
        if (requestError.code === 'PGRST116') {
          const activeRequest = allRequests?.find(req => req.email === email);
          if (!activeRequest) {
            return { success: false, error: 'Nessuna richiesta di registrazione trovata per questa email' };
          }
          if (activeRequest.status !== 'approved') {
            return { success: false, error: 'La richiesta di registrazione non è ancora stata approvata' };
          }
          if (activeRequest.activation_code !== activationCode) {
            return { success: false, error: 'Codice di attivazione non valido' };
          }
        }
        return { success: false, error: 'Codice di attivazione non valido o scaduto' };
      }
      
      if (!request) {
        return { success: false, error: 'Codice di attivazione non valido o scaduto.' };
      }
      
      // Prova prima il login (account potrebbe già esistere)
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password
      });
      
      if (loginData?.user && !loginError) {
        // Login riuscito
        await supabase
          .from('pre_registration_requests')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', request.id);
          
        return { 
          success: true, 
          message: 'Login effettuato con successo!',
          userData: {
            email: request.email,
            name: request.name,
            role: request.role || 'user'
          }
        };
      }
      
      // Se login fallisce, crea nuovo account
      console.log('Creating new auth user for:', cleanEmail);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            role: request.role || 'user',
            name: request.name
          },
          emailRedirectTo: undefined // Disabilita email di conferma
        }
      });
      
      if (authError) {
        console.error('Supabase auth error:', authError);
        
        // Gestisci errori specifici
        if (authError.message.includes('invalid') && authError.message.includes('email')) {
          return { 
            success: false, 
            error: 'Email non valida. Verifica la configurazione di Supabase o prova con un\'email diversa.' 
          };
        }
        
        if (authError.message.includes('already registered')) {
          return { 
            success: false, 
            error: 'Account già esistente. Prova a fare login direttamente.' 
          };
        }
        
        return { 
          success: false, 
          error: `Errore di autenticazione: ${authError.message}` 
        };
      }
      
      // Successo - segna come completato
      await supabase
        .from('pre_registration_requests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', request.id);
      
      return { 
        success: true, 
        message: 'Account attivato con successo!',
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

