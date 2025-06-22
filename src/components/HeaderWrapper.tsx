
import React from 'react';
import { useLocation } from 'react-router-dom';
import Header from '@/components/Header';
import PublicHeader from '@/components/PublicHeader';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';

const HeaderWrapper = () => {
  const location = useLocation();
  const { user, isLoading } = useOptionalAuth();
  
  // Si on charge encore l'auth, afficher le header public pour éviter les erreurs
  if (isLoading) {
    return <PublicHeader />;
  }
  
  // Si l'utilisateur est connecté, toujours afficher le header complet avec tous les menus
  if (user) {
    return <Header />;
  }
  
  // Sinon afficher le header public pour les utilisateurs non connectés
  return <PublicHeader />;
};

export default HeaderWrapper;
