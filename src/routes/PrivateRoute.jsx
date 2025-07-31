import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PrivateRoute component for protecting routes that require authentication
 * Redirects to login page if user is not authenticated
 */
const PrivateRoute = () => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
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

  // If authenticated, render the child routes (Outlet)
  // Otherwise, redirect to the login page
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;