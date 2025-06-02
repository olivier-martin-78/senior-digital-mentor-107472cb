
import { useState, useEffect } from 'react';
import { BlogAlbum } from '@/types/supabase';
import { useAuth } from '@/contexts/AuthContext';

export const useAlbumPermissions = (allAlbums: BlogAlbum[]) => {
  const { user } = useAuth();
  const [accessibleAlbums, setAccessibleAlbums] = useState<BlogAlbum[]>([]);

  useEffect(() => {
    if (!user) {
      setAccessibleAlbums([]);
      return;
    }

    // Avec le nouveau système RLS, tous les albums récupérés sont déjà accessibles
    // Les politiques RLS filtrent automatiquement selon les permissions
    setAccessibleAlbums(allAlbums);
  }, [allAlbums, user]);

  return { accessibleAlbums, setAccessibleAlbums };
};
