import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ requiredRoles }: { requiredRoles?: string[] }) => {
  const { session, hasRole, loading } = useAuth();

  console.log('ProtectedRoute - loading:', loading, 'session:', session ? 'present' : 'null');

  if (loading) {
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
