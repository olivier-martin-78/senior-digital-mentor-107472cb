
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

    console.log('🔍 Récupération blog data');
    setLoading(true);

    try {
      // Récupérer les posts avec RLS automatique
      let postsQuery = supabase
        .from('blog_posts')
        .select(`
          *,
          profiles(id, email, display_name, avatar_url, created_at)
        `)
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
        console.log('✅ Posts récupérés:', postsData?.length || 0);
        
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

      // Récupérer les albums avec RLS automatique
      const { data: albumsData, error: albumsError } = await supabase
        .from('blog_albums')
        .select(`
          *,
          profiles(id, email, display_name, avatar_url, created_at)
        `)
        .order('created_at', { ascending: false });

      if (albumsError) {
        console.error('❌ Erreur récupération albums:', albumsError);
        setAlbums([]);
      } else {
        console.log('✅ Albums récupérés:', albumsData?.length || 0);
        
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

      // Déterminer les permissions de création - seuls admin et editor peuvent créer
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
