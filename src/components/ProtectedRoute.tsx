
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole } from '@/types/supabase';
import { useAccountAccess } from '@/hooks/useAccountAccess';
import AccessRestrictedPage from '@/components/AccessRestrictedPage';

interface ProtectedRouteProps {
  requiredRoles?: AppRole[];
  requiresFullAccess?: boolean;
}

const ProtectedRoute = ({ requiredRoles, requiresFullAccess = true }: ProtectedRouteProps) => {
  const { session, hasRole, isLoading, roles } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useAccountAccess();

  console.log('ProtectedRoute - État:', {
    isLoading,
    session: !!session,
    requiredRoles,
    requiresFullAccess,
    accessLoading,
    hasAccess,
    rolesCount: roles.length
  });

  // Show loading while authentication is being checked
  if (isLoading) {
    console.log('ProtectedRoute - Affichage du chargement auth');
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
    </div>;
  }

  // If not authenticated, redirect to login
  if (!session) {
    console.log('ProtectedRoute - Redirection vers /auth (pas de session)');
    return <Navigate to="/auth" replace />;
  }

  // Show loading while account access is being checked (only if access loading and we need full access)
  if (requiresFullAccess && accessLoading) {
    console.log('ProtectedRoute - Chargement des accès compte');
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
    </div>;
  }

  // If roles are required but user has no roles yet, show loading
  if (requiredRoles && requiredRoles.length > 0 && roles.length === 0 && isLoading) {
    console.log('ProtectedRoute - Chargement des rôles requis');
    return <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
    </div>;
  }

  // Check role permissions
  if (requiredRoles && requiredRoles.length > 0) {
    console.log('🔐 ProtectedRoute - Vérification des rôles:', {
      requiredRoles,
      userRoles: roles,
      hasAnyRequiredRole: requiredRoles.some(role => hasRole(role))
    });
    
    if (!requiredRoles.some(role => hasRole(role))) {
      console.log('❌ ProtectedRoute - Redirection vers /unauthorized (rôles insuffisants)');
      return <Navigate to="/unauthorized" replace />;
    }
    
    console.log('✅ ProtectedRoute - Rôles suffisants, accès autorisé');
  }

  // Check account access only if full access is required
  if (requiresFullAccess && !hasAccess) {
    console.log('ProtectedRoute - Accès restreint');
    return <AccessRestrictedPage><Outlet /></AccessRestrictedPage>;
  }

  console.log('ProtectedRoute - Rendu de Outlet');
  return <Outlet />;
};

export default ProtectedRoute;
