import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, user } = useAuth();
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: '',
    name: '' // Campo nome aggiunto
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validazioni
    if (formData.password !== formData.confirmPassword) {
      setError('Le password non coincidono');
      return;
    }

    if (formData.password.length < 6) {
      setError('La password deve essere di almeno 6 caratteri');
      return;
    }

    if (!formData.name.trim()) {
      setError('Il nome è obbligatorio');
      return;
    }

    setLoading(true);
    
    const result = await register(formData.email, formData.password, formData.name.trim());
    
    if (result.success) {
      setMessage(result.message);
      setFormData({ email: '', password: '', confirmPassword: '', name: '' });
      // NON reindirizzare - mostra solo il messaggio di successo
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">Richiesta Registrazione</h2>
          <p className="text-gray-400">Compila il form per richiedere l'accesso</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nome Completo
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-dark-lighter border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="Il tuo nome completo"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-dark-lighter border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="La tua email"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-dark-lighter border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="Scegli una password"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Conferma Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-dark-lighter border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="Conferma la password"
            />
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          
          {message && (
            <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-lg">
              {message}
              <div className="mt-2 text-sm">
                <Link to="/activate" className="text-primary hover:text-primary-light underline">
                  Hai già ricevuto un codice? Attiva il tuo account qui
                </Link>
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Invio richiesta...' : 'Invia Richiesta'}
          </button>
        </form>
        
        <div className="text-center">
          <Link to="/login" className="text-primary hover:text-primary-light">
            Hai già un account? Accedi
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;