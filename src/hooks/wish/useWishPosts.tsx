
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGroupPermissions } from '../useGroupPermissions';

export const useWishPosts = (searchTerm?: string, albumId?: string, startDate?: string, endDate?: string) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { authorizedUserIds, loading: permissionsLoading } = useGroupPermissions();

  useEffect(() => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    if (!permissionsLoading && authorizedUserIds.length > 0) {
      fetchPosts();
    } else if (!permissionsLoading && authorizedUserIds.length === 0) {
      setPosts([]);
      setLoading(false);
    }
  }, [user, authorizedUserIds, permissionsLoading, searchTerm, albumId, startDate, endDate]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 useWishPosts - Récupération avec permissions de groupe');
      console.log('🎯 useWishPosts - Utilisateurs autorisés:', authorizedUserIds);

      let query = supabase
        .from('wish_posts')
        .select(`
          *,
          wish_albums(id, name),
          profiles(id, display_name, email, avatar_url)
        `)
        .in('author_id', authorizedUserIds)
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%`);
      }

      if (albumId && albumId !== 'none') {
        query = query.eq('album_id', albumId);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ useWishPosts - Erreur récupération posts:', error);
        throw error;
      }

      console.log('📝 useWishPosts - Posts récupérés:', data?.length || 0);
      setPosts(data || []);
    } catch (error) {
      console.error('💥 useWishPosts - Erreur lors du chargement des posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  return { posts, loading };
};
