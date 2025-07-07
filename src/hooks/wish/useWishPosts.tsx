
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useGroupPermissions } from '../useGroupPermissions';
import { WishPost } from '@/types/supabase';

export const useWishPosts = (searchTerm: string = '', albumId: string = '', startDate: string = '', endDate: string = '', wishId?: string) => {
  const [posts, setPosts] = useState<WishPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { authorizedUserIds, loading: permissionsLoading } = useGroupPermissions();

  const fetchPosts = async () => {
    if (wishId === 'new') {
      setLoading(false);
      return;
    }

    if (!user || permissionsLoading) {
      setPosts([]);
      setLoading(false);
      return;
    }

    if (authorizedUserIds.length === 0) {
      console.log('⚠️ useWishPosts - Aucun utilisateur autorisé');
      setPosts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔍 useWishPosts - Récupération avec permissions de groupe');
      console.log('✅ useWishPosts - Utilisateurs autorisés:', authorizedUserIds);

      let query = supabase
        .from('wish_posts')
        .select(`
          *,
          profiles:author_id(display_name, email)
        `)
        .in('author_id', authorizedUserIds)
        .order('created_at', { ascending: false });

      if (wishId && wishId !== 'new') {
        query = query.eq('id', wishId);
      }

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
        query = query.lte('created_at', endDate + 'T23:59:59.999Z');
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      console.log('✅ useWishPosts - Posts récupérés:', data?.length || 0);
      setPosts(data as WishPost[]);
    } catch (error: any) {
      console.error('❌ useWishPosts - Erreur lors du chargement des souhaits:', error);
      
      if (wishId) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le souhait',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les souhaits',
          variant: 'destructive',
        });
      }
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permissionsLoading) {
      fetchPosts();
    }
  }, [searchTerm, albumId, startDate, endDate, wishId, authorizedUserIds, permissionsLoading]);

  return { posts, loading, refetch: fetchPosts };
};
