
import { Navigate, Outlet } from 'react-router-dom';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import { AppRole } from '@/types/supabase';
import { useAccountAccess } from '@/hooks/useAccountAccess';
import AccessRestrictedPage from '@/components/AccessRestrictedPage';

interface ProtectedRouteProps {
  requiredRoles?: AppRole[];
  requiresFullAccess?: boolean;
}

const ProtectedRoute = ({ requiredRoles, requiresFullAccess = true }: ProtectedRouteProps) => {
  const { session, hasRole, isLoading, roles } = useOptionalAuth();
  const { hasAccess, isLoading: accessLoading } = useAccountAccess();

  // Show loading while authentication is being checked
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
    </div>;
  }

  // If not authenticated, redirect to login
  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // Show loading while account access is being checked (only if access loading and we need full access)
  if (requiresFullAccess && accessLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
    </div>;
  }

  // If roles are required but user has no roles yet, show loading
  if (requiredRoles && requiredRoles.length > 0 && roles.length === 0 && isLoading) {
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
    </div>;
  }

  // Check role permissions
  if (requiredRoles && requiredRoles.length > 0) {
    if (!requiredRoles.some(role => hasRole(role))) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Check account access only if full access is required
  if (requiresFullAccess && !hasAccess) {
    return <AccessRestrictedPage><Outlet /></AccessRestrictedPage>;
  }
  return <Outlet />;
};

export default ProtectedRoute;
