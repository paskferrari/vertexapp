import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RootRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f172a'
      }}>
        <div style={{ color: 'white' }}>Loading...</div>
      </div>
    );
  }

  // Redirect authenticated users to dashboard, others to guest page
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/guest" replace />;
};

export default RootRedirect;