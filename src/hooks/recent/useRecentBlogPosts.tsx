
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';

export const useRecentBlogPosts = (effectiveUserId: string, authorizedUserIds: string[]) => {
  const { hasRole } = useAuth();
  const [blogPosts, setBlogPosts] = useState<RecentItem[]>([]);

  const fetchBlogPosts = useCallback(async () => {
    if (!effectiveUserId) {
      setBlogPosts([]);
      return;
    }

    console.log('🔍 Récupération blog posts avec logique applicative:', effectiveUserId);

    try {
      // Récupérer les posts avec logique d'accès côté application
      const { data: posts, error } = await supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          content,
          created_at,
          cover_image,
          author_id,
          album_id,
          published,
          profiles!blog_posts_author_id_fkey(id, email, display_name)
        `)
        .or(`author_id.eq.${effectiveUserId},author_id.in.(${await getAuthorizedUserIds(effectiveUserId)})`)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('❌ Erreur récupération posts:', error);
        setBlogPosts([]);
        return;
      }

      console.log('✅ Posts récupérés côté application:', posts?.length || 0);

      if (posts) {
        // Récupérer les informations des albums si nécessaire
        const albumIds = posts.filter(p => p.album_id).map(p => p.album_id);
        let albumsMap = {};
        if (albumIds.length > 0) {
          const { data: albums } = await supabase
            .from('blog_albums')
            .select('id, name')
            .in('id', albumIds);
          
          albumsMap = albums?.reduce((acc, album) => {
            acc[album.id] = album;
            return acc;
          }, {} as { [key: string]: any }) || {};
        }

        const items = posts.map(post => {
          const album = albumsMap[post.album_id];
          return {
            id: post.id,
            title: post.title,
            type: 'blog' as const,
            created_at: post.created_at,
            author: post.author_id === effectiveUserId ? 'Moi' : (post.profiles?.display_name || post.profiles?.email || 'Utilisateur'),
            content_preview: post.content?.substring(0, 150) + '...',
            cover_image: post.cover_image,
            album_name: album?.name || undefined
          };
        });

        console.log('✅ Items blog transformés:', items.length);
        setBlogPosts(items);
      }
    } catch (error) {
      console.error('💥 Erreur critique useRecentBlogPosts:', error);
      setBlogPosts([]);
    }
  }, [effectiveUserId]);

  // Fonction pour récupérer les IDs des utilisateurs autorisés via les groupes
  const getAuthorizedUserIds = async (userId: string): Promise<string> => {
    try {
      const { data: groupMembers } = await supabase
        .from('group_members')
        .select(`
          user_id,
          group_members_same_group:group_members!inner(user_id)
        `)
        .eq('group_members.user_id', userId);

      const userIds = groupMembers?.flatMap(gm => 
        gm.group_members_same_group?.map(sgm => sgm.user_id) || []
      ).filter(id => id !== userId) || [];

      return userIds.join(',') || 'null';
    } catch (error) {
      console.error('Erreur récupération groupe membres:', error);
      return 'null';
    }
  };

  useEffect(() => {
    fetchBlogPosts();
  }, [fetchBlogPosts]);

  return blogPosts;
};
