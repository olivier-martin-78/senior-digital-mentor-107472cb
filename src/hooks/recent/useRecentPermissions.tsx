
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

    // Avec la nouvelle logique simplifiée, l'accès aux contenus se fait automatiquement
    // via l'appartenance aux groupes d'invitation. Les politiques RLS gèrent tout.
    // On retourne juste l'ID de l'utilisateur actuel pour les contenus qu'il possède.
    setAuthorizedUserIds([user.id]);
    setLoading(false);
  }, [user]);

  return { authorizedUserIds, loading };
};
