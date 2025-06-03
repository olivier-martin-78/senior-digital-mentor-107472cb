
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
  const { user, hasRole } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) {
        console.log('🚫 useBlogPosts - Pas d\'utilisateur connecté');
        setPosts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const isAdmin = hasRole('admin');
        
        console.log('🚀 useBlogPosts - Récupération posts pour:', {
          userEmail: user.email,
          userId: user.id,
          isAdmin
        });

        // Avec la nouvelle logique, une seule requête simple suffit
        // Les politiques RLS gèrent automatiquement l'accès basé sur l'appartenance aux groupes
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

        if (selectedAlbum && selectedAlbum !== 'none') {
          query = query.eq('album_id', selectedAlbum);
        }

        if (startDate) {
          query = query.gte('created_at', startDate);
        }

        if (endDate) {
          query = query.lte('created_at', endDate);
        }

        const { data, error } = await query;

        if (error) {
          console.error('❌ useBlogPosts - Erreur requête:', error);
          throw error;
        }

        const allPosts = data || [];
        
        console.log('✅ useBlogPosts - Posts récupérés avec nouvelle logique simplifiée:', {
          count: allPosts.length,
          postsParAuteur: allPosts.reduce((acc, post) => {
            const authorEmail = post.profiles?.email || 'Email non disponible';
            if (!acc[authorEmail]) {
              acc[authorEmail] = 0;
            }
            acc[authorEmail]++;
            return acc;
          }, {} as Record<string, number>)
        });

        setPosts(allPosts);
      } catch (error) {
        console.error('💥 useBlogPosts - Erreur critique:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, searchTerm, selectedAlbum, startDate, endDate, hasRole]);

  return { posts, loading };
};
