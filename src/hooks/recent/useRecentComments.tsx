
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
            comment_content: comment.content,
            album_name: comment.post?.blog_albums?.name
          })));
        }
      } else {
        console.log('🔍 UTILISATEUR NON-ADMIN - récupération commentaires avec permissions d\'albums');
        console.log('🔍 Liste des utilisateurs autorisés:', authorizedUserIds);
        
        // 1. Récupérer les permissions d'albums pour cet utilisateur
        console.log('🔍 Étape 1: Récupération des permissions d\'albums pour:', effectiveUserId);
        const { data: albumPermissions, error: albumPermError } = await supabase
          .from('album_permissions')
          .select(`
            album_id,
            blog_albums!inner(author_id, name)
          `)
          .eq('user_id', effectiveUserId);

        console.log('🔍 Permissions d\'albums trouvées:', albumPermissions?.length || 0);
        console.log('🔍 Détail permissions albums:', albumPermissions);
        console.log('🔍 Erreur permissions albums:', albumPermError);

        // 2. Récupérer les commentaires de l'utilisateur effectif
        console.log('🔍 Étape 2: Récupération des commentaires de l\'utilisateur effectif');
        const { data: userComments, error: userCommentsError } = await supabase
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
          .eq('author_id', effectiveUserId)
          .order('created_at', { ascending: false })
          .limit(10);

        console.log('🔍 Commentaires utilisateur effectif:', userComments?.length || 0);
        console.log('🔍 Détail commentaires utilisateur:', userComments);
        console.log('🔍 Erreur commentaires utilisateur:', userCommentsError);

        // 3. Récupérer les commentaires sur les posts des albums autorisés
        let albumComments: any[] = [];
        if (albumPermissions && albumPermissions.length > 0) {
          const albumIds = albumPermissions.map(p => p.album_id);
          console.log('🔍 Étape 3: Récupération des commentaires pour les albums autorisés:', albumIds);
          
          const { data: commentsOnAlbumPosts, error: albumCommentsError } = await supabase
            .from('blog_comments')
            .select(`
              id,
              content,
              created_at,
              author_id,
              profiles(display_name),
              post:blog_posts!inner(
                id, 
                title, 
                album_id,
                blog_albums(name)
              )
            `)
            .in('post.album_id', albumIds)
            .order('created_at', { ascending: false })
            .limit(20);
          
          console.log('🔍 Commentaires sur albums autorisés:', commentsOnAlbumPosts?.length || 0);
          console.log('🔍 Détail commentaires albums:', commentsOnAlbumPosts);
          console.log('🔍 Erreur commentaires albums:', albumCommentsError);
          
          albumComments = commentsOnAlbumPosts || [];
        } else {
          console.log('🔍 Aucune permission d\'album trouvée, pas de commentaires d\'albums à récupérer');
        }

        // 4. Récupérer également les commentaires des autres utilisateurs autorisés (via life_story_permissions, groupes, etc.)
        console.log('🔍 Étape 4: Récupération des commentaires des utilisateurs autorisés via autres permissions');
        let otherAuthorizedComments: any[] = [];
        const otherAuthorizedUserIds = authorizedUserIds.filter(id => id !== effectiveUserId);
        
        if (otherAuthorizedUserIds.length > 0) {
          console.log('🔍 Autres utilisateurs autorisés:', otherAuthorizedUserIds);
          
          const { data: otherComments, error: otherCommentsError } = await supabase
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
            .in('author_id', otherAuthorizedUserIds)
            .order('created_at', { ascending: false })
            .limit(10);

          console.log('🔍 Commentaires des autres utilisateurs autorisés:', otherComments?.length || 0);
          console.log('🔍 Détail commentaires autres utilisateurs:', otherComments);
          console.log('🔍 Erreur commentaires autres utilisateurs:', otherCommentsError);
          
          otherAuthorizedComments = otherComments || [];
        }

        // Combiner tous les commentaires
        const allComments = [...(userComments || []), ...albumComments, ...otherAuthorizedComments];

        // Éliminer les doublons par ID
        const uniqueComments = allComments.filter((comment, index, self) => 
          index === self.findIndex(c => c.id === comment.id)
        );

        console.log('🔍 ===== RÉSUMÉ COMMENTAIRES =====');
        console.log('🔍 Commentaires utilisateur effectif:', userComments?.length || 0);
        console.log('🔍 Commentaires albums autorisés:', albumComments.length);
        console.log('🔍 Commentaires autres utilisateurs autorisés:', otherAuthorizedComments.length);
        console.log('🔍 Total commentaires avant déduplication:', allComments.length);
        console.log('🔍 Total commentaires uniques:', uniqueComments.length);
        console.log('🔍 Liste finale des commentaires:', uniqueComments.map(c => ({
          id: c.id,
          author_id: c.author_id,
          post_title: c.post?.title,
          album_name: c.post?.blog_albums?.name,
          content_preview: c.content?.substring(0, 50) + '...'
        })));

        if (uniqueComments.length > 0) {
          items.push(...uniqueComments.map(comment => ({
            id: comment.id,
            title: `Commentaire sur "${comment.post?.title || 'Article supprimé'}"`,
            type: 'comment' as const,
            created_at: comment.created_at,
            author: comment.author_id === effectiveUserId ? 'Moi' : (comment.profiles?.display_name || 'Anonyme'),
            content_preview: comment.content?.substring(0, 150) + '...',
            post_title: comment.post?.title,
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
