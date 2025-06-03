
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
        
        console.log('🔍 useBlogPosts - Récupération avec logique applicative stricte');

        const effectiveUserId = getEffectiveUserId();
        console.log('👤 useBlogPosts - Utilisateur courant:', effectiveUserId);

        // 1. Récupérer UNIQUEMENT les groupes où l'utilisateur est membre
        const { data: userGroups, error: userGroupsError } = await supabase
          .from('group_members')
          .select('group_id, role')
          .eq('user_id', effectiveUserId);

        if (userGroupsError) {
          console.error('❌ useBlogPosts - Erreur récupération groupes utilisateur:', userGroupsError);
          setPosts([]);
          setLoading(false);
          return;
        }

        const userGroupIds = userGroups?.map(g => g.group_id) || [];
        console.log('👥 useBlogPosts - Groupes de l\'utilisateur:', {
          count: userGroupIds.length,
          groups: userGroups
        });

        // 2. Si l'utilisateur n'a pas de groupes, il ne voit QUE ses propres contenus
        let authorizedUserIds = [effectiveUserId];

        if (userGroupIds.length > 0) {
          const { data: groupMembers, error: groupMembersError } = await supabase
            .from('group_members')
            .select('user_id, group_id, role')
            .in('group_id', userGroupIds);

          if (groupMembersError) {
            console.error('❌ useBlogPosts - Erreur récupération membres groupes:', groupMembersError);
          } else {
            console.log('👥 useBlogPosts - Tous les membres des groupes:', groupMembers);
            
            const additionalUserIds = groupMembers?.map(gm => gm.user_id).filter(id => id !== effectiveUserId) || [];
            authorizedUserIds = [...authorizedUserIds, ...additionalUserIds];
            
            // Supprimer les doublons
            authorizedUserIds = [...new Set(authorizedUserIds)];
          }
        }

        console.log('✅ useBlogPosts - Utilisateurs autorisés FINAL:', {
          count: authorizedUserIds.length,
          userIds: authorizedUserIds,
          currentUser: effectiveUserId
        });

        // 3. Récupérer les posts UNIQUEMENT des utilisateurs autorisés
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
        
        console.log('📝 useBlogPosts - Posts récupérés:', {
          count: allPosts.length,
          posts: allPosts.map(p => ({
            id: p.id,
            title: p.title,
            author_id: p.author_id,
            author_email: p.profiles?.email,
            author_display: p.profiles?.display_name
          }))
        });

        // Vérifier que tous les posts appartiennent bien aux utilisateurs autorisés
        const unauthorizedPosts = allPosts.filter(post => !authorizedUserIds.includes(post.author_id));
        if (unauthorizedPosts.length > 0) {
          console.error('🚨 useBlogPosts - PROBLÈME: Posts non autorisés détectés:', unauthorizedPosts);
        }

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
