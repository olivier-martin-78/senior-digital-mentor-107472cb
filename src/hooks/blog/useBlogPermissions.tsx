
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

    console.log('useBlogPermissions - Utilisation des nouvelles politiques RLS simplifiées');
    
    // Avec les nouvelles politiques RLS simplifiées, la gestion des permissions
    // est entièrement déléguée aux politiques de base de données.
    // Les politiques utilisent la fonction is_admin() pour donner accès complet aux admins
    // et permettent aux utilisateurs de voir leurs propres contenus
    setAuthorizedUserIds([user.id]);
    setLoading(false);
  }, [user]);

  return { authorizedUserIds, loading };
};
