
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithAuthor } from '@/types/supabase';

export const useBlogPosts = (
  searchTerm: string,
  selectedAlbum: string,
  startDate?: string,
  endDate?: string
) => {
  const { user, getEffectiveUserId } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) {
        console.log('🚫 useBlogPosts - Pas d\'utilisateur connecté');
        setPosts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        console.log('🚀 useBlogPosts - Récupération posts avec logique applicative stricte');

        const effectiveUserId = getEffectiveUserId();

        // 1. Récupérer les groupes de l'utilisateur courant
        const { data: userGroups, error: userGroupsError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', effectiveUserId);

        if (userGroupsError) {
          console.error('❌ useBlogPosts - Erreur récupération groupes utilisateur:', userGroupsError);
          setPosts([]);
          setLoading(false);
          return;
        }

        const userGroupIds = userGroups?.map(g => g.group_id) || [];

        // 2. Récupérer tous les membres des mêmes groupes (utilisateurs autorisés)
        let authorizedUserIds = [effectiveUserId]; // L'utilisateur peut toujours voir ses propres contenus

        if (userGroupIds.length > 0) {
          const { data: groupMembers, error: groupMembersError } = await supabase
            .from('group_members')
            .select('user_id')
            .in('group_id', userGroupIds);

          if (groupMembersError) {
            console.error('❌ useBlogPosts - Erreur récupération membres groupes:', groupMembersError);
          } else {
            const additionalUserIds = groupMembers?.map(gm => gm.user_id).filter(id => id !== effectiveUserId) || [];
            authorizedUserIds = [...authorizedUserIds, ...additionalUserIds];
          }
        }

        console.log('✅ useBlogPosts - Utilisateurs autorisés:', {
          count: authorizedUserIds.length,
          userIds: authorizedUserIds
        });

        // 3. Récupérer les posts avec la logique d'accès côté application
        let query = supabase
          .from('blog_posts')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .in('author_id', authorizedUserIds)
          .order('created_at', { ascending: false });

        // Appliquer les filtres
        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
        }

        if (selectedAlbum && selectedAlbum !== 'none') {
          query = query.eq('album_id', selectedAlbum);
        }

        if (startDate) {
          query = query.gte('created_at', startDate);
        }

        if (endDate) {
          query = query.lte('created_at', endDate);
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ useBlogPosts - Erreur requête:', error);
          throw error;
        }

        const allPosts = data || [];
        
        console.log('✅ useBlogPosts - Posts récupérés avec logique applicative stricte:', {
          count: allPosts.length,
          postsParAuteur: allPosts.reduce((acc, post) => {
            const authorEmail = post.profiles?.email || 'Email non disponible';
            if (!acc[authorEmail]) {
              acc[authorEmail] = 0;
            }
            acc[authorEmail]++;
            return acc;
          }, {} as Record<string, number>)
        });

        setPosts(allPosts);
      } catch (error) {
        console.error('💥 useBlogPosts - Erreur critique:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, searchTerm, selectedAlbum, startDate, endDate, getEffectiveUserId]);

  return { posts, loading };
};
