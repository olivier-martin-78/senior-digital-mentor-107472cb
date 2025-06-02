
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useRecentPermissions = () => {
  const { user } = useAuth();
  const [authorizedUserIds, setAuthorizedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAuthorizedUserIds([]);
      setLoading(false);
      return;
    }

    // Avec les nouvelles politiques RLS simplifiées, l'accès est géré automatiquement
    // On n'a plus besoin de calculer manuellement les permissions
    // Les politiques RLS filtrent automatiquement selon les règles :
    // - Contenu propre de l'utilisateur
    // - Contenu des membres du même groupe
    // - Contenu publié pour tous
    setAuthorizedUserIds([user.id]);
    setLoading(false);
  }, [user]);

  return { authorizedUserIds, loading };
};
