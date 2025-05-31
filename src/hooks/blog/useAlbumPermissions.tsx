
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

    console.log('AlbumPermissions - Utilisation des nouvelles politiques RLS simplifiées');
    
    // Avec les nouvelles politiques RLS simplifiées, les albums dans allAlbums
    // sont déjà filtrés automatiquement par les politiques qui utilisent is_admin()
    // qui gère :
    // - Admin voit tout (via "Admin can access all blog albums")  
    // - Propriétaire voit ses albums (via "Users can access their own blog albums")
    console.log('AlbumPermissions - Albums filtrés par RLS:', allAlbums.length);
    setAccessibleAlbums(allAlbums);
  }, [allAlbums, user]);

  return { accessibleAlbums, setAccessibleAlbums };
};
