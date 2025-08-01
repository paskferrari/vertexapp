import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import bcrypt from 'bcryptjs'; // Importa bcrypt

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

  // Pulizia sessione Supabase Auth all'avvio
  useEffect(() => {
    const clearSupabaseAuth = async () => {
      try {
        // Forza il logout da Supabase Auth se c'è una sessione attiva
        await supabase.auth.signOut();
        console.log('✅ Supabase Auth session cleared');
      } catch (error) {
        console.log('ℹ️ No Supabase Auth session to clear:', error.message);
      }
    };
    
    clearSupabaseAuth();
  }, []);

  // Carica utente dal localStorage all'avvio
  useEffect(() => {
    const savedUser = localStorage.getItem('vertex_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('vertex_user');
      }
    }
    setLoading(false);
  }, []);

  // Salva utente nel localStorage quando cambia
  useEffect(() => {
    if (user) {
      localStorage.setItem('vertex_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('vertex_user');
    }
  }, [user]);

  // Aggiungi scadenza alla sessione utente
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      const cleanEmail = email.trim().toLowerCase();
      
      // Ottieni l'utente dal database
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .single();
      
      if (error || !userData) {
        return { success: false, error: 'Email o password non corretti.' };
      }
      
      // Verifica la password con bcrypt
      const passwordMatch = await bcrypt.compare(password, userData.password);
      if (!passwordMatch) {
        return { success: false, error: 'Email o password non corretti.' };
      }
      
      // Imposta l'utente come autenticato
      // Aggiungi scadenza alla sessione (24 ore)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      const userSession = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        expiresAt: expiresAt.toISOString()
      };
      
      setUser(userSession);
      
      return { success: true, user: userSession };
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
      
      const cleanEmail = email.trim().toLowerCase();
      
      // Verifica se l'email esiste già nelle richieste
      const { data: existingRequest } = await supabase
        .from('pre_registration_requests')
        .select('*')
        .eq('email', cleanEmail)
        .single();
      
      if (existingRequest) {
        return { 
          success: false, 
          error: 'Esiste già una richiesta per questa email.' 
        };
      }
      
      // Verifica se l'email esiste già nella tabella users
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .single();
      
      if (existingUser) {
        return { 
          success: false, 
          error: 'Esiste già un account con questa email.' 
        };
      }
      
      // Inserisci richiesta di pre-registrazione
      const { data, error } = await supabase
        .from('pre_registration_requests')
        .insert({
          email: cleanEmail,
          name,
          message,
          role: 'user',
          status: 'pending'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { 
        success: true, 
        message: 'Richiesta di registrazione inviata! Ti verrà fornito un codice di attivazione tramite email una volta approvata la richiesta.' 
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const activateAccount = async (email, activationCode, password) => {
    try {
      setLoading(true);
      console.log('🔍 Verifying activation for:', email, 'with code:', activationCode);

      const cleanEmail = email.trim().toLowerCase();

      // Verifica la richiesta di pre-registrazione
      const { data: request, error: requestError } = await supabase
        .from('pre_registration_requests')
        .select('*')
        .eq('email', cleanEmail)
        .eq('activation_code', activationCode)
        .eq('status', 'approved')
        .single();

      if (requestError || !request) {
        console.error('❌ Activation verification failed:', requestError);
        return { 
          success: false, 
          error: 'Codice di attivazione non valido o richiesta non approvata.' 
        };
      }

      console.log('✅ Activation code verified:', request);

      // Verifica se l'utente esiste già nella tabella users
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('email', cleanEmail)
        .single();

      // Hash della password prima di salvarla
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      let userData;

      if (existingUser) {
        // Aggiorna la password dell'utente esistente
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ 
            password: hashedPassword, // Password hashata
            name: request.name,
            updated_at: new Date().toISOString()
          })
          .eq('email', cleanEmail)
          .select()
          .single();

        if (updateError) {
          console.error('❌ Error updating user:', updateError);
          return { success: false, error: 'Errore durante l\'aggiornamento dell\'account.' };
        }

        userData = updatedUser;
      } else {
        // Crea nuovo utente nella tabella users
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            email: cleanEmail,
            name: request.name,
            password: hashedPassword, // Password hashata
            role: request.role || 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating user:', createError);
          return { success: false, error: 'Errore durante la creazione dell\'account.' };
        }

        userData = newUser;
      }

      // Segna la richiesta come completata
      await supabase
        .from('pre_registration_requests')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', request.id);

      // Imposta l'utente come autenticato localmente
      const userSession = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role
      };
      
      setUser(userSession);

      return { 
        success: true, 
        message: 'Account attivato con successo! Benvenuto!',
        userData: userSession
      };

    } catch (error) {
      console.error('❌ Activation error:', error);
      return { success: false, error: 'Errore durante l\'attivazione dell\'account.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      localStorage.removeItem('vertex_user');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${user?.id}`,
      'Content-Type': 'application/json'
    };
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

// Verifica scadenza sessione all'avvio
useEffect(() => {
  const savedUser = localStorage.getItem('vertex_user');
  if (savedUser) {
    try {
      const parsedUser = JSON.parse(savedUser);
      
      // Verifica se la sessione è scaduta
      if (parsedUser.expiresAt) {
        const expiresAt = new Date(parsedUser.expiresAt);
        if (expiresAt < new Date()) {
          // Sessione scaduta, logout
          console.log('Session expired, logging out');
          localStorage.removeItem('vertex_user');
          setUser(null);
          setLoading(false);
          return;
        }
      }
      
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing saved user:', error);
      localStorage.removeItem('vertex_user');
    }
  }
  setLoading(false);
}, []);

