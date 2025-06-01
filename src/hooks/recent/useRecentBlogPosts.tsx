
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';

export const useRecentBlogPosts = (effectiveUserId: string, authorizedUserIds: string[]) => {
  const { hasRole } = useAuth();
  const [blogPosts, setBlogPosts] = useState<RecentItem[]>([]);

  useEffect(() => {
    const fetchBlogPosts = async () => {
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
        console.log('🔍 UTILISATEUR NON-ADMIN - récupération posts des albums accessibles');
        
        // Récupérer d'abord les albums accessibles (même logique que useBlogPosts)
        const accessibleAlbumIds: string[] = [];
        
        // 1. Albums créés par l'utilisateur
        const { data: ownedAlbums } = await supabase
          .from('blog_albums')
          .select('id')
          .eq('author_id', effectiveUserId);
        
        if (ownedAlbums) {
          accessibleAlbumIds.push(...ownedAlbums.map(album => album.id));
          console.log('📋 Recent - Albums créés par l\'utilisateur:', ownedAlbums.length);
        }
        
        // 2. Albums avec permissions
        const { data: permittedAlbums } = await supabase
          .from('album_permissions')
          .select('album_id')
          .eq('user_id', effectiveUserId);
        
        if (permittedAlbums) {
          const permittedAlbumIds = permittedAlbums.map(p => p.album_id);
          accessibleAlbumIds.push(...permittedAlbumIds);
          console.log('🔑 Recent - Albums avec permissions:', permittedAlbumIds.length);
        }
        
        // Supprimer les doublons
        const uniqueAccessibleAlbumIds = [...new Set(accessibleAlbumIds)];
        console.log('🎯 Recent - Albums accessibles uniques:', {
          count: uniqueAccessibleAlbumIds.length,
          albumIds: uniqueAccessibleAlbumIds
        });

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

        if (uniqueAccessibleAlbumIds.length > 0) {
          // Récupérer tous les posts des albums accessibles (publiés) + posts de l'utilisateur (publiés ou non)
          query = query.or(`and(album_id.in.(${uniqueAccessibleAlbumIds.join(',')}),published.eq.true),author_id.eq.${effectiveUserId}`);
        } else {
          // Aucun album accessible, récupérer seulement les posts de l'utilisateur
          query = query.eq('author_id', effectiveUserId);
        }

        const { data: userBlogPosts, error: userPostsError } = await query;

        console.log('🔍 Requête posts albums accessibles:', {
          data: userBlogPosts,
          error: userPostsError,
          count: userBlogPosts?.length || 0
        });

        if (userBlogPosts) {
          console.log('🔍 Posts albums accessibles récupérés:', {
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

        // Vérification spécifique pour les albums "Tiago" et "Nana"
        const tiaoPost = items.find(item => item.album_name?.toLowerCase().includes('tiago'));
        const nanaPost = items.find(item => item.album_name?.toLowerCase().includes('nana'));
        
        console.log('🎯 Recent Blog - Vérification albums spécifiques dans les posts:', {
          tiaoPostFound: !!tiaoPost,
          tiaoPost: tiaoPost ? { title: tiaoPost.title, album: tiaoPost.album_name } : null,
          nanaPostFound: !!nanaPost,
          nanaPost: nanaPost ? { title: nanaPost.title, album: nanaPost.album_name } : null,
          effectiveUserId
        });
      }

      console.log('🔍 Articles blog finaux pour Recent:', {
        count: items.length,
        albums: items.map(i => i.album_name).filter(Boolean)
      });

      setBlogPosts(items);
    };

    if (effectiveUserId) {
      fetchBlogPosts();
    }
  }, [effectiveUserId, authorizedUserIds, hasRole]);

  return blogPosts;
};
