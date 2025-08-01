import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

const RegistrationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

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
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const approveRequest = async (requestId, assignedRole = 'user') => {
    try {
      const activationCode = generateActivationCode();
      
      const { error } = await supabase
        .from('pre_registration_requests')
        .update({
          status: 'approved',
          activation_code: activationCode,
          approved_at: new Date().toISOString(),
          approved_by: user?.email || 'admin', // Usa l'email dell'admin loggato
          role: assignedRole // Assegna il ruolo
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
        .update({ status: 'rejected' })
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Richieste di Registrazione</h1>
        <button 
          onClick={fetchRequests}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg"
        >
          Aggiorna
        </button>
      </div>
      
      <div className="bg-dark-lighter rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark border-b border-gray-600">
              <tr>
                <th className="px-6 py-3 text-left text-white">Nome</th>
                <th className="px-6 py-3 text-left text-white">Email</th>
                <th className="px-6 py-3 text-left text-white">Stato</th>
                <th className="px-6 py-3 text-left text-white">Data Richiesta</th>
                <th className="px-6 py-3 text-left text-white">Codice Attivazione</th>
                <th className="px-6 py-3 text-left text-white">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-b border-gray-600 hover:bg-dark/50">
                  <td className="px-6 py-4 text-gray-300 font-medium">{request.name}</td>
                  <td className="px-6 py-4 text-gray-300">{request.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300 text-sm">
                    {new Date(request.created_at).toLocaleString('it-IT')}
                  </td>
                  <td className="px-6 py-4">
                    {request.activation_code ? (
                      <code className="bg-dark px-2 py-1 rounded text-primary text-sm">
                        {request.activation_code}
                      </code>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => approveRequest(request.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Approva
                        </button>
                        <button
                          onClick={() => rejectRequest(request.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                        >
                          Rifiuta
                        </button>
                      </div>
                    )}
                    {request.status === 'approved' && (
                      <span className="text-green-400 text-sm">In attesa di attivazione</span>
                    )}
                    {request.status === 'completed' && (
                      <span className="text-blue-400 text-sm">Account attivato</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {requests.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            Nessuna richiesta di registrazione trovata.
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationRequests;

// Nella parte del rendering, aggiungi un dropdown per selezionare il ruolo:
<div className="flex gap-2">
  <select 
    className="px-3 py-1 border rounded"
    onChange={(e) => {
      const role = e.target.value;
      approveRequest(request.id, role);
    }}
    defaultValue=""
  >
    <option value="" disabled>Approva come...</option>
    <option value="user">Utente</option>
    <option value="admin">Admin</option>
  </select>
  <button
    onClick={() => rejectRequest(request.id)}
    className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
  >
    Rifiuta
  </button>
</div>