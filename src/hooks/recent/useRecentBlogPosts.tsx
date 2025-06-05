
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';
import { useGroupPermissions } from '../useGroupPermissions';

export const useRecentBlogPosts = () => {
  const { user, getEffectiveUserId } = useAuth();
  const [blogPosts, setBlogPosts] = useState<RecentItem[]>([]);
  const { authorizedUserIds, loading: permissionsLoading } = useGroupPermissions();

  const fetchBlogPosts = useCallback(async () => {
    if (!user || permissionsLoading) {
      setBlogPosts([]);
      return;
    }

    console.log('🔍 useRecentBlogPosts - Récupération avec permissions de groupe centralisées');

    try {
      const currentUserId = getEffectiveUserId();

      if (authorizedUserIds.length === 0) {
        console.log('⚠️ useRecentBlogPosts - Aucun utilisateur autorisé');
        setBlogPosts([]);
        return;
      }

      console.log('✅ useRecentBlogPosts - Utilisateurs autorisés:', authorizedUserIds);

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
        .in('author_id', authorizedUserIds)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('❌ useRecentBlogPosts - Erreur récupération posts:', error);
        setBlogPosts([]);
        return;
      }

      console.log('✅ useRecentBlogPosts - Posts récupérés:', posts?.length || 0);

      if (posts && posts.length > 0) {
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
            author: post.author_id === currentUserId ? 'Moi' : (post.profiles?.display_name || post.profiles?.email || 'Utilisateur'),
            content_preview: post.content?.substring(0, 150) + '...',
            cover_image: post.cover_image,
            album_name: album?.name || undefined
          };
        });

        console.log('✅ useRecentBlogPosts - Items blog transformés:', items.length);
        setBlogPosts(items);
      } else {
        setBlogPosts([]);
      }
    } catch (error) {
      console.error('💥 useRecentBlogPosts - Erreur critique:', error);
      setBlogPosts([]);
    }
  }, [user, authorizedUserIds, permissionsLoading, getEffectiveUserId]);

  useEffect(() => {
    fetchBlogPosts();
  }, [fetchBlogPosts]);

  return blogPosts;
};
