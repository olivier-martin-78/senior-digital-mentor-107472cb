
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  album_id?: string;
  cover_image?: string;
  created_at: string;
  published?: boolean;
  profiles?: {
    id: string;
    email: string;
    display_name: string | null;
  };
}

interface BlogAlbum {
  id: string;
  name: string;
  author_id: string;
  thumbnail_url?: string;
  description?: string;
  created_at: string;
  profiles?: {
    id: string;
    email: string;
    display_name: string | null;
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
      const { data: userGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      const groupIds = userGroups?.map(g => g.group_id) || [];
      
      // Récupérer les membres des mêmes groupes
      let authorizedUsers = [user.id];
      if (groupIds.length > 0) {
        const { data: groupMembers } = await supabase
          .from('group_members')
          .select('user_id')
          .in('group_id', groupIds);
        
        const additionalUsers = groupMembers?.map(gm => gm.user_id).filter(id => id !== user.id) || [];
        authorizedUsers = [...authorizedUsers, ...additionalUsers];
      }

      // Récupérer les posts avec logique d'accès côté application
      let postsQuery = supabase
        .from('blog_posts')
        .select(`
          *,
          profiles!blog_posts_author_id_fkey(id, email, display_name)
        `)
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
        setPosts(postsData || []);
      }

      // Récupérer les albums avec logique d'accès côté application
      const { data: albumsData, error: albumsError } = await supabase
        .from('blog_albums')
        .select(`
          *,
          profiles!blog_albums_author_id_fkey(id, email, display_name)
        `)
        .in('author_id', authorizedUsers)
        .order('created_at', { ascending: false });

      if (albumsError) {
        console.error('❌ Erreur récupération albums:', albumsError);
      } else {
        console.log('✅ Albums récupérés:', albumsData?.length || 0);
        setAlbums(albumsData || []);
      }

      // Déterminer les permissions de création
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
