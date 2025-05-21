
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { AppRole } from '@/types/supabase';

const ProtectedRoute = ({ requiredRoles }: { requiredRoles?: AppRole[] }) => {
  const { session, hasRole, isLoading } = useAuth();

  console.log('ProtectedRoute - loading:', isLoading, 'session:', session ? 'present' : 'null');

  // Force redirection à /auth si pas de session
  useEffect(() => {
    console.log('ProtectedRoute - useEffect check');
    // Si le chargement est terminé et pas de session, rediriger vers /auth
    if (!isLoading && !session) {
      console.log('ProtectedRoute - No session after loading, should redirect');
    }
  }, [isLoading, session]);

  if (isLoading) {
    console.log('ProtectedRoute - Showing loading spinner');
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
    </div>;
  }

  if (!session) {
    console.log('ProtectedRoute - Redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  if (requiredRoles && !requiredRoles.some(role => hasRole(role))) {
    console.log('ProtectedRoute - Redirecting to /unauthorized, required roles:', requiredRoles);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('ProtectedRoute - Rendering Outlet');
  return <Outlet />;
};

export default ProtectedRoute;
