
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole } from '@/types/supabase';

interface ProtectedRouteProps {
  requiredRoles?: AppRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRoles = [] }) => {
  const { user, hasRole, isLoading } = useAuth();
  const location = useLocation();

  // Si l'authentification est en cours de chargement, afficher un loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Vérifier si l'utilisateur est connecté
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Vérifier si l'utilisateur a les rôles requis
  if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si toutes les conditions sont remplies, continuer vers la route protégée
  return <Outlet />;
};

export default ProtectedRoute;
