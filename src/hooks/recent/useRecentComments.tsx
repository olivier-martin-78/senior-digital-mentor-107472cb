
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';
import { useGroupPermissions } from '../useGroupPermissions';

export const useRecentComments = () => {
  const { user, getEffectiveUserId } = useAuth();
  const [comments, setComments] = useState<RecentItem[]>([]);
  const { authorizedUserIds, loading: permissionsLoading } = useGroupPermissions();

  const fetchComments = useCallback(async () => {
    if (!user || permissionsLoading) {
      setComments([]);
      return;
    }

    console.log('🔍 useRecentComments - Récupération avec permissions de groupe centralisées');

    try {
      const currentUserId = getEffectiveUserId();

      if (authorizedUserIds.length === 0) {
        console.log('⚠️ useRecentComments - Aucun utilisateur autorisé');
        setComments([]);
        return;
      }

      console.log('✅ useRecentComments - Utilisateurs autorisés:', authorizedUserIds);

      // Récupérer les commentaires avec logique d'accès côté application
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

      if (error) {
        console.error('❌ useRecentComments - Erreur récupération commentaires:', error);
        setComments([]);
        return;
      }

      console.log('✅ useRecentComments - Commentaires récupérés:', commentsData?.length || 0);

      if (commentsData && commentsData.length > 0) {
        // Filtrer aussi par les posts autorisés
        const filteredComments = commentsData.filter(comment => {
          // Le commentaire doit être de quelqu'un d'autorisé ET le post aussi
          return comment.post && authorizedUserIds.includes(comment.post.author_id);
        });

        console.log('✅ useRecentComments - Commentaires après filtrage posts:', filteredComments.length);

        const items = filteredComments.map(comment => ({
          id: comment.id,
          title: `Commentaire sur "${comment.post?.title || 'Article supprimé'}"`,
          type: 'comment' as const,
          created_at: comment.created_at,
          author: comment.author_id === currentUserId ? 'Moi' : (comment.profiles?.display_name || 'Anonyme'),
          content_preview: comment.content?.substring(0, 150) + '...',
          post_title: comment.post?.title,
          post_id: comment.post?.id,
          comment_content: comment.content,
          album_name: comment.post?.blog_albums?.name
        }));

        console.log('✅ useRecentComments - Items commentaires transformés:', items.length);
        setComments(items);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('💥 useRecentComments - Erreur critique:', error);
      setComments([]);
    }
  }, [user, authorizedUserIds, permissionsLoading, getEffectiveUserId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return comments;
};
