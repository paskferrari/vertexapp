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
      
      console.log('Attempting activation for:', email);
      console.log('Activation code:', activationCode);
      console.log('Password length:', password?.length);
      
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
        .eq('email', email)
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
      
      // Crea l'account in Supabase Auth con la password dell'utente
      console.log('Creating auth user for:', request.email);
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: request.email,
        password: password, // Password scelta dall'utente
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

