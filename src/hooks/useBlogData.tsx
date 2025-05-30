
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithAuthor, BlogAlbum } from '@/types/supabase';

export const useBlogData = (searchTerm: string, selectedAlbum: string, startDate?: string, endDate?: string, selectedUserId?: string | null) => {
  const { user, hasRole } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [albums, setAlbums] = useState<BlogAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  const hasCreatePermission = hasRole('editor') || hasRole('admin');

  useEffect(() => {
    Promise.all([fetchPosts(), fetchAlbums()]);
  }, [searchTerm, selectedAlbum, startDate, endDate, selectedUserId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      console.log('useBlogData - Début fetchPosts pour user:', user?.id, 'selectedUserId:', selectedUserId);
      
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          profiles(id, display_name, email, avatar_url, created_at)
        `)
        .order('created_at', { ascending: false });

      // Gestion des permissions pour les posts
      if (hasRole('admin')) {
        // Les admins voient tout (publié et non publié)
        console.log('useBlogData - Mode admin: voir tous les posts');
        if (selectedUserId) {
          query = query.eq('author_id', selectedUserId);
        }
      } else {
        console.log('useBlogData - Mode utilisateur normal');
        
        if (selectedUserId && selectedUserId !== user?.id) {
          // Vérifier d'abord les groupes d'invitation seulement
          const { data: groupPermissions, error: groupError } = await supabase
            .from('group_members')
            .select(`
              group_id,
              invitation_groups!inner(created_by)
            `)
            .eq('user_id', user?.id);

          if (groupError) {
            console.error('useBlogData - Erreur groupes:', groupError);
            setPosts([]);
            return;
          }

          const groupCreators = groupPermissions?.map(p => p.invitation_groups.created_by) || [];
          const hasGroupPermission = groupCreators.includes(selectedUserId);

          if (hasGroupPermission) {
            console.log('useBlogData - Permissions trouvées pour utilisateur sélectionné');
            // Voir seulement les posts publiés de cet utilisateur
            query = query.eq('author_id', selectedUserId).eq('published', true);
          } else {
            console.log('useBlogData - Pas de permissions pour voir les articles de cet utilisateur');
            setPosts([]);
            return;
          }
        } else {
          // Récupération avec permissions des groupes d'invitation
          console.log('useBlogData - Récupération des posts avec permissions strictes + groupes');
          
          // 1. Récupérer ses propres posts (TOUS, publiés ET brouillons)
          let userPostsQuery = supabase
            .from('blog_posts')
            .select(`
              *,
              profiles(id, display_name, email, avatar_url, created_at)
            `)
            .eq('author_id', user?.id)
            .order('created_at', { ascending: false });

          // Appliquer les filtres à la requête des posts utilisateur
          if (searchTerm) {
            userPostsQuery = userPostsQuery.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
          }
          if (selectedAlbum) {
            userPostsQuery = userPostsQuery.eq('album_id', selectedAlbum);
          }
          if (startDate) {
            userPostsQuery = userPostsQuery.gte('created_at', startDate);
          }
          if (endDate) {
            const endDateTime = endDate + 'T23:59:59';
            userPostsQuery = userPostsQuery.lte('created_at', endDateTime);
          }

          const { data: userPosts, error: userPostsError } = await userPostsQuery;
          
          if (userPostsError) {
            console.error('useBlogData - Erreur lors de la récupération des posts utilisateur:', userPostsError);
            setPosts([]);
            return;
          }

          console.log('useBlogData - Posts utilisateur récupérés:', userPosts?.length || 0);

          // 2. Récupérer les permissions pour déterminer les posts accessibles des autres
          const [albumPermissionsResult, groupPermissionsResult] = await Promise.all([
            supabase
              .from('album_permissions')
              .select('album_id')
              .eq('user_id', user?.id),
            // Récupérer les utilisateurs autorisés via les groupes d'invitation
            supabase
              .from('group_members')
              .select(`
                group_id,
                invitation_groups!inner(created_by)
              `)
              .eq('user_id', user?.id)
          ]);

          const albumPermissions = albumPermissionsResult.data || [];
          const groupPermissions = groupPermissionsResult.data || [];

          // IDs des albums autorisés explicitement
          const authorizedAlbumIds = albumPermissions.map(p => p.album_id).filter(Boolean);
          
          // IDs des utilisateurs autorisés via les groupes d'invitation (créateurs des groupes)
          const groupCreatorIds = groupPermissions.map(p => p.invitation_groups?.created_by).filter(id => id && id !== user?.id);
          
          // Combiner tous les utilisateurs autorisés
          const authorizedUserIds = [...new Set(groupCreatorIds)];

          console.log('useBlogData - Albums autorisés explicitement:', authorizedAlbumIds);
          console.log('useBlogData - Utilisateurs autorisés via groupes:', groupCreatorIds);
          console.log('useBlogData - Total utilisateurs autorisés:', authorizedUserIds);

          let otherPosts: PostWithAuthor[] = [];

          // 3. Récupérer les posts des autres SEULEMENT si on a des permissions
          if (authorizedAlbumIds.length > 0 || authorizedUserIds.length > 0) {
            let otherPostsQuery = supabase
              .from('blog_posts')
              .select(`
                *,
                profiles(id, display_name, email, avatar_url, created_at)
              `)
              .eq('published', true) // SEULEMENT les posts publiés des autres
              .neq('author_id', user?.id); // Exclure ses propres posts

            // Construire les conditions de permission
            let permissionConditions = [];
            
            // Condition 1: Posts dans des albums autorisés explicitement
            if (authorizedAlbumIds.length > 0) {
              permissionConditions.push(`album_id.in.(${authorizedAlbumIds.join(',')})`);
            }
            
            // Condition 2: Posts d'utilisateurs autorisés (groupes)
            if (authorizedUserIds.length > 0) {
              if (authorizedAlbumIds.length > 0) {
                // Si on a des permissions d'albums, prendre les posts d'utilisateurs autorisés 
                // qui sont SOIT sans album SOIT dans un album autorisé
                permissionConditions.push(`and(author_id.in.(${authorizedUserIds.join(',')}),or(album_id.is.null,album_id.in.(${authorizedAlbumIds.join(',')})))`);
              } else {
                // Si on n'a aucune permission d'album, prendre seulement les posts sans album des utilisateurs autorisés
                permissionConditions.push(`and(author_id.in.(${authorizedUserIds.join(',')}),album_id.is.null)`);
              }
            }

            if (permissionConditions.length > 0) {
              otherPostsQuery = otherPostsQuery.or(permissionConditions.join(','));

              // Appliquer les filtres
              if (searchTerm) {
                otherPostsQuery = otherPostsQuery.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
              }
              if (selectedAlbum) {
                otherPostsQuery = otherPostsQuery.eq('album_id', selectedAlbum);
              }
              if (startDate) {
                otherPostsQuery = otherPostsQuery.gte('created_at', startDate);
              }
              if (endDate) {
                const endDateTime = endDate + 'T23:59:59';
                otherPostsQuery = otherPostsQuery.lte('created_at', endDateTime);
              }

              const { data: otherPostsData, error: otherPostsError } = await otherPostsQuery;
              
              if (otherPostsError) {
                console.error('useBlogData - Erreur lors de la récupération des autres posts:', otherPostsError);
              } else {
                otherPosts = otherPostsData || [];
                console.log('useBlogData - Autres posts autorisés récupérés:', otherPosts.length);
                
                // Log détaillé pour debug
                otherPosts.forEach(post => {
                  console.log(`useBlogData - Post autorisé: "${post.title}" (album: ${post.album_id}, auteur: ${post.author_id})`);
                });
              }
            }
          }

          // Combiner ses posts avec les posts autorisés des autres
          const allPosts = [...(userPosts || []), ...otherPosts];
          
          // Trier par date de création (plus récent en premier)
          allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          console.log('useBlogData - Total posts finaux:', allPosts.length);
          setPosts(allPosts);
          return;
        }
      }

      // Application des filtres pour admin ou cas spéciaux
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      if (selectedAlbum) {
        query = query.eq('album_id', selectedAlbum);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        const endDateTime = endDate + 'T23:59:59';
        query = query.lte('created_at', endDateTime);
      }

      const { data, error } = await query;

      if (error) throw error;
      console.log('useBlogData - Posts récupérés:', data?.length || 0);
      setPosts(data || []);
    } catch (error) {
      console.error('useBlogData - Erreur lors du chargement des articles:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      console.log('useBlogData - Début fetchAlbums');
      
      let query = supabase
        .from('blog_albums')
        .select(`
          *,
          profiles(id, display_name, email, avatar_url, created_at)
        `)
        .order('name');

      // Gestion des permissions pour les albums
      if (hasRole('admin')) {
        // Les admins voient tous les albums
        console.log('useBlogData - Admin: voir tous les albums');
        if (selectedUserId) {
          query = query.eq('author_id', selectedUserId);
        }
      } else {
        console.log('useBlogData - Utilisateur normal: filtrage par permissions');
        
        if (selectedUserId && selectedUserId !== user?.id) {
          // Vérifier les permissions groupes pour cet utilisateur
          const { data: groupPermissions, error: groupError } = await supabase
            .from('group_members')
            .select(`
              group_id,
              invitation_groups!inner(created_by)
            `)
            .eq('user_id', user?.id);

          if (groupError) {
            console.error('useBlogData - Erreur groupes albums:', groupError);
            setAlbums([]);
            return;
          }

          const groupCreators = groupPermissions?.map(p => p.invitation_groups.created_by) || [];
          const hasGroupPermission = groupCreators.includes(selectedUserId);

          if (hasGroupPermission) {
            query = query.eq('author_id', selectedUserId);
          } else {
            console.log('useBlogData - Pas de permissions pour voir les albums de cet utilisateur');
            setAlbums([]);
            return;
          }
        } else {
          // Récupérer les permissions album ET groupes d'invitation
          const [albumPermissionsResult, groupPermissionsResult] = await Promise.all([
            supabase
              .from('album_permissions')
              .select('album_id, blog_albums!inner(author_id)')
              .eq('user_id', user?.id),
            // Récupérer les créateurs de groupes dont l'utilisateur est membre
            supabase
              .from('group_members')
              .select(`
                group_id,
                invitation_groups!inner(created_by)
              `)
              .eq('user_id', user?.id)
          ]);

          const albumPermissions = albumPermissionsResult.data || [];
          const groupPermissions = groupPermissionsResult.data || [];

          // Créer une liste des IDs d'utilisateurs autorisés
          const authorizedUserIds = [user?.id];
          
          // Ajouter les créateurs de groupes
          groupPermissions.forEach(p => {
            if (p.invitation_groups?.created_by && !authorizedUserIds.includes(p.invitation_groups.created_by)) {
              authorizedUserIds.push(p.invitation_groups.created_by);
            }
          });

          // Récupérer les albums autorisés directement
          const authorizedAlbumIds = albumPermissions.map(p => p.album_id).filter(Boolean);

          console.log('useBlogData - Albums - Utilisateurs autorisés:', authorizedUserIds);
          console.log('useBlogData - Albums - IDs d\'albums autorisés:', authorizedAlbumIds);

          // Construire la requête avec les permissions
          let filterConditions = [];
          
          // Albums de l'utilisateur et des utilisateurs autorisés
          if (authorizedUserIds.length > 0) {
            filterConditions.push(`author_id.in.(${authorizedUserIds.join(',')})`);
          }
          
          // Albums autorisés directement
          if (authorizedAlbumIds.length > 0) {
            filterConditions.push(`id.in.(${authorizedAlbumIds.join(',')})`);
          }

          if (filterConditions.length > 0) {
            query = query.or(filterConditions.join(','));
          } else {
            // Fallback: seulement ses propres albums
            query = query.eq('author_id', user?.id);
          }
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      console.log('useBlogData - Albums récupérés:', data?.length || 0);
      setAlbums(data || []);
    } catch (error) {
      console.error('useBlogData - Erreur lors du chargement des albums:', error);
      setAlbums([]);
    }
  };

  return {
    posts,
    albums,
    loading,
    hasCreatePermission
  };
};
