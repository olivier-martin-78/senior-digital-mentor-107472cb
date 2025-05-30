
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';

export const useRecentBlogPosts = (effectiveUserId: string, authorizedUserIds: string[]) => {
  const { hasRole } = useAuth();
  const [blogPosts, setBlogPosts] = useState<RecentItem[]>([]);

  useEffect(() => {
    const fetchBlogPosts = async () => {
      console.log('🔍 ===== RÉCUPÉRATION ARTICLES BLOG =====');
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
            profiles(display_name)
          `)
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(15);

        if (posts) {
          items.push(...posts.map(post => ({
            id: post.id,
            title: post.title,
            type: 'blog' as const,
            created_at: post.created_at,
            author: post.author_id === effectiveUserId ? 'Moi' : (post.profiles?.display_name || 'Utilisateur'),
            content_preview: post.content?.substring(0, 150) + '...',
            cover_image: post.cover_image
          })));
        }
      } else {
        // Récupérer SEULEMENT les posts de l'utilisateur effectif (impersonné)
        console.log('🔍 UTILISATEUR NON-ADMIN - récupération posts de l\'utilisateur effectif uniquement');
        
        const { data: userBlogPosts, error: userPostsError } = await supabase
          .from('blog_posts')
          .select(`
            id,
            title,
            content,
            created_at,
            cover_image,
            author_id,
            published,
            profiles(display_name)
          `)
          .eq('author_id', effectiveUserId)
          .order('created_at', { ascending: false })
          .limit(15);

        console.log('🔍 Requête posts utilisateur effectif:', {
          data: userBlogPosts,
          error: userPostsError,
          count: userBlogPosts?.length || 0
        });

        if (userBlogPosts) {
          items.push(...userBlogPosts.map(post => ({
            id: post.id,
            title: post.title,
            type: 'blog' as const,
            created_at: post.created_at,
            author: 'Moi',
            content_preview: post.content?.substring(0, 150) + '...',
            cover_image: post.cover_image
          })));
        }
      }

      setBlogPosts(items);
    };

    if (effectiveUserId) {
      fetchBlogPosts();
    }
  }, [effectiveUserId, authorizedUserIds, hasRole]);

  return blogPosts;
};
