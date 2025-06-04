
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';

export const useRecentComments = (effectiveUserId: string, authorizedUserIds: string[]) => {
  const { getEffectiveUserId } = useAuth();
  const [comments, setComments] = useState<RecentItem[]>([]);

  const fetchComments = useCallback(async () => {
    if (!effectiveUserId) {
      setComments([]);
      return;
    }

    console.log('🔍 useRecentComments - Récupération avec logique applicative stricte:', effectiveUserId);

    try {
      const currentUserId = getEffectiveUserId();

      // 1. Récupérer les groupes de l'utilisateur courant (même pour les admins)
      const { data: userGroups, error: userGroupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', currentUserId);

      if (userGroupsError) {
        console.error('❌ useRecentComments - Erreur récupération groupes utilisateur:', userGroupsError);
        setComments([]);
        return;
      }

      const userGroupIds = userGroups?.map(g => g.group_id) || [];

      // CORRECTION: Même logique pour tous les utilisateurs (y compris admins)
      let actualAuthorizedUserIds = [currentUserId]; // L'utilisateur peut toujours voir ses propres contenus

      if (userGroupIds.length > 0) {
        console.log('🔍 useRecentComments - Utilisateur dans des groupes:', userGroupIds);
        
        // 2. Récupérer tous les membres des mêmes groupes (utilisateurs autorisés)
        const { data: groupMembers, error: groupMembersError } = await supabase
          .from('group_members')
          .select('user_id')
          .in('group_id', userGroupIds);

        if (groupMembersError) {
          console.error('❌ useRecentComments - Erreur récupération membres groupes:', groupMembersError);
        } else {
          const additionalUserIds = groupMembers?.map(gm => gm.user_id).filter(id => id !== currentUserId) || [];
          actualAuthorizedUserIds = [...actualAuthorizedUserIds, ...additionalUserIds];
        }
      } else {
        console.log('🔍 useRecentComments - Utilisateur dans AUCUN groupe - accès limité à ses propres contenus');
      }

      console.log('✅ useRecentComments - Utilisateurs autorisés:', {
        count: actualAuthorizedUserIds.length,
        userIds: actualAuthorizedUserIds
      });

      // 3. Récupérer les commentaires avec logique d'accès côté application
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
        .in('author_id', actualAuthorizedUserIds)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('❌ useRecentComments - Erreur récupération commentaires:', error);
        setComments([]);
        return;
      }

      console.log('✅ useRecentComments - Commentaires récupérés côté application:', {
        count: commentsData?.length || 0,
        commentairesParAuteur: commentsData?.reduce((acc, comment) => {
          const authorId = comment.author_id;
          if (!acc[authorId]) {
            acc[authorId] = 0;
          }
          acc[authorId]++;
          return acc;
        }, {} as Record<string, number>)
      });

      if (commentsData) {
        // CORRECTION: Filtrer aussi par les posts autorisés
        const filteredComments = commentsData.filter(comment => {
          // Le commentaire doit être de quelqu'un d'autorisé ET le post aussi
          return comment.post && actualAuthorizedUserIds.includes(comment.post.author_id);
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
      }
    } catch (error) {
      console.error('💥 useRecentComments - Erreur critique:', error);
      setComments([]);
    }
  }, [effectiveUserId, getEffectiveUserId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return comments;
};
