
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BlogAlbum } from '@/types/supabase';

export const useAlbumPermissions = (allAlbums: BlogAlbum[]) => {
  const { user } = useAuth();
  const [accessibleAlbums, setAccessibleAlbums] = useState<BlogAlbum[]>([]);

  useEffect(() => {
    if (!user) {
      console.log('AlbumPermissions - Pas d\'utilisateur connecté');
      setAccessibleAlbums([]);
      return;
    }

    console.log('AlbumPermissions - Utilisation des politiques RLS finales');
    
    // Avec les nouvelles politiques RLS finales, les albums dans allAlbums
    // sont déjà filtrés automatiquement par la politique "blog_albums_final"
    // qui gère :
    // - Admin voit tout
    // - Propriétaire voit ses albums
    // - Utilisateurs avec permissions voient les albums autorisés
    // - Utilisateurs du même groupe d'invitation
    console.log('AlbumPermissions - Albums filtrés par RLS:', allAlbums.length);
    setAccessibleAlbums(allAlbums);
  }, [allAlbums, user]);

  return { accessibleAlbums, setAccessibleAlbums };
};
