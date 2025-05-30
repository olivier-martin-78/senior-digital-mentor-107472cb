
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
        console.log('useBlogAlbums - Début fetchAlbums');
        
        if (hasRole('admin')) {
          // Les admins voient tous les albums
          console.log('useBlogAlbums - Admin: voir tous les albums');
          let query = supabase
            .from('blog_albums')
            .select(`
              *,
              profiles(id, display_name, email, avatar_url, created_at)
            `)
            .order('name');

          if (selectedUserId) {
            query = query.eq('author_id', selectedUserId);
          }

          const { data, error } = await query;
          if (error) throw error;
          console.log('useBlogAlbums - Albums récupérés (admin):', data?.length || 0);
          setAlbums(data || []);
          return;
        }

        // Pour les utilisateurs non-admin
        if (selectedUserId && selectedUserId !== effectiveUserId) {
          // Vérifier les permissions groupes pour cet utilisateur
          const hasGroupPermission = authorizedUserIds?.includes(selectedUserId);

          if (hasGroupPermission) {
            const { data, error } = await supabase
              .from('blog_albums')
              .select(`
                *,
                profiles(id, display_name, email, avatar_url, created_at)
              `)
              .eq('author_id', selectedUserId)
              .order('name');

            if (error) throw error;
            console.log('useBlogAlbums - Albums utilisateur autorisé récupérés:', data?.length || 0);
            setAlbums(data || []);
          } else {
            console.log('useBlogAlbums - Pas de permissions pour voir les albums de cet utilisateur');
            setAlbums([]);
          }
          return;
        }

        // Récupérer les albums avec permissions groupes
        // 1. Ses propres albums
        const { data: userAlbums, error: userAlbumsError } = await supabase
          .from('blog_albums')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .eq('author_id', effectiveUserId)
          .order('name');

        if (userAlbumsError) {
          console.error('useBlogAlbums - Erreur albums utilisateur:', userAlbumsError);
          setAlbums([]);
          return;
        }

        console.log('useBlogAlbums - Albums - Utilisateurs autorisés via groupes:', authorizedUserIds);

        let otherAlbums: BlogAlbum[] = [];

        // 3. Récupérer les albums des autres utilisateurs autorisés
        if (authorizedUserIds && authorizedUserIds.length > 0) {
          const { data: otherAlbumsData, error: otherAlbumsError } = await supabase
            .from('blog_albums')
            .select(`
              *,
              profiles(id, display_name, email, avatar_url, created_at)
            `)
            .in('author_id', authorizedUserIds)
            .order('name');

          if (otherAlbumsError) {
            console.error('useBlogAlbums - Erreur autres albums:', otherAlbumsError);
          } else {
            otherAlbums = otherAlbumsData || [];
            console.log('useBlogAlbums - Autres albums autorisés récupérés:', otherAlbums.length);
          }
        }

        // Combiner ses albums avec les albums autorisés des autres
        const allAlbums = [...(userAlbums || []), ...otherAlbums];
        
        console.log('useBlogAlbums - Total albums finaux:', allAlbums.length);
        setAlbums(allAlbums);
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
