
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  album_id: string | null;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
  published: boolean;
  profiles: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    created_at: string;
  };
}

interface BlogAlbum {
  id: string;
  name: string;
  author_id: string;
  thumbnail_url: string | null;
  description: string;
  created_at: string;
  profiles: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    created_at: string;
  };
}

export const useBlogData = (
  searchTerm: string, 
  selectedAlbum: string, 
  startDate: string, 
  endDate: string,
  selectedCategories: string[] | null
) => {
  const { user, hasRole, getEffectiveUserId } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [albums, setAlbums] = useState<BlogAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCreatePermission, setHasCreatePermission] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) {
      console.log('🚫 useBlogData - Pas d\'utilisateur connecté');
      setPosts([]);
      setAlbums([]);
      setLoading(false);
      return;
    }

    console.log('🔍 useBlogData - Récupération avec logique applicative stricte');
    setLoading(true);

    try {
      const effectiveUserId = getEffectiveUserId();
      console.log('👤 useBlogData - Utilisateur courant:', effectiveUserId);
      
      // 1. Récupérer UNIQUEMENT les groupes où l'utilisateur est membre
      const { data: userGroups, error: userGroupsError } = await supabase
        .from('group_members')
        .select('group_id, role')
        .eq('user_id', effectiveUserId);

      if (userGroupsError) {
        console.error('❌ useBlogData - Erreur récupération groupes utilisateur:', userGroupsError);
        setPosts([]);
        setAlbums([]);
        setLoading(false);
        return;
      }

      const userGroupIds = userGroups?.map(g => g.group_id) || [];
      console.log('👥 useBlogData - Groupes de l\'utilisateur:', {
        count: userGroupIds.length,
        groups: userGroups
      });

      // 2. Si l'utilisateur n'a pas de groupes, il ne voit QUE ses propres contenus
      let authorizedUserIds = [effectiveUserId];

      if (userGroupIds.length > 0) {
        // Récupérer TOUS les membres des groupes où l'utilisateur est présent
        const { data: groupMembers, error: groupMembersError } = await supabase
          .from('group_members')
          .select('user_id, group_id, role')
          .in('group_id', userGroupIds);

        if (groupMembersError) {
          console.error('❌ useBlogData - Erreur récupération membres groupes:', groupMembersError);
        } else {
          console.log('👥 useBlogData - Tous les membres des groupes:', groupMembers);
          
          // Ajouter tous les membres des groupes partagés
          const additionalUserIds = groupMembers?.map(gm => gm.user_id).filter(id => id !== effectiveUserId) || [];
          authorizedUserIds = [...authorizedUserIds, ...additionalUserIds];
          
          // Supprimer les doublons
          authorizedUserIds = [...new Set(authorizedUserIds)];
        }
      }

      console.log('✅ useBlogData - Utilisateurs autorisés FINAL:', {
        count: authorizedUserIds.length,
        userIds: authorizedUserIds,
        currentUser: effectiveUserId
      });

      // 3. Récupérer les posts UNIQUEMENT des utilisateurs autorisés
      let postsQuery = supabase
        .from('blog_posts')
        .select(`
          *,
          profiles(id, email, display_name, avatar_url, created_at)
        `)
        .in('author_id', authorizedUserIds)
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (selectedAlbum) {
        postsQuery = postsQuery.eq('album_id', selectedAlbum);
      }
      if (startDate) {
        postsQuery = postsQuery.gte('created_at', startDate);
      }
      if (endDate) {
        postsQuery = postsQuery.lte('created_at', endDate + 'T23:59:59');
      }
      if (searchTerm) {
        postsQuery = postsQuery.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      const { data: postsData, error: postsError } = await postsQuery;

      if (postsError) {
        console.error('❌ useBlogData - Erreur récupération posts:', postsError);
        setPosts([]);
      } else {
        console.log('📝 useBlogData - Posts récupérés:', {
          count: postsData?.length || 0,
          posts: postsData?.map(p => ({
            id: p.id,
            title: p.title,
            author_id: p.author_id,
            author_email: p.profiles?.email,
            author_display: p.profiles?.display_name
          }))
        });
        
        // Vérifier que tous les posts appartiennent bien aux utilisateurs autorisés
        const unauthorizedPosts = postsData?.filter(post => !authorizedUserIds.includes(post.author_id)) || [];
        if (unauthorizedPosts.length > 0) {
          console.error('🚨 useBlogData - PROBLÈME: Posts non autorisés détectés:', unauthorizedPosts);
        }
        
        const postsWithProfiles = (postsData || []).map(post => ({
          ...post,
          published: post.published ?? false,
          profiles: post.profiles || {
            id: post.author_id,
            email: 'unknown@example.com',
            display_name: 'Utilisateur inconnu',
            avatar_url: null,
            created_at: new Date().toISOString()
          }
        }));

        setPosts(postsWithProfiles);
      }

      // 4. Récupérer les albums UNIQUEMENT des utilisateurs autorisés
      const { data: albumsData, error: albumsError } = await supabase
        .from('blog_albums')
        .select(`
          *,
          profiles(id, email, display_name, avatar_url, created_at)
        `)
        .in('author_id', authorizedUserIds)
        .order('created_at', { ascending: false });

      if (albumsError) {
        console.error('❌ useBlogData - Erreur récupération albums:', albumsError);
        setAlbums([]);
      } else {
        console.log('📁 useBlogData - Albums récupérés:', {
          count: albumsData?.length || 0,
          albums: albumsData?.map(a => ({
            id: a.id,
            name: a.name,
            author_id: a.author_id,
            author_email: a.profiles?.email
          }))
        });
        
        const albumsWithProfiles = (albumsData || []).map(album => ({
          ...album,
          description: album.description || '',
          thumbnail_url: album.thumbnail_url,
          profiles: album.profiles || {
            id: album.author_id,
            email: 'unknown@example.com',
            display_name: 'Utilisateur inconnu',
            avatar_url: null,
            created_at: new Date().toISOString()
          }
        }));

        setAlbums(albumsWithProfiles);
      }

      // 5. Déterminer les permissions de création
      setHasCreatePermission(hasRole('admin') || hasRole('editor'));

    } catch (error) {
      console.error('💥 useBlogData - Erreur critique:', error);
      setPosts([]);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, selectedAlbum, startDate, endDate, hasRole, getEffectiveUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    posts,
    albums,
    loading,
    hasCreatePermission,
    refetch: fetchData
  };
};
