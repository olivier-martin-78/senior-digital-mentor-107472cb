
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';

export const useRecentBlogPosts = (effectiveUserId: string, authorizedUserIds: string[]) => {
  const { getEffectiveUserId } = useAuth();
  const [blogPosts, setBlogPosts] = useState<RecentItem[]>([]);

  const fetchBlogPosts = useCallback(async () => {
    if (!effectiveUserId) {
      setBlogPosts([]);
      return;
    }

    console.log('🔍 useRecentBlogPosts - Récupération avec logique applicative stricte:', effectiveUserId);

    try {
      const currentUserId = getEffectiveUserId();

      // 1. Récupérer les groupes de l'utilisateur courant
      const { data: userGroups, error: userGroupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', currentUserId);

      if (userGroupsError) {
        console.error('❌ useRecentBlogPosts - Erreur récupération groupes utilisateur:', userGroupsError);
        setBlogPosts([]);
        return;
      }

      const userGroupIds = userGroups?.map(g => g.group_id) || [];

      // CORRECTION: Si l'utilisateur n'est dans aucun groupe, il ne voit que ses propres posts
      let actualAuthorizedUserIds = [currentUserId]; // L'utilisateur peut toujours voir ses propres contenus

      if (userGroupIds.length > 0) {
        console.log('🔍 useRecentBlogPosts - Utilisateur dans des groupes:', userGroupIds);
        
        // 2. Récupérer tous les membres des mêmes groupes (utilisateurs autorisés)
        const { data: groupMembers, error: groupMembersError } = await supabase
          .from('group_members')
          .select('user_id')
          .in('group_id', userGroupIds);

        if (groupMembersError) {
          console.error('❌ useRecentBlogPosts - Erreur récupération membres groupes:', groupMembersError);
        } else {
          const additionalUserIds = groupMembers?.map(gm => gm.user_id).filter(id => id !== currentUserId) || [];
          actualAuthorizedUserIds = [...actualAuthorizedUserIds, ...additionalUserIds];
        }
      } else {
        console.log('🔍 useRecentBlogPosts - Utilisateur dans AUCUN groupe - accès limité à ses propres contenus');
      }

      console.log('✅ useRecentBlogPosts - Utilisateurs autorisés:', {
        count: actualAuthorizedUserIds.length,
        userIds: actualAuthorizedUserIds
      });

      // 3. Récupérer les posts avec logique d'accès côté application
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
        .in('author_id', actualAuthorizedUserIds)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('❌ useRecentBlogPosts - Erreur récupération posts:', error);
        setBlogPosts([]);
        return;
      }

      console.log('✅ useRecentBlogPosts - Posts récupérés côté application:', {
        count: posts?.length || 0,
        postsParAuteur: posts?.reduce((acc, post) => {
          const authorEmail = post.profiles?.email || 'Email non disponible';
          if (!acc[authorEmail]) {
            acc[authorEmail] = 0;
          }
          acc[authorEmail]++;
          return acc;
        }, {} as Record<string, number>)
      });

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
            author: post.author_id === currentUserId ? 'Moi' : (post.profiles?.display_name || post.profiles?.email || 'Utilisateur'),
            content_preview: post.content?.substring(0, 150) + '...',
            cover_image: post.cover_image,
            album_name: album?.name || undefined
          };
        });

        console.log('✅ useRecentBlogPosts - Items blog transformés:', items.length);
        setBlogPosts(items);
      }
    } catch (error) {
      console.error('💥 useRecentBlogPosts - Erreur critique:', error);
      setBlogPosts([]);
    }
  }, [effectiveUserId, getEffectiveUserId]);

  useEffect(() => {
    fetchBlogPosts();
  }, [fetchBlogPosts]);

  return blogPosts;
};
