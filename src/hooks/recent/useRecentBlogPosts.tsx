
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

    console.log('🔍 ===== RÉCUPÉRATION ARTICLES BLOG RECENT =====');
    console.log('🔍 Utilisateur effectif:', effectiveUserId);
    console.log('🔍 authorizedUserIds:', authorizedUserIds);
    console.log('🔍 hasRole admin:', hasRole('admin'));

    const items: RecentItem[] = [];

    if (hasRole('admin')) {
      console.log('🔍 MODE ADMIN - récupération tous posts publiés');
      const { data: posts } = await supabase
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
          profiles(display_name),
          blog_albums(name)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(15);

      if (posts) {
        console.log('🔍 Posts admin récupérés:', {
          count: posts.length,
          albums: posts.map(p => ({ title: p.title, album: p.blog_albums?.name }))
        });
        
        items.push(...posts.map(post => ({
          id: post.id,
          title: post.title,
          type: 'blog' as const,
          created_at: post.created_at,
          author: post.author_id === effectiveUserId ? 'Moi' : (post.profiles?.display_name || 'Utilisateur'),
          content_preview: post.content?.substring(0, 150) + '...',
          cover_image: post.cover_image,
          album_name: post.blog_albums?.name || undefined
        })));
      }
    } else {
      console.log('🔍 UTILISATEUR NON-ADMIN - récupération posts avec RLS automatique');
      
      let query = supabase
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
          profiles(display_name),
          blog_albums(name)
        `)
        .order('created_at', { ascending: false })
        .limit(15);

      const { data: userBlogPosts, error: userPostsError } = await query;

      console.log('🔍 Posts récupérés avec RLS:', {
        data: userBlogPosts,
        error: userPostsError,
        count: userBlogPosts?.length || 0
      });

      if (userBlogPosts) {
        console.log('🔍 Posts accessibles récupérés:', {
          count: userBlogPosts.length,
          albums: userBlogPosts.map(p => ({ title: p.title, album: p.blog_albums?.name, published: p.published }))
        });
        
        items.push(...userBlogPosts.map(post => ({
          id: post.id,
          title: post.title,
          type: 'blog' as const,
          created_at: post.created_at,
          author: post.author_id === effectiveUserId ? 'Moi' : (post.profiles?.display_name || 'Utilisateur'),
          content_preview: post.content?.substring(0, 150) + '...',
          cover_image: post.cover_image,
          album_name: post.blog_albums?.name || undefined
        })));
      }
    }

    console.log('🔍 Articles blog finaux pour Recent:', {
      count: items.length,
      albums: items.map(i => i.album_name).filter(Boolean)
    });

    setBlogPosts(items);
  }, [effectiveUserId, hasRole]);

  useEffect(() => {
    fetchBlogPosts();
  }, [fetchBlogPosts]);

  return blogPosts;
};
