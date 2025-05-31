
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BlogAlbum } from '@/types/supabase';

export const useBlogAlbums = (
  selectedUserId?: string | null,
  effectiveUserId?: string,
  authorizedUserIds?: string[]
) => {
  const { hasRole } = useAuth();
  const [albums, setAlbums] = useState<BlogAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setLoading(true);
        console.log('useBlogAlbums - Début fetchAlbums avec nouvelles politiques consolidées');
        
        if (hasRole('admin')) {
          // Les admins voient tous les albums avec la nouvelle politique consolidée
          console.log('useBlogAlbums - Admin: utilisation de la politique consolidée');
          const { data, error } = await supabase
            .from('blog_albums')
            .select(`
              *,
              profiles(id, display_name, email, avatar_url, created_at)
            `)
            .order('name');

          if (error) {
            console.error('useBlogAlbums - Erreur admin:', error);
            throw error;
          }
          
          console.log('useBlogAlbums - Albums récupérés (admin):', data?.length || 0);
          setAlbums(data || []);
          return;
        }

        // Pour les utilisateurs non-admin, utilisation des nouvelles politiques consolidées
        console.log('useBlogAlbums - Utilisateur standard: utilisation des politiques consolidées');
        
        // Récupération directe avec les politiques RLS consolidées
        // La politique "blog_albums_select_consolidated" gère maintenant automatiquement :
        // - Les albums du propriétaire
        // - Les albums avec permissions directes
        // - La logique admin
        const { data, error } = await supabase
          .from('blog_albums')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .order('name');

        if (error) {
          console.error('useBlogAlbums - Erreur politique consolidée:', error);
          throw error;
        }

        console.log('useBlogAlbums - Albums récupérés avec politique consolidée:', data?.length || 0);
        console.log('useBlogAlbums - Albums détails:', data?.map(a => ({ id: a.id, name: a.name, author: a.profiles?.display_name })));
        
        setAlbums(data || []);
        
      } catch (error) {
        console.error('useBlogAlbums - Erreur lors du chargement des albums:', error);
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    };

    if (effectiveUserId) {
      fetchAlbums();
    }
  }, [selectedUserId, effectiveUserId, authorizedUserIds, hasRole]);

  return { albums, loading };
};
