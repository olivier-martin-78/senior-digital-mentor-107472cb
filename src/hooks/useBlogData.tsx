
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGroupPermissions } from './useGroupPermissions';

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
  const { user, hasRole } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [albums, setAlbums] = useState<BlogAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCreatePermission, setHasCreatePermission] = useState(false);
  const { authorizedUserIds, loading: permissionsLoading } = useGroupPermissions();

  const fetchData = useCallback(async () => {
    if (!user || permissionsLoading) {
      console.log('🚫 useBlogData - Pas d\'utilisateur connecté ou permissions en cours de chargement');
      setPosts([]);
      setAlbums([]);
      setLoading(false);
      return;
    }

    console.log('🔍 useBlogData - DÉBUT - Récupération avec permissions de groupe centralisées');
    setLoading(true);

    try {
      if (authorizedUserIds.length === 0) {
        console.log('⚠️ useBlogData - Aucun utilisateur autorisé');
        setPosts([]);
        setAlbums([]);
        return;
      }

      console.log('🎯 useBlogData - Utilisateurs autorisés (CENTRALISÉ):', {
        count: authorizedUserIds.length,
        userIds: authorizedUserIds
      });

      // 3. Récupérer les posts des utilisateurs autorisés
      let postsQuery = supabase
        .from('blog_posts')
        .select('*')
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
        console.log('📝 useBlogData - Posts récupérés (CENTRALISÉ):', {
          count: postsData?.length || 0
        });

        if (postsData && postsData.length > 0) {
          // Récupérer les profils des auteurs
          const userIds = [...new Set(postsData.map(post => post.author_id))];
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', userIds);

          if (profilesError) {
            console.error('❌ useBlogData - Erreur récupération profils:', profilesError);
            setPosts([]);
            return;
          }

          const postsWithProfiles = postsData.map(post => ({
            ...post,
            published: post.published ?? false,
            profiles: profilesData?.find(p => p.id === post.author_id) || {
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

      // 4. Récupérer les albums des utilisateurs autorisés
      const { data: albumsData, error: albumsError } = await supabase
        .from('blog_albums')
        .select('*')
        .in('author_id', authorizedUserIds)
        .order('created_at', { ascending: false });

      if (albumsError) {
        console.error('❌ useBlogData - Erreur récupération albums:', albumsError);
        setAlbums([]);
      } else {
        console.log('📁 useBlogData - Albums récupérés (CENTRALISÉ):', {
          count: albumsData?.length || 0
        });

        if (albumsData && albumsData.length > 0) {
          // Récupérer les profils des auteurs d'albums
          const albumUserIds = [...new Set(albumsData.map(album => album.author_id))];
          const { data: albumProfilesData, error: albumProfilesError } = await supabase
            .from('profiles')
            .select('*')
            .in('id', albumUserIds);

          if (albumProfilesError) {
            console.error('❌ useBlogData - Erreur récupération profils albums:', albumProfilesError);
            setAlbums([]);
            return;
          }

          const albumsWithProfiles = albumsData.map(album => ({
            ...album,
            description: album.description || '',
            thumbnail_url: album.thumbnail_url,
            profiles: albumProfilesData?.find(p => p.id === album.author_id) || {
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

      // 5. Déterminer les permissions de création
      setHasCreatePermission(hasRole('admin') || hasRole('editor') || hasRole('reader'));

      console.log('🏁 useBlogData - FIN - Récapitulatif (CENTRALISÉ):', {
        authorizedUsers: authorizedUserIds.length,
        postsFound: postsData?.length || 0,
        albumsFound: albumsData?.length || 0
      });

    } catch (error) {
      console.error('💥 useBlogData - Erreur critique:', error);
      setPosts([]);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, selectedAlbum, startDate, endDate, hasRole, authorizedUserIds, permissionsLoading]);

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
