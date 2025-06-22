
import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import PublicHeader from '@/components/PublicHeader';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';

const HeaderWrapper = () => {
  const location = useLocation();
  const { user, isLoading } = useOptionalAuth();
  
  // Sur les routes publiques, utiliser le header approprié selon l'état d'auth
  const isPublicRoute = ['/', '/auth', '/reset-password'].includes(location.pathname);
  
  if (isPublicRoute) {
    // Si on charge encore l'auth, afficher le header public pour éviter les erreurs
    if (isLoading) {
      return <PublicHeader />;
    }
    
    // Si l'utilisateur est connecté sur une route publique, afficher le header complet
    if (user) {
      return <Header />;
    }
    
    // Sinon afficher le header public
    return <PublicHeader />;
  }
  
  // Sur les routes privées, toujours utiliser le header complet (AuthProvider disponible)
  return <Header />;
};

export default HeaderWrapper;
