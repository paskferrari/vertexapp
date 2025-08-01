import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext'; // QUESTA RIGA

const RegistrationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // QUESTA RIGA È FONDAMENTALE

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('pre_registration_requests')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateActivationCode = () => {
    // Genera un codice più sicuro usando crypto
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const approveRequest = async (requestId, assignedRole = 'user') => {
    try {
      const activationCode = generateActivationCode();
      
      // Imposta scadenza a 24 ore da ora
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      const { error } = await supabase
        .from('pre_registration_requests')
        .update({
          status: 'approved',
          activation_code: activationCode,
          activation_code_expires_at: expiresAt.toISOString(),
          approved_at: new Date().toISOString(),
          approved_by: user?.email || 'admin',
          role: assignedRole
        })
        .eq('id', requestId);
      
      if (error) throw error;
      
      alert(`Richiesta approvata con ruolo: ${assignedRole}!\n\nCodice di attivazione: ${activationCode}\n\nFornisci questo codice all'utente per completare la registrazione.`);
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Errore durante l\'approvazione');
    }
  };

  const rejectRequest = async (requestId) => {
    if (!confirm('Sei sicuro di voler rifiutare questa richiesta?')) return;
    
    try {
      const { error } = await supabase
        .from('pre_registration_requests')
        .update({ 
          status: 'rejected',
          approved_by: user?.email || 'admin' // USA user?.email con fallback
        })
        .eq('id', requestId);
      
      if (error) throw error;
      
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/20 text-yellow-500';
      case 'approved': return 'bg-green-500/20 text-green-500';
      case 'completed': return 'bg-blue-500/20 text-blue-500';
      case 'rejected': return 'bg-red-500/20 text-red-500';
      default: return 'bg-gray-500/20 text-gray-500';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'In Attesa';
      case 'approved': return 'Approvata';
      case 'completed': return 'Completata';
      case 'rejected': return 'Rifiutata';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Richieste di Registrazione</h1>
        
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Nessuna richiesta di registrazione trovata.</p>
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Stato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white">
                          {request.name}
                        </div>
                        {request.message && (
                          <div className="text-sm text-gray-400 mt-1">
                            {request.message}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {request.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {new Date(request.created_at).toLocaleDateString('it-IT')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <select 
                              className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                              onChange={(e) => {
                                if (e.target.value) {
                                  approveRequest(request.id, e.target.value);
                                  e.target.value = ''; // Reset selection
                                }
                              }}
                              defaultValue=""
                            >
                              <option value="" disabled>Approva come...</option>
                              <option value="user">Utente</option>
                              <option value="admin">Admin</option>
                            </select>
                            <button
                              onClick={() => rejectRequest(request.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                            >
                              Rifiuta
                            </button>
                          </div>
                        )}
                        {request.status === 'approved' && (
                          <div className="text-xs">
                            <div className="text-green-400 mb-1">
                              ✅ Approvata
                            </div>
                            {request.activation_code && (
                              <div className="bg-green-900/30 p-2 rounded border border-green-500/30">
                                <div className="text-green-300 font-semibold text-sm">Codice Attivazione:</div>
                                <div className="text-green-100 font-mono text-sm bg-green-800/50 px-2 py-1 rounded mt-1">
                                  {request.activation_code}
                                </div>
                                <div className="text-green-400 text-xs mt-1">
                                  Fornisci questo codice all'utente
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationRequests;