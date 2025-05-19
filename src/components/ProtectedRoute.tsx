
import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole } from '@/types/supabase';
import { useToast } from '@/hooks/use-toast';

interface ProtectedRouteProps {
  requiredRoles?: AppRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRoles = [] }) => {
  const { user, hasRole, isLoading, session } = useAuth();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    console.log('ProtectedRoute - Auth state:', { 
      isLoading, 
      hasUser: !!user, 
      hasSession: !!session,
      currentPath: location.pathname,
      userRoles: user ? 'Authentifié' : 'Non authentifié'
    });
    
    // Affichage de débogage pour les routes qui nécessitent des rôles
    if (requiredRoles.length > 0 && user) {
      requiredRoles.forEach(role => {
        console.log(`User has role ${role}:`, hasRole(role));
      });
    }
  }, [isLoading, user, session, location.pathname, hasRole, requiredRoles]);

  // Si l'authentification est en cours de chargement, afficher un loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Vérifier si l'utilisateur est connecté
  if (!user || !session) {
    console.log('ProtectedRoute: Redirecting to auth - No user or session');
    
    toast({
      title: "Connexion requise",
      description: "Veuillez vous connecter pour accéder à cette page.",
      variant: "default"
    });
    
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Vérifier si l'utilisateur a les rôles requis
  if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
    console.log('ProtectedRoute: Redirecting to unauthorized - Missing required role');
    
    toast({
      title: "Accès refusé",
      description: "Vous n'avez pas les droits nécessaires pour accéder à cette page.",
      variant: "destructive"
    });
    
    return <Navigate to="/unauthorized" replace />;
  }

  // Si toutes les conditions sont remplies, continuer vers la route protégée
  return <Outlet />;
};

export default ProtectedRoute;
