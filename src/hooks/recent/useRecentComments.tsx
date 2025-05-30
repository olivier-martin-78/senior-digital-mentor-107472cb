
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';

export const useRecentComments = (effectiveUserId: string, authorizedUserIds: string[]) => {
  const { hasRole } = useAuth();
  const [comments, setComments] = useState<RecentItem[]>([]);

  useEffect(() => {
    const fetchComments = async () => {
      console.log('🔍 ===== RÉCUPÉRATION COMMENTAIRES =====');
      console.log('🔍 Utilisateur effectif:', effectiveUserId);
      console.log('🔍 authorizedUserIds pour commentaires:', authorizedUserIds);
      console.log('🔍 hasRole admin:', hasRole('admin'));

      const items: RecentItem[] = [];

      if (hasRole('admin')) {
        console.log('🔍 MODE ADMIN - récupération tous commentaires');
        const { data: commentsData } = await supabase
          .from('blog_comments')
          .select(`
            id,
            content,
            created_at,
            author_id,
            profiles(display_name),
            post:blog_posts(id, title)
          `)
          .order('created_at', { ascending: false })
          .limit(15);

        console.log('🔍 Commentaires admin récupérés:', commentsData?.length || 0);

        if (commentsData) {
          items.push(...commentsData.map(comment => ({
            id: comment.id,
            title: `Commentaire sur "${comment.post?.title || 'Article supprimé'}"`,
            type: 'comment' as const,
            created_at: comment.created_at,
            author: comment.author_id === effectiveUserId ? 'Moi' : (comment.profiles?.display_name || 'Anonyme'),
            content_preview: comment.content?.substring(0, 150) + '...',
            post_title: comment.post?.title,
            comment_content: comment.content
          })));
        }
      } else {
        console.log('🔍 UTILISATEUR NON-ADMIN - récupération commentaires avec permissions d\'albums');
        
        // 1. Récupérer les permissions d'albums pour cet utilisateur
        const { data: albumPermissions } = await supabase
          .from('album_permissions')
          .select(`
            album_id,
            blog_albums!inner(author_id)
          `)
          .eq('user_id', effectiveUserId);

        // 2. Récupérer les commentaires de l'utilisateur effectif
        const { data: userComments } = await supabase
          .from('blog_comments')
          .select(`
            id,
            content,
            created_at,
            author_id,
            profiles(display_name),
            post:blog_posts(id, title)
          `)
          .eq('author_id', effectiveUserId)
          .order('created_at', { ascending: false })
          .limit(10);

        // 3. Récupérer les commentaires sur les posts des albums autorisés
        let albumComments: any[] = [];
        if (albumPermissions && albumPermissions.length > 0) {
          const { data: commentsOnAlbumPosts } = await supabase
            .from('blog_comments')
            .select(`
              id,
              content,
              created_at,
              author_id,
              profiles(display_name),
              post:blog_posts!inner(id, title, album_id)
            `)
            .in('post.album_id', albumPermissions.map(p => p.album_id))
            .order('created_at', { ascending: false })
            .limit(10);
          
          albumComments = commentsOnAlbumPosts || [];
        }

        const allComments = [...(userComments || []), ...albumComments];

        // Éliminer les doublons par ID
        const uniqueComments = allComments.filter((comment, index, self) => 
          index === self.findIndex(c => c.id === comment.id)
        );

        console.log('🔍 Commentaires utilisateur effectif:', userComments?.length || 0);
        console.log('🔍 Commentaires albums autorisés:', albumComments.length);
        console.log('🔍 Total commentaires uniques:', uniqueComments.length);

        if (uniqueComments.length > 0) {
          items.push(...uniqueComments.map(comment => ({
            id: comment.id,
            title: `Commentaire sur "${comment.post?.title || 'Article supprimé'}"`,
            type: 'comment' as const,
            created_at: comment.created_at,
            author: comment.author_id === effectiveUserId ? 'Moi' : (comment.profiles?.display_name || 'Anonyme'),
            content_preview: comment.content?.substring(0, 150) + '...',
            post_title: comment.post?.title,
            comment_content: comment.content
          })));
        }
      }

      setComments(items);
    };

    if (effectiveUserId) {
      fetchComments();
    }
  }, [effectiveUserId, authorizedUserIds, hasRole]);

  return comments;
};
