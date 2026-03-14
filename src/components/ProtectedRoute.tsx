import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ 
  children, 
  adminOnly = false 
}: { 
  children: React.ReactNode; 
  adminOnly?: boolean;
}) => {
  const { user, loading, company, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    const denied = typeof window !== 'undefined' && localStorage.getItem('auth_denied') === '1';
    if (denied) {
      try { localStorage.removeItem('auth_denied'); } catch (_e) { void 0; }
      return <Navigate to="/login?denied=1" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (!company) {
    try { localStorage.removeItem('auth_denied'); } catch (_e) { void 0; }
    return <Navigate to="/login?denied=1" replace />;
  }

  if (adminOnly && !isAdmin) {
    console.log('ProtectedRoute - Non-admin trying to access admin-only route');
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
