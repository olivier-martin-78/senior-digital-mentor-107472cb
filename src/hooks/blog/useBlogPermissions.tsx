
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useBlogPermissions = () => {
  const { user } = useAuth();
  const [authorizedUserIds, setAuthorizedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setAuthorizedUserIds([]);
      setLoading(false);
      return;
    }

    console.log('useBlogPermissions - Utilisation des politiques RLS consolidées');
    
    // Avec les nouvelles politiques RLS consolidées, la gestion des permissions
    // est entièrement déléguée aux politiques de base de données.
    // Plus besoin de gérer la logique côté client car les politiques 
    // "blog_albums_final" et "blog_posts_final" s'occupent de tout
    setAuthorizedUserIds([user.id]);
    setLoading(false);
  }, [user]);

  return { authorizedUserIds, loading };
};
