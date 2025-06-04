
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';

export const useRecentComments = (effectiveUserId: string, authorizedUserIds: string[]) => {
  const { hasRole } = useAuth();
  const [comments, setComments] = useState<RecentItem[]>([]);

  const fetchComments = useCallback(async () => {
    if (!effectiveUserId) {
      setComments([]);
      return;
    }

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
      console.log('🔍 UTILISATEUR NON-ADMIN - récupération commentaires avec filtrage strict');
      
      // CORRECTION: Ne récupérer QUE les commentaires des utilisateurs autorisés
      // Si authorizedUserIds est vide ou ne contient que l'utilisateur courant, 
      // cela signifie qu'il n'a accès qu'à ses propres contenus
      if (authorizedUserIds.length === 0) {
        console.log('🔍 Aucun utilisateur autorisé - pas de commentaires à afficher');
        setComments([]);
        return;
      }

      console.log('🔍 Filtrage par utilisateurs autorisés:', authorizedUserIds);
      
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
            author_id,
            blog_albums(name)
          )
        `)
        .in('author_id', authorizedUserIds)
        .order('created_at', { ascending: false })
        .limit(15);

      console.log('🔍 Commentaires RLS récupérés:', commentsData?.length || 0);
      console.log('🔍 Détail commentaires RLS:', commentsData);
      console.log('🔍 Erreur commentaires RLS:', error);

      if (commentsData) {
        // CORRECTION: Filtrer aussi par les posts autorisés
        const filteredComments = commentsData.filter(comment => {
          // Le commentaire doit être de quelqu'un d'autorisé ET le post aussi
          return comment.post && authorizedUserIds.includes(comment.post.author_id);
        });

        console.log('🔍 Commentaires après filtrage posts:', filteredComments.length);

        items.push(...filteredComments.map(comment => ({
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
  }, [effectiveUserId, hasRole, authorizedUserIds]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return comments;
};
