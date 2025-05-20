
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole } from '@/types/supabase';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface ProtectedRouteProps {
  requiredRoles?: AppRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRoles = [] }) => {
  const { user, hasRole, isLoading, session } = useAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    console.log('ProtectedRoute - Auth state:', { 
      isLoading, 
      hasUser: !!user, 
      hasSession: !!session,
      currentPath: location.pathname,
      userRoles: user ? 'Authentifié' : 'Non authentifié',
      isMobile,
      userAgent: navigator.userAgent
    });
    
    // Affichage de débogage pour les routes qui nécessitent des rôles
    if (requiredRoles.length > 0 && user) {
      requiredRoles.forEach(role => {
        console.log(`User has role ${role}:`, hasRole(role));
      });
    }

    // Move toast notifications into useEffect to avoid re-renders during rendering
    if (!isLoading) {
      if (!user || !session) {
        toast({
          title: "Connexion requise",
          description: "Veuillez vous connecter pour accéder à cette page.",
          variant: "default"
        });
        
        // Clear any previous errors on logout/session expiration
        setError(null);
      } else if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
        toast({
          title: "Accès refusé",
          description: "Vous n'avez pas les droits nécessaires pour accéder à cette page.",
          variant: "destructive"
        });
      }
    }
  }, [isLoading, user, session, location.pathname, hasRole, requiredRoles, toast]);

  // Si l'authentification est en cours de chargement, afficher un loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Display error if authentication failed
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Erreur d'authentification</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-4">
              <button 
                onClick={() => window.location.href = '/auth'} 
                className="bg-tranches-sage text-white px-4 py-2 rounded hover:bg-tranches-sage/90"
              >
                Retourner à la page de connexion
              </button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Vérifier si l'utilisateur est connecté
  if (!user || !session) {
    console.log('ProtectedRoute: Redirecting to auth - No user or session');
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Vérifier si l'utilisateur a les rôles requis
  if (requiredRoles.length > 0 && !requiredRoles.some(role => hasRole(role))) {
    console.log('ProtectedRoute: Redirecting to unauthorized - Missing required role');
    return <Navigate to="/unauthorized" replace />;
  }

  // Si toutes les conditions sont remplies, continuer vers la route protégée
  return <Outlet />;
};

export default ProtectedRoute;
