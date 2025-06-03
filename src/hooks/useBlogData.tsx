
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
}

interface BlogAlbum {
  id: string;
  name: string;
  author_id: string;
  thumbnail_url?: string;
  description?: string;
  created_at: string;
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
      // Récupérer les posts avec logique d'accès côté application
      let postsQuery = supabase
        .from('blog_posts')
        .select('*')
        .or(`author_id.eq.${user.id},author_id.in.(${await getAuthorizedUserIds(user.id)})`)
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
        .select('*')
        .or(`author_id.eq.${user.id},author_id.in.(${await getAuthorizedUserIds(user.id)})`)
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

  // Fonction pour récupérer les IDs des utilisateurs autorisés via les groupes
  const getAuthorizedUserIds = async (userId: string): Promise<string> => {
    try {
      const { data: groupMembers } = await supabase
        .from('group_members')
        .select(`
          user_id,
          group_members_same_group:group_members!inner(user_id)
        `)
        .eq('group_members.user_id', userId);

      const userIds = groupMembers?.flatMap(gm => 
        gm.group_members_same_group?.map(sgm => sgm.user_id) || []
      ).filter(id => id !== userId) || [];

      return userIds.join(',') || 'null';
    } catch (error) {
      console.error('Erreur récupération groupe membres:', error);
      return 'null';
    }
  };

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
