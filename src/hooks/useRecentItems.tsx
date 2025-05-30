import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface RecentItem {
  id: string;
  title: string;
  type: 'blog' | 'wish' | 'diary' | 'comment';
  created_at: string;
  author?: string;
  content_preview?: string;
  cover_image?: string;
  first_name?: string;
  post_title?: string;
  comment_content?: string;
  media_url?: string;
}

export const useRecentItems = () => {
  const { user, hasRole, getEffectiveUserId } = useAuth();
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentItems = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const items: RecentItem[] = [];

        // Utiliser l'utilisateur effectif (impersonné ou réel)
        const effectiveUserId = getEffectiveUserId();
        
        // === LOGS DE DÉBOGAGE DÉTAILLÉS ===
        console.log('🔍 ===== DÉBOGAGE RECENT - DÉBUT =====');
        console.log('🔍 Utilisateur original:', {
          id: user.id,
          email: user.email
        });
        console.log('🔍 Utilisateur effectif (impersonné):', {
          id: effectiveUserId,
          roles: hasRole('admin') ? 'admin' : hasRole('editor') ? 'editor' : 'reader'
        });

        // Récupérer d'abord les utilisateurs autorisés via les groupes d'invitation ET les permissions d'albums
        console.log('🔍 Récupération des utilisateurs autorisés pour user effectif:', effectiveUserId);
        
        let authorizedUserIds = [effectiveUserId];

        if (!hasRole('admin')) {
          console.log('🔍 Utilisateur NON-ADMIN - Vérification des permissions');
          
          // Récupérer les permissions via life_story_permissions, groupes d'invitation ET album_permissions
          const [lifeStoryPermissionsResult, groupPermissionsResult, albumPermissionsResult] = await Promise.all([
            supabase
              .from('life_story_permissions')
              .select('story_owner_id')
              .eq('permitted_user_id', effectiveUserId),
            // Récupérer les créateurs de groupes dont l'utilisateur est membre
            supabase
              .from('group_members')
              .select(`
                group_id,
                invitation_groups!inner(created_by)
              `)
              .eq('user_id', effectiveUserId),
            // Récupérer les permissions d'albums
            supabase
              .from('album_permissions')
              .select(`
                album_id,
                blog_albums!inner(author_id)
              `)
              .eq('user_id', effectiveUserId)
          ]);

          const lifeStoryPermissions = lifeStoryPermissionsResult.data || [];
          const groupPermissions = groupPermissionsResult.data || [];
          const albumPermissions = albumPermissionsResult.data || [];

          console.log('🔍 Life story permissions brutes:', lifeStoryPermissionsResult);
          console.log('🔍 Group permissions brutes:', groupPermissionsResult);
          console.log('🔍 Album permissions brutes:', albumPermissionsResult);

          // Ajouter les utilisateurs autorisés via life_story_permissions
          lifeStoryPermissions.forEach(p => {
            if (p.story_owner_id && !authorizedUserIds.includes(p.story_owner_id)) {
              authorizedUserIds.push(p.story_owner_id);
              console.log('🔍 Ajout utilisateur autorisé via life_story:', p.story_owner_id);
            }
          });
          
          // Ajouter les créateurs de groupes
          groupPermissions.forEach(p => {
            if (p.invitation_groups?.created_by && !authorizedUserIds.includes(p.invitation_groups.created_by)) {
              authorizedUserIds.push(p.invitation_groups.created_by);
              console.log('🔍 Ajout utilisateur autorisé via groupe:', p.invitation_groups.created_by);
            }
          });

          // Ajouter les propriétaires d'albums autorisés
          albumPermissions.forEach(p => {
            if (p.blog_albums?.author_id && !authorizedUserIds.includes(p.blog_albums.author_id)) {
              authorizedUserIds.push(p.blog_albums.author_id);
              console.log('🔍 Ajout utilisateur autorisé via album:', p.blog_albums.author_id);
            }
          });

          console.log('🔍 Utilisateurs autorisés finaux:', authorizedUserIds);
        }

        // Fetch blog posts
        await fetchBlogPosts(items, effectiveUserId, hasRole, authorizedUserIds);

        // Fetch other content types
        await fetchWishes(items, hasRole, effectiveUserId);
        await fetchDiaryEntries(items, hasRole, effectiveUserId, authorizedUserIds);
        await fetchComments(items, hasRole, effectiveUserId, authorizedUserIds);

        // Trier tous les éléments par date de création
        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        console.log('🔍 ===== RÉSUMÉ FINAL =====');
        console.log('🔍 Total éléments récupérés:', items.length);
        console.log('🔍 Répartition par type:', {
          blog: items.filter(i => i.type === 'blog').length,
          wish: items.filter(i => i.type === 'wish').length,
          diary: items.filter(i => i.type === 'diary').length,
          comment: items.filter(i => i.type === 'comment').length
        });
        console.log('🔍 ===== DÉBOGAGE RECENT - FIN =====');

        setRecentItems(items.slice(0, 40)); // Garder les 40 plus récents
      } catch (error) {
        console.error('🔍 ❌ Erreur lors du chargement des éléments récents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentItems();
  }, [user, hasRole, getEffectiveUserId]);

  return { recentItems, loading };
};

// Helper functions for fetching different content types
const fetchBlogPosts = async (items: RecentItem[], effectiveUserId: string, hasRole: any, authorizedUserIds: string[]) => {
  console.log('🔍 ===== RÉCUPÉRATION ARTICLES BLOG =====');
  console.log('🔍 Utilisateur effectif:', effectiveUserId);
  console.log('🔍 authorizedUserIds:', authorizedUserIds);
  console.log('🔍 hasRole admin:', hasRole('admin'));

  if (hasRole('admin')) {
    console.log('🔍 MODE ADMIN - récupération tous posts publiés');
    const { data: blogPosts } = await supabase
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

    if (blogPosts) {
      items.push(...blogPosts.map(post => ({
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
    const hasOnlyOwnId = authorizedUserIds.length === 1 && authorizedUserIds[0] === effectiveUserId;
    console.log('🔍 A seulement son propre ID?', hasOnlyOwnId);
    
    if (hasOnlyOwnId) {
      console.log('🔍 ⚠️ UTILISATEUR SANS PERMISSIONS - récupération posts personnels uniquement');
      
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

      console.log('🔍 Requête posts utilisateur:', {
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
    } else {
      console.log('🔍 UTILISATEUR AVEC PERMISSIONS - récupération séparée');
      
      // 1. Récupérer ses propres posts (TOUS, publiés ET brouillons)
      const { data: userBlogPosts } = await supabase
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
        .limit(10);

      // 2. Récupérer les posts des autres utilisateurs autorisés (SEULEMENT publiés)
      const otherAuthorizedIds = authorizedUserIds.filter(id => id !== effectiveUserId);
      let otherBlogPosts: any[] = [];
      
      if (otherAuthorizedIds.length > 0) {
        const { data: otherPosts } = await supabase
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
          .eq('published', true)
          .in('author_id', otherAuthorizedIds)
          .order('created_at', { ascending: false })
          .limit(10);
        
        otherBlogPosts = otherPosts || [];
      }

      const allBlogPosts = [...(userBlogPosts || []), ...otherBlogPosts];

      if (allBlogPosts.length > 0) {
        items.push(...allBlogPosts.map(post => ({
          id: post.id,
          title: post.title,
          type: 'blog' as const,
          created_at: post.created_at,
          author: post.author_id === effectiveUserId ? 'Moi' : (post.profiles?.display_name || 'Utilisateur'),
          content_preview: post.content?.substring(0, 150) + '...',
          cover_image: post.cover_image
        })));
      }
    }
  }
};

const fetchWishes = async (items: RecentItem[], hasRole: any, effectiveUserId: string) => {
  let wishQuery = supabase
    .from('wish_posts')
    .select(`
      id,
      title,
      content,
      created_at,
      first_name,
      cover_image,
      published,
      author_id,
      profiles(display_name)
    `)
    .order('created_at', { ascending: false })
    .limit(15);

  if (!hasRole('admin')) {
    wishQuery = wishQuery.or(`published.eq.true,author_id.eq.${effectiveUserId}`);
  }

  const { data: wishes } = await wishQuery;

  if (wishes) {
    items.push(...wishes.map(wish => ({
      id: wish.id,
      title: wish.title,
      type: 'wish' as const,
      created_at: wish.created_at,
      author: wish.first_name || wish.profiles?.display_name || 'Anonyme',
      content_preview: wish.content?.substring(0, 150) + '...',
      cover_image: wish.cover_image,
      first_name: wish.first_name
    })));
  }
};

const fetchDiaryEntries = async (items: RecentItem[], hasRole: any, effectiveUserId: string, authorizedUserIds: string[]) => {
  if (hasRole('admin')) {
    const { data: diaryEntries } = await supabase
      .from('diary_entries')
      .select(`
        id, 
        title, 
        created_at, 
        activities, 
        media_url,
        user_id
      `)
      .order('created_at', { ascending: false })
      .limit(15);

    if (diaryEntries) {
      const userIds = [...new Set(diaryEntries.map(entry => entry.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);
      
      const profilesMap = profiles?.reduce((acc, profile) => {
        acc[profile.id] = profile.display_name || 'Utilisateur';
        return acc;
      }, {} as { [key: string]: string }) || {};

      items.push(...diaryEntries.map(entry => ({
        id: entry.id,
        title: entry.title,
        type: 'diary' as const,
        created_at: entry.created_at,
        author: entry.user_id === effectiveUserId ? 'Moi' : (profilesMap[entry.user_id] || 'Utilisateur'),
        content_preview: entry.activities?.substring(0, 150) + '...' || 'Entrée de journal',
        media_url: entry.media_url
      })));
    }
  } else {
    if (authorizedUserIds.length > 0) {
      const { data: diaryEntries } = await supabase
        .from('diary_entries')
        .select(`
          id, 
          title, 
          created_at, 
          activities, 
          media_url,
          user_id
        `)
        .in('user_id', authorizedUserIds)
        .order('created_at', { ascending: false })
        .limit(15);

      if (diaryEntries) {
        const otherUserIds = diaryEntries.filter(entry => entry.user_id !== effectiveUserId).map(entry => entry.user_id);
        let profilesMap: { [key: string]: string } = {};
        
        if (otherUserIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', otherUserIds);
          
          profilesMap = profiles?.reduce((acc, profile) => {
            acc[profile.id] = profile.display_name || 'Utilisateur';
            return acc;
          }, {} as { [key: string]: string }) || {};
        }

        items.push(...diaryEntries.map(entry => ({
          id: entry.id,
          title: entry.title,
          type: 'diary' as const,
          created_at: entry.created_at,
          author: entry.user_id === effectiveUserId ? 'Moi' : (profilesMap[entry.user_id] || 'Utilisateur'),
          content_preview: entry.activities?.substring(0, 150) + '...' || 'Entrée de journal',
          media_url: entry.media_url
        })));
      }
    }
  }
};

const fetchComments = async (items: RecentItem[], hasRole: any, effectiveUserId: string, authorizedUserIds: string[]) => {
  console.log('🔍 ===== RÉCUPÉRATION COMMENTAIRES =====');
  console.log('🔍 Utilisateur effectif:', effectiveUserId);
  console.log('🔍 authorizedUserIds pour commentaires:', authorizedUserIds);
  console.log('🔍 hasRole admin:', hasRole('admin'));

  if (hasRole('admin')) {
    console.log('🔍 MODE ADMIN - récupération tous commentaires');
    const { data: comments } = await supabase
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

    console.log('🔍 Commentaires admin récupérés:', comments?.length || 0);

    if (comments) {
      items.push(...comments.map(comment => ({
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
    const hasOnlyOwnId = authorizedUserIds.length === 1 && authorizedUserIds[0] === effectiveUserId;
    console.log('🔍 A seulement son propre ID pour commentaires?', hasOnlyOwnId);
    
    if (hasOnlyOwnId) {
      console.log('🔍 ⚠️ UTILISATEUR SANS PERMISSIONS - récupération commentaires personnels uniquement');
      
      // Récupérer seulement les commentaires de l'utilisateur
      const { data: userComments, error: userCommentsError } = await supabase
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
        .limit(15);

      console.log('🔍 Requête commentaires utilisateur:', {
        data: userComments,
        error: userCommentsError,
        count: userComments?.length || 0
      });

      if (userComments) {
        items.push(...userComments.map(comment => ({
          id: comment.id,
          title: `Commentaire sur "${comment.post?.title || 'Article supprimé'}"`,
          type: 'comment' as const,
          created_at: comment.created_at,
          author: 'Moi',
          content_preview: comment.content?.substring(0, 150) + '...',
          post_title: comment.post?.title,
          comment_content: comment.content
        })));
      }
    } else {
      console.log('🔍 UTILISATEUR AVEC PERMISSIONS - récupération commentaires séparée');
      
      // 1. Récupérer ses propres commentaires
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

      // 2. Récupérer les commentaires sur les posts des utilisateurs autorisés ET les commentaires des utilisateurs autorisés
      const otherAuthorizedIds = authorizedUserIds.filter(id => id !== effectiveUserId);
      let otherComments: any[] = [];
      
      if (otherAuthorizedIds.length > 0) {
        // Récupérer les commentaires sur les posts des utilisateurs autorisés
        const { data: commentsOnAuthorizedPosts } = await supabase
          .from('blog_comments')
          .select(`
            id,
            content,
            created_at,
            author_id,
            profiles(display_name),
            post:blog_posts!inner(id, title, author_id)
          `)
          .in('post.author_id', otherAuthorizedIds)
          .order('created_at', { ascending: false })
          .limit(8);
        
        // Récupérer les commentaires des utilisateurs autorisés (peu importe sur quels posts)
        const { data: commentsFromAuthorizedUsers } = await supabase
          .from('blog_comments')
          .select(`
            id,
            content,
            created_at,
            author_id,
            profiles(display_name),
            post:blog_posts(id, title, author_id)
          `)
          .in('author_id', otherAuthorizedIds)
          .order('created_at', { ascending: false })
          .limit(7);
        
        otherComments = [
          ...(commentsOnAuthorizedPosts || []),
          ...(commentsFromAuthorizedUsers || [])
        ];
        
        // Éliminer les doublons par ID
        const uniqueComments = otherComments.filter((comment, index, self) => 
          index === self.findIndex(c => c.id === comment.id)
        );
        otherComments = uniqueComments;
      }

      const allComments = [...(userComments || []), ...otherComments];

      console.log('🔍 Commentaires utilisateur:', userComments?.length || 0);
      console.log('🔍 Commentaires autres autorisés:', otherComments.length);
      console.log('🔍 Total commentaires:', allComments.length);

      if (allComments.length > 0) {
        items.push(...allComments.map(comment => ({
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
  }
};
