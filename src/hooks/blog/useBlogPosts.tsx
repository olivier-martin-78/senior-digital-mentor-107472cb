
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

        // 3. Récupérer les posts des autres utilisateurs autorisés
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
            otherPosts = otherPostsData || [];
            console.log('useBlogPosts - Autres posts autorisés récupérés:', otherPosts.length);
          }
        }

        // Combiner ses posts avec les posts autorisés des autres
        const allPosts = [...(userPosts || []), ...otherPosts];
        
        // Trier par date de création (plus récent en premier)
        allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        console.log('useBlogPosts - Total posts finaux:', allPosts.length);
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
