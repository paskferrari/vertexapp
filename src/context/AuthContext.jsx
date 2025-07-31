import { createContext, useContext, useState, useEffect } from 'react';

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

  // Fix: Gestione corretta per sviluppo e produzione
  const API_BASE_URL = import.meta.env.PROD 
    ? import.meta.env.VITE_API_BASE_URL || '/api'
    : '/api';

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, []);

  const login = async (email, password, retries = 2) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
        credentials: 'include',
      });

      clearTimeout(timeoutId);
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Credenziali non valide');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);

      return { success: true };
      
    } catch (error) {
      clearTimeout(timeoutId);
      
      if ((error.name === 'AbortError' || error.name === 'TypeError' || error.message.includes('Failed to fetch')) && retries > 0) {
        console.log(`Login failed, retrying... (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return login(email, password, retries - 1);
      }
      
      let errorMessage = error.message;
      
      if (error.name === 'AbortError') {
        errorMessage = 'Login scaduto. Controlla la tua connessione internet e riprova.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Impossibile connettersi al server. Verifica la tua connessione internet.';
      } else if (error.message.includes('NetworkError')) {
        errorMessage = 'Errore di rete. Controlla la tua connessione e riprova.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const register = async (email, password) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error || 'Errore durante la registrazione' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Impossibile connettersi al server. Verifica la tua connessione internet.' };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    login,
    register, // Add register function
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