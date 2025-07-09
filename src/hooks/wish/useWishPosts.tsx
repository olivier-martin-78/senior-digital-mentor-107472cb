
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { WishPost } from '@/types/supabase';

export const useWishPosts = (searchTerm: string = '', albumId: string = '', startDate: string = '', endDate: string = '', wishId?: string, statusFilter: string = '') => {
  const [posts, setPosts] = useState<WishPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPosts = async () => {
    if (wishId === 'new') {
      setLoading(false);
      return;
    }

    if (!user) {
      console.log('🚫 useWishPosts - Pas d\'utilisateur connecté');
      setPosts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔍 useWishPosts - Récupération des souhaits');

      let query = supabase
        .from('wish_posts')
        .select(`
          *,
          profiles:author_id(display_name, email)
        `)
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

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'pending' | 'fulfilled' | 'cancelled');
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
    fetchPosts();
  }, [searchTerm, albumId, startDate, endDate, wishId, statusFilter, user]);

  return { posts, loading, refetch: fetchPosts };
};
