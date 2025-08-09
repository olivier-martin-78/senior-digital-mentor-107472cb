import React from 'react';
import { MiniSiteForm } from '@/components/mini-site/MiniSiteForm';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import { Navigate } from 'react-router-dom';

export const MiniSiteBuilder: React.FC = () => {
  console.log('🔥 [MINI_SITE_BUILDER_DEBUG] Composant MiniSiteBuilder rendu');
  const { user, isLoading } = useOptionalAuth();

  console.log('🔥 [MINI_SITE_BUILDER_DEBUG] État auth:', { user: !!user, isLoading });

  if (isLoading) {
    console.log('🔥 [MINI_SITE_BUILDER_DEBUG] Affichage loading...');
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-lg">Chargement...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log('🔥 [MINI_SITE_BUILDER_DEBUG] Pas d\'utilisateur, redirection vers /auth');
    return <Navigate to="/auth" replace />;
  }

  console.log('🔥 [MINI_SITE_BUILDER_DEBUG] Rendu MiniSiteForm');
  return <MiniSiteForm />;
};