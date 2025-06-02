
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';

export const useRecentComments = (effectiveUserId: string, authorizedUserIds: string[]) => {
  const { hasRole } = useAuth();
  const [comments, setComments] = useState<RecentItem[]>([]);

  useEffect(() => {
    const fetchComments = async () => {
      console.log('🔍 ===== RÉCUPÉRATION COMMENTAIRES - DEBUG DÉTAILLÉ =====');
      console.log('🔍 Utilisateur effectif:', effectiveUserId);
      console.log('🔍 authorizedUserIds pour commentaires:', authorizedUserIds);
      console.log('🔍 hasRole admin:', hasRole('admin'));

      const items: RecentItem[] = [];

      if (hasRole('admin')) {
        console.log('🔍 MODE ADMIN - récupération tous commentaires');
        const { data: commentsData, error } = await supabase
          .from('blog_comments')
          .select(`
            id,
            content,
            created_at,
            author_id,
            profiles(display_name),
            post:blog_posts(
              id, 
              title,
              blog_albums(name)
            )
          `)
          .order('created_at', { ascending: false })
          .limit(15);

        console.log('🔍 Commentaires admin récupérés:', commentsData?.length || 0);
        console.log('🔍 Erreur admin commentaires:', error);

        if (commentsData) {
          items.push(...commentsData.map(comment => ({
            id: comment.id,
            title: `Commentaire sur "${comment.post?.title || 'Article supprimé'}"`,
            type: 'comment' as const,
            created_at: comment.created_at,
            author: comment.author_id === effectiveUserId ? 'Moi' : (comment.profiles?.display_name || 'Anonyme'),
            content_preview: comment.content?.substring(0, 150) + '...',
            post_title: comment.post?.title,
            post_id: comment.post?.id,
            comment_content: comment.content,
            album_name: comment.post?.blog_albums?.name
          })));
        }
      } else {
        console.log('🔍 UTILISATEUR NON-ADMIN - récupération commentaires avec RLS automatique');
        
        // Avec le nouveau système RLS, une simple requête suffit
        // Les politiques RLS gèrent automatiquement les permissions
        const { data: commentsData, error } = await supabase
          .from('blog_comments')
          .select(`
            id,
            content,
            created_at,
            author_id,
            profiles(display_name),
            post:blog_posts(
              id, 
              title,
              album_id,
              blog_albums(name)
            )
          `)
          .order('created_at', { ascending: false })
          .limit(15);

        console.log('🔍 Commentaires RLS récupérés:', commentsData?.length || 0);
        console.log('🔍 Détail commentaires RLS:', commentsData);
        console.log('🔍 Erreur commentaires RLS:', error);

        if (commentsData) {
          items.push(...commentsData.map(comment => ({
            id: comment.id,
            title: `Commentaire sur "${comment.post?.title || 'Article supprimé'}"`,
            type: 'comment' as const,
            created_at: comment.created_at,
            author: comment.author_id === effectiveUserId ? 'Moi' : (comment.profiles?.display_name || 'Anonyme'),
            content_preview: comment.content?.substring(0, 150) + '...',
            post_title: comment.post?.title,
            post_id: comment.post?.id,
            comment_content: comment.content,
            album_name: comment.post?.blog_albums?.name
          })));
        }
      }

      console.log('🔍 ===== FIN RÉCUPÉRATION COMMENTAIRES =====');
      console.log('🔍 Total items commentaires à afficher:', items.length);
      setComments(items);
    };

    if (effectiveUserId) {
      fetchComments();
    }
  }, [effectiveUserId, authorizedUserIds, hasRole]);

  return comments;
};
