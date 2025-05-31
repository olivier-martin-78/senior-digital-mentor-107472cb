
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithAuthor } from '@/types/supabase';

export const useBlogPosts = (
  searchTerm: string, 
  selectedAlbum: string, 
  startDate?: string, 
  endDate?: string, 
  selectedUserId?: string | null,
  effectiveUserId?: string,
  authorizedUserIds?: string[]
) => {
  const { hasRole } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        console.log('useBlogPosts - Début fetchPosts pour effectiveUserId:', effectiveUserId, 'selectedUserId:', selectedUserId);
        
        if (hasRole('admin')) {
          // Les admins voient tout (publié et non publié)
          console.log('useBlogPosts - Mode admin: voir tous les posts');
          let query = supabase
            .from('blog_posts')
            .select(`
              *,
              profiles(id, display_name, email, avatar_url, created_at)
            `)
            .order('created_at', { ascending: false });

          if (selectedUserId) {
            query = query.eq('author_id', selectedUserId);
          }

          // Appliquer les filtres pour admin
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
          console.log('useBlogPosts - Posts récupérés (admin):', data?.length || 0);
          setPosts(data || []);
          return;
        }

        // Pour les utilisateurs non-admin
        if (selectedUserId && selectedUserId !== effectiveUserId) {
          // Vérifier les permissions pour voir les posts de cet utilisateur
          const hasGroupPermission = authorizedUserIds?.includes(selectedUserId);

          if (hasGroupPermission) {
            console.log('useBlogPosts - Permissions trouvées pour utilisateur sélectionné');
            let query = supabase
              .from('blog_posts')
              .select(`
                *,
                profiles(id, display_name, email, avatar_url, created_at)
              `)
              .eq('author_id', selectedUserId)
              .eq('published', true)
              .order('created_at', { ascending: false });

            // Appliquer les filtres
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
            console.log('useBlogPosts - Posts utilisateur autorisé récupérés:', data?.length || 0);
            setPosts(data || []);
          } else {
            console.log('useBlogPosts - Pas de permissions pour voir les articles de cet utilisateur');
            setPosts([]);
          }
          return;
        }

        // Récupération avec permissions des groupes d'invitation
        console.log('useBlogPosts - Récupération des posts avec permissions groupes');
        
        // 1. Récupérer ses propres posts (TOUS, publiés ET brouillons)
        let userPostsQuery = supabase
          .from('blog_posts')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .eq('author_id', effectiveUserId)
          .order('created_at', { ascending: false });

        // Appliquer les filtres aux posts utilisateur
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
          console.error('useBlogPosts - Erreur lors de la récupération des posts utilisateur:', userPostsError);
          setPosts([]);
          return;
        }

        console.log('useBlogPosts - Posts utilisateur récupérés:', userPosts?.length || 0);

        let otherPosts: PostWithAuthor[] = [];

        // 2. NOUVELLE ÉTAPE : Récupérer les posts des albums avec permissions directes
        console.log('useBlogPosts - Récupération posts via permissions directes albums');
        const { data: albumPermissions, error: albumPermissionsError } = await supabase
          .from('album_permissions')
          .select('album_id')
          .eq('user_id', effectiveUserId);

        if (!albumPermissionsError && albumPermissions && albumPermissions.length > 0) {
          const albumIds = albumPermissions.map(p => p.album_id);
          console.log('useBlogPosts - Albums avec permissions directes:', albumIds);

          let albumPostsQuery = supabase
            .from('blog_posts')
            .select(`
              *,
              profiles(id, display_name, email, avatar_url, created_at)
            `)
            .eq('published', true) // SEULEMENT les posts publiés des albums avec permissions
            .in('album_id', albumIds)
            .order('created_at', { ascending: false });

          // Appliquer les filtres aux posts d'albums
          if (searchTerm) {
            albumPostsQuery = albumPostsQuery.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
          }
          if (selectedAlbum) {
            albumPostsQuery = albumPostsQuery.eq('album_id', selectedAlbum);
          }
          if (startDate) {
            albumPostsQuery = albumPostsQuery.gte('created_at', startDate);
          }
          if (endDate) {
            const endDateTime = endDate + 'T23:59:59';
            albumPostsQuery = albumPostsQuery.lte('created_at', endDateTime);
          }

          const { data: albumPosts, error: albumPostsError } = await albumPostsQuery;
          
          if (!albumPostsError && albumPosts) {
            otherPosts.push(...albumPosts);
            console.log('useBlogPosts - Posts d\'albums avec permissions directes récupérés:', albumPosts.length);
          } else {
            console.error('useBlogPosts - Erreur lors de la récupération des posts d\'albums:', albumPostsError);
          }
        }

        // 3. Récupérer les posts des autres utilisateurs autorisés via groupes
        if (authorizedUserIds && authorizedUserIds.length > 0) {
          let otherPostsQuery = supabase
            .from('blog_posts')
            .select(`
              *,
              profiles(id, display_name, email, avatar_url, created_at)
            `)
            .eq('published', true) // SEULEMENT les posts publiés des autres
            .in('author_id', authorizedUserIds)
            .order('created_at', { ascending: false });

          // Appliquer les filtres aux autres posts
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
            console.error('useBlogPosts - Erreur lors de la récupération des autres posts:', otherPostsError);
          } else {
            otherPosts.push(...(otherPostsData || []));
            console.log('useBlogPosts - Autres posts autorisés récupérés:', otherPostsData?.length || 0);
          }
        }

        // 4. Combiner ses posts avec les posts autorisés des autres (en évitant les doublons)
        const allPosts = [...(userPosts || [])];
        otherPosts.forEach(post => {
          if (!allPosts.find(existing => existing.id === post.id)) {
            allPosts.push(post);
          }
        });
        
        // Trier par date de création (plus récent en premier)
        allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        console.log('useBlogPosts - ===== RÉSUMÉ FINAL POSTS =====');
        console.log('useBlogPosts - Posts utilisateur:', userPosts?.length || 0);
        console.log('useBlogPosts - Posts via permissions directes albums:', albumPermissions?.length || 0, 'albums autorisés');
        console.log('useBlogPosts - Posts via groupes:', authorizedUserIds?.length || 0, 'utilisateurs autorisés');
        console.log('useBlogPosts - Total posts finaux:', allPosts.length);
        console.log('useBlogPosts - Posts finaux:', allPosts.map(p => ({ id: p.id, title: p.title, author: p.profiles?.display_name, album_id: p.album_id })));
        
        setPosts(allPosts);
      } catch (error) {
        console.error('useBlogPosts - Erreur lors du chargement des articles:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    if (effectiveUserId) {
      fetchPosts();
    }
  }, [searchTerm, selectedAlbum, startDate, endDate, selectedUserId, effectiveUserId, authorizedUserIds, hasRole]);

  return { posts, loading };
};
