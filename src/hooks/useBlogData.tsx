
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
      setPosts([]);
      setAlbums([]);
      setLoading(false);
      return;
    }

    console.log('🔍 Récupération blog data avec logique applicative stricte');
    setLoading(true);

    try {
      const effectiveUserId = getEffectiveUserId();
      
      // 1. Récupérer les groupes de l'utilisateur courant
      const { data: userGroups, error: userGroupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', effectiveUserId);

      if (userGroupsError) {
        console.error('❌ Erreur récupération groupes utilisateur:', userGroupsError);
        setPosts([]);
        setAlbums([]);
        setLoading(false);
        return;
      }

      const userGroupIds = userGroups?.map(g => g.group_id) || [];
      console.log('👥 Groupes utilisateur:', userGroupIds.length);

      // 2. Récupérer tous les membres des mêmes groupes (utilisateurs autorisés)
      let authorizedUserIds = [effectiveUserId]; // L'utilisateur peut toujours voir ses propres contenus

      if (userGroupIds.length > 0) {
        const { data: groupMembers, error: groupMembersError } = await supabase
          .from('group_members')
          .select('user_id')
          .in('group_id', userGroupIds);

        if (groupMembersError) {
          console.error('❌ Erreur récupération membres groupes:', groupMembersError);
        } else {
          const additionalUserIds = groupMembers?.map(gm => gm.user_id).filter(id => id !== effectiveUserId) || [];
          authorizedUserIds = [...authorizedUserIds, ...additionalUserIds];
        }
      }

      console.log('✅ Utilisateurs autorisés:', {
        count: authorizedUserIds.length,
        userIds: authorizedUserIds
      });

      // 3. Récupérer les posts avec la logique d'accès côté application
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
        console.error('❌ Erreur récupération posts:', postsError);
        setPosts([]);
      } else {
        console.log('✅ Posts récupérés avec logique applicative:', {
          count: postsData?.length || 0,
          postsParAuteur: postsData?.reduce((acc, post) => {
            const authorEmail = post.profiles?.email || 'Email non disponible';
            if (!acc[authorEmail]) {
              acc[authorEmail] = 0;
            }
            acc[authorEmail]++;
            return acc;
          }, {} as Record<string, number>)
        });
        
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

      // 4. Récupérer les albums avec la même logique d'accès côté application
      const { data: albumsData, error: albumsError } = await supabase
        .from('blog_albums')
        .select(`
          *,
          profiles(id, email, display_name, avatar_url, created_at)
        `)
        .in('author_id', authorizedUserIds)
        .order('created_at', { ascending: false });

      if (albumsError) {
        console.error('❌ Erreur récupération albums:', albumsError);
        setAlbums([]);
      } else {
        console.log('✅ Albums récupérés avec logique applicative:', {
          count: albumsData?.length || 0,
          albumsParAuteur: albumsData?.reduce((acc, album) => {
            const authorEmail = album.profiles?.email || 'Email non disponible';
            if (!acc[authorEmail]) {
              acc[authorEmail] = 0;
            }
            acc[authorEmail]++;
            return acc;
          }, {} as Record<string, number>)
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

      // 5. Déterminer les permissions de création - seuls admin et editor peuvent créer
      setHasCreatePermission(hasRole('admin') || hasRole('editor'));

    } catch (error) {
      console.error('💥 Erreur critique useBlogData:', error);
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
