
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

        // Récupération avec permissions des groupes d'invitation
        console.log('useBlogAlbums - Récupération des albums avec permissions groupes');
        
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

        console.log('useBlogAlbums - Albums utilisateur récupérés:', userAlbums?.length || 0);

        let otherAlbums: BlogAlbum[] = [];

        // 2. Récupérer TOUS les albums via les permissions directes (album_permissions)
        console.log('useBlogAlbums - Récupération albums via permissions directes pour utilisateur:', effectiveUserId);
        const { data: albumPermissions, error: albumPermissionsError } = await supabase
          .from('album_permissions')
          .select(`
            album_id,
            blog_albums(
              *,
              profiles(id, display_name, email, avatar_url, created_at)
            )
          `)
          .eq('user_id', effectiveUserId);

        console.log('useBlogAlbums - Résultat permissions directes:', {
          data: albumPermissions,
          error: albumPermissionsError,
          count: albumPermissions?.length || 0
        });

        if (!albumPermissionsError && albumPermissions) {
          const permittedAlbums = albumPermissions
            .map(p => p.blog_albums)
            .filter(album => album !== null); // Filtrer les albums null
          
          otherAlbums.push(...permittedAlbums);
          console.log('useBlogAlbums - Albums via permissions directes ajoutés:', permittedAlbums.length);
          permittedAlbums.forEach(album => {
            console.log('useBlogAlbums - Album direct:', { id: album.id, name: album.name });
          });
        }

        // 3. Récupérer les albums des autres utilisateurs autorisés via groupes
        if (authorizedUserIds && authorizedUserIds.length > 0) {
          console.log('useBlogAlbums - Récupération albums via groupes pour userIds:', authorizedUserIds);
          const { data: otherAlbumsData, error: otherAlbumsError } = await supabase
            .from('blog_albums')
            .select(`
              *,
              profiles(id, display_name, email, avatar_url, created_at)
            `)
            .in('author_id', authorizedUserIds)
            .order('name');

          console.log('useBlogAlbums - Résultat albums via groupes:', {
            data: otherAlbumsData,
            error: otherAlbumsError,
            count: otherAlbumsData?.length || 0
          });

          if (otherAlbumsError) {
            console.error('useBlogAlbums - Erreur autres albums:', otherAlbumsError);
          } else {
            otherAlbums.push(...(otherAlbumsData || []));
            console.log('useBlogAlbums - Autres albums autorisés récupérés:', otherAlbumsData?.length || 0);
          }
        }

        // Combiner ses albums avec les albums autorisés des autres (en évitant les doublons)
        const allAlbums = [...(userAlbums || [])];
        otherAlbums.forEach(album => {
          if (!allAlbums.find(existing => existing.id === album.id)) {
            allAlbums.push(album);
          }
        });
        
        console.log('useBlogAlbums - ===== RÉSUMÉ FINAL =====');
        console.log('useBlogAlbums - Albums utilisateur:', userAlbums?.length || 0);
        console.log('useBlogAlbums - Albums via permissions directes:', albumPermissions?.length || 0);
        console.log('useBlogAlbums - Albums via groupes:', authorizedUserIds?.length || 0, 'utilisateurs autorisés');
        console.log('useBlogAlbums - Total albums finaux:', allAlbums.length);
        console.log('useBlogAlbums - Albums finaux:', allAlbums.map(a => ({ id: a.id, name: a.name, author: a.profiles?.display_name })));
        
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
