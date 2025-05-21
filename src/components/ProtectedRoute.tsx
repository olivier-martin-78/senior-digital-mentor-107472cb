import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ requiredRoles }: { requiredRoles?: string[] }) => {
  const { session, hasRole, loading } = useAuth();

  // Attendre que l'état d'authentification soit résolu
  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
    </div>;
  }

  // Rediriger vers /auth si non authentifié
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Rediriger vers /unauthorized si l'utilisateur n'a pas les rôles requis
  if (requiredRoles && !requiredRoles.some(role => hasRole(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
