
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
      // Récupérer d'abord les groupes de l'utilisateur
      const { data: userGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', effectiveUserId);

      const groupIds = userGroups?.map(g => g.group_id) || [];
      
      // Récupérer les membres des mêmes groupes
      let authorizedUsers = [effectiveUserId];
      if (groupIds.length > 0) {
        const { data: groupMembers } = await supabase
          .from('group_members')
          .select('user_id')
          .in('group_id', groupIds);
        
        const additionalUsers = groupMembers?.map(gm => gm.user_id).filter(id => id !== effectiveUserId) || [];
        authorizedUsers = [...authorizedUsers, ...additionalUsers];
      }

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
        .in('author_id', authorizedUsers)
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

  useEffect(() => {
    fetchBlogPosts();
  }, [fetchBlogPosts]);

  return blogPosts;
};
