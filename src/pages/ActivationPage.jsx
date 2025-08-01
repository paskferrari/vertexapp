import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ActivationPage = () => {
  const { activateAccount } = useAuth();
  const [formData, setFormData] = useState({ email: '', activationCode: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const result = await activateAccount(formData.email, formData.activationCode);
    
    if (result.success) {
      setMessage(result.message);
      setFormData({ email: '', activationCode: '' });
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
          <h2 className="text-3xl font-bold text-white mb-2">Attiva Account</h2>
          <p className="text-gray-400">Inserisci il codice di attivazione ricevuto</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
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
              Codice di Attivazione
            </label>
            <input
              type="text"
              name="activationCode"
              value={formData.activationCode}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 bg-dark-lighter border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="Inserisci il codice ricevuto"
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
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Attivazione...' : 'Attiva Account'}
          </button>
        </form>
        
        <div className="text-center">
          <Link to="/login" className="text-primary hover:text-primary-light">
            Torna al Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ActivationPage;