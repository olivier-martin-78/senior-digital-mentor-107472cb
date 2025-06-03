
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  album_id: string | null;
  cover_image?: string;
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
  const { user, hasRole } = useAuth();
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

    console.log('🔍 Récupération blog data avec logique applicative');
    setLoading(true);

    try {
      // Récupérer d'abord les groupes de l'utilisateur
      const { data: userGroups, error: groupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      if (groupsError) {
        console.error('❌ Erreur récupération groupes:', groupsError);
        setLoading(false);
        return;
      }

      const groupIds = userGroups?.map(g => g.group_id) || [];
      
      // Récupérer les membres des mêmes groupes
      let authorizedUsers = [user.id];
      if (groupIds.length > 0) {
        const { data: groupMembers, error: membersError } = await supabase
          .from('group_members')
          .select('user_id')
          .in('group_id', groupIds);
        
        if (!membersError && groupMembers) {
          const additionalUsers = groupMembers.map(gm => gm.user_id).filter(id => id !== user.id);
          authorizedUsers = [...authorizedUsers, ...additionalUsers];
        }
      }

      // Récupérer les posts avec logique d'accès côté application
      let postsQuery = supabase
        .from('blog_posts')
        .select('*')
        .in('author_id', authorizedUsers)
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
      } else {
        console.log('✅ Posts récupérés:', postsData?.length || 0);
        
        if (postsData && postsData.length > 0) {
          // Récupérer les profils des auteurs
          const userIds = [...new Set(postsData.map(post => post.author_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, display_name, avatar_url, created_at')
            .in('id', userIds);

          const profilesMap = profiles?.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>) || {};

          const postsWithProfiles = postsData.map(post => ({
            ...post,
            published: post.published ?? false,
            profiles: profilesMap[post.author_id] || {
              id: post.author_id,
              email: 'unknown@example.com',
              display_name: 'Utilisateur inconnu',
              avatar_url: null,
              created_at: new Date().toISOString()
            }
          }));

          setPosts(postsWithProfiles);
        } else {
          setPosts([]);
        }
      }

      // Récupérer les albums avec logique d'accès côté application
      const { data: albumsData, error: albumsError } = await supabase
        .from('blog_albums')
        .select('*')
        .in('author_id', authorizedUsers)
        .order('created_at', { ascending: false });

      if (albumsError) {
        console.error('❌ Erreur récupération albums:', albumsError);
      } else {
        console.log('✅ Albums récupérés:', albumsData?.length || 0);
        
        if (albumsData && albumsData.length > 0) {
          // Récupérer les profils des auteurs
          const userIds = [...new Set(albumsData.map(album => album.author_id))];
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email, display_name, avatar_url, created_at')
            .in('id', userIds);

          const profilesMap = profiles?.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>) || {};

          const albumsWithProfiles = albumsData.map(album => ({
            ...album,
            description: album.description || '',
            thumbnail_url: album.thumbnail_url,
            profiles: profilesMap[album.author_id] || {
              id: album.author_id,
              email: 'unknown@example.com',
              display_name: 'Utilisateur inconnu',
              avatar_url: null,
              created_at: new Date().toISOString()
            }
          }));

          setAlbums(albumsWithProfiles);
        } else {
          setAlbums([]);
        }
      }

      // Déterminer les permissions de création - maintenant seuls admin et editor peuvent créer
      setHasCreatePermission(hasRole('admin') || hasRole('editor'));

    } catch (error) {
      console.error('💥 Erreur critique useBlogData:', error);
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, selectedAlbum, startDate, endDate, hasRole]);

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
