
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface WishPost {
  id: string;
  title: string;
  content: string;
  first_name?: string;
  age?: string;
  location?: string;
  request_type?: string;
  importance?: string;
  published?: boolean;
  created_at: string;
  cover_image?: string;
  album_id?: string;
  author_id: string;
  profiles?: {
    display_name?: string | null;
    email?: string;
  };
}

export const useWishPosts = (searchTerm: string = '', albumId: string = '', startDate: string = '', endDate: string = '') => {
  const [posts, setPosts] = useState<WishPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, hasRole } = useAuth();
  const { toast } = useToast();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('wish_posts')
        .select(`
          *,
          profiles:author_id(display_name, email)
        `)
        .order('created_at', { ascending: false });

      // Filtrer par terme de recherche
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%`);
      }

      // Filtrer par album
      if (albumId && albumId !== 'none') {
        query = query.eq('album_id', albumId);
      }

      // Filtrer par plage de dates
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

      setPosts(data as WishPost[]);
    } catch (error: any) {
      console.error('Erreur lors du chargement des souhaits:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les souhaits',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [searchTerm, albumId, startDate, endDate]);

  return { posts, loading, refetch: fetchPosts };
};
