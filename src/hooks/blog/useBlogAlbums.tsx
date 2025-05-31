
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BlogAlbum } from '@/types/supabase';

export const useBlogAlbums = () => {
  const { user } = useAuth();
  const [albums, setAlbums] = useState<BlogAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      if (!user) {
        setAlbums([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('useBlogAlbums - Récupération avec politiques RLS consolidées');
        
        // Utilisation directe des politiques RLS consolidées
        // La politique "blog_albums_final" gère automatiquement tous les cas :
        // - Admin voit tout
        // - Propriétaire voit ses albums
        // - Utilisateurs avec permissions voient les albums autorisés
        // - Utilisateurs du même groupe d'invitation
        const { data, error } = await supabase
          .from('blog_albums')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .order('name');

        if (error) {
          console.error('useBlogAlbums - Erreur:', error);
          throw error;
        }
        
        console.log('useBlogAlbums - Albums récupérés:', data?.length || 0);
        setAlbums(data || []);
        
      } catch (error) {
        console.error('useBlogAlbums - Erreur lors du chargement des albums:', error);
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, [user]);

  return { albums, loading };
};
