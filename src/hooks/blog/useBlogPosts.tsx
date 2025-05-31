
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithAuthor } from '@/types/supabase';

export const useBlogPosts = (
  searchTerm: string, 
  selectedAlbum: string, 
  startDate?: string, 
  endDate?: string, 
  selectedUserId?: string | null,
  effectiveUserId?: string,
  authorizedUserIds?: string[]
) => {
  const { hasRole } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        console.log('useBlogPosts - Début fetchPosts avec nouvelles politiques consolidées');
        
        // Avec les nouvelles politiques RLS consolidées, nous pouvons simplifier énormément
        // La politique "blog_posts_select_consolidated" gère automatiquement :
        // - Admin peut tout voir
        // - Propriétaire peut voir ses posts (publiés et brouillons)
        // - Posts publiés visibles par tous
        // - Permissions sur les albums
        
        let query = supabase
          .from('blog_posts')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .order('created_at', { ascending: false });

        // Appliquer les filtres
        if (selectedUserId) {
          query = query.eq('author_id', selectedUserId);
        }

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
          console.error('useBlogPosts - Erreur politique consolidée:', error);
          throw error;
        }

        console.log('useBlogPosts - Posts récupérés avec politique consolidée:', data?.length || 0);
        console.log('useBlogPosts - Posts détails:', data?.map(p => ({ 
          id: p.id, 
          title: p.title, 
          author: p.profiles?.display_name,
          published: p.published,
          album_id: p.album_id 
        })));
        
        setPosts(data || []);
        
      } catch (error) {
        console.error('useBlogPosts - Erreur lors du chargement des articles:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    if (effectiveUserId) {
      fetchPosts();
    }
  }, [searchTerm, selectedAlbum, startDate, endDate, selectedUserId, effectiveUserId, authorizedUserIds, hasRole]);

  return { posts, loading };
};
