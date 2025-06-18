
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole } from '@/types/supabase';
import { useAccountAccess } from '@/hooks/useAccountAccess';
import AccessRestrictedPage from '@/components/AccessRestrictedPage';

const ProtectedRoute = ({ requiredRoles }: { requiredRoles?: AppRole[] }) => {
  const { session, hasRole, isLoading, roles } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useAccountAccess();

  // Show loading while authentication is being checked
  if (isLoading || accessLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
    </div>;
  }

  // If not authenticated, redirect to login
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // If roles are required but user has no roles yet (still loading), wait
  if (requiredRoles && roles.length === 0) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
    </div>;
  }

  // Check role permissions
  if (requiredRoles && !requiredRoles.some(role => hasRole(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check account access (subscription/trial)
  if (!hasAccess) {
    return <AccessRestrictedPage><Outlet /></AccessRestrictedPage>;
  }

  return <Outlet />;
};

export default ProtectedRoute;
