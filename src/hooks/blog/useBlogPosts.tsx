
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithAuthor } from '@/types/supabase';

export const useBlogPosts = (
  searchTerm: string, 
  selectedAlbum: string, 
  startDate?: string, 
  endDate?: string
) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) {
        setPosts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('useBlogPosts - Récupération avec nouvelles politiques RLS simplifiées');
        
        // Les nouvelles politiques RLS simplifiées gèrent automatiquement l'accès admin
        let query = supabase
          .from('blog_posts')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .order('created_at', { ascending: false });

        // Appliquer les filtres
        if (searchTerm) {
          query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
        }
        
        if (selectedAlbum) {
          query = query.eq('album_id', selectedAlbum);
        }
        
        if (startDate) {
          query = query.gte('created_at', startDate);
        }
        
        if (endDate) {
          const endDateTime = endDate + 'T23:59:59';
          query = query.lte('created_at', endDateTime);
        }

        const { data, error } = await query;
        
        if (error) {
          console.error('useBlogPosts - Erreur:', error);
          throw error;
        }

        console.log('useBlogPosts - Posts récupérés:', data?.length || 0);
        setPosts(data || []);
        
      } catch (error) {
        console.error('useBlogPosts - Erreur lors du chargement des articles:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [searchTerm, selectedAlbum, startDate, endDate, user]);

  return { posts, loading };
};
