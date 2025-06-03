
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

    console.log('🔍 ===== RÉCUPÉRATION ARTICLES BLOG RECENT (NOUVELLE LOGIQUE) =====');
    console.log('🔍 Utilisateur effectif:', effectiveUserId);

    try {
      // Avec la nouvelle logique simplifiée, une seule requête suffit
      // Les politiques RLS gèrent automatiquement l'accès basé sur l'appartenance aux groupes
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
          profiles(display_name),
          blog_albums(name)
        `)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('❌ Erreur récupération posts:', error);
        setBlogPosts([]);
        return;
      }

      const items = (posts || []).map(post => ({
        id: post.id,
        title: post.title,
        type: 'blog' as const,
        created_at: post.created_at,
        author: post.author_id === effectiveUserId ? 'Moi' : (post.profiles?.display_name || 'Utilisateur'),
        content_preview: post.content?.substring(0, 150) + '...',
        cover_image: post.cover_image,
        album_name: post.blog_albums?.name || undefined
      }));

      console.log('✅ Posts récupérés avec nouvelle logique simplifiée:', {
        count: items.length,
        albums: items.map(i => i.album_name).filter(Boolean)
      });

      setBlogPosts(items);
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
