
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithAuthor } from '@/types/supabase';

export const useBlogPosts = (
  searchTerm: string,
  selectedAlbum: string,
  startDate?: string,
  endDate?: string,
  selectedCategories?: string[]
) => {
  const { user, getEffectiveUserId } = useAuth();
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
        
        console.log('🔍 useBlogPosts - Récupération avec filtres:', {
          searchTerm,
          selectedAlbum,
          selectedCategories
        });

        const effectiveUserId = getEffectiveUserId();
        console.log('👤 useBlogPosts - Utilisateur courant:', effectiveUserId);

        // Récupérer TOUS les posts accessibles via RLS
        let query = supabase
          .from('blog_posts')
          .select(`
            *,
            profiles!inner(id, display_name, email, avatar_url, created_at, receive_contacts)
          `)
          .order('created_at', { ascending: false });

        // Appliquer les filtres de recherche et dates
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

        const { data: allPosts, error } = await query;

        if (error) {
          console.error('❌ useBlogPosts - Erreur requête:', error);
          throw error;
        }

        console.log('📝 useBlogPosts - Posts récupérés:', allPosts?.length || 0);

        if (!allPosts || allPosts.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }

        // Les posts sont déjà filtrés par les politiques RLS
        // Pas besoin de filtrer côté client - la sécurité est gérée par Supabase
        let filteredPosts = allPosts;

        // Filtrer par catégories si des catégories sont sélectionnées
        if (selectedCategories && selectedCategories.length > 0) {
          console.log('🏷️ Filtrage par catégories:', selectedCategories);
          
          // Récupérer les associations post-catégories
          const { data: postCategories } = await supabase
            .from('post_categories')
            .select('post_id, category_id')
            .in('category_id', selectedCategories);

          if (postCategories) {
            const postIdsWithCategories = postCategories.map(pc => pc.post_id);
            filteredPosts = filteredPosts.filter(post => 
              postIdsWithCategories.includes(post.id)
            );
            console.log('🏷️ Posts après filtrage par catégories:', filteredPosts.length);
          }
        }

        console.log('🏁 useBlogPosts - Posts finaux:', filteredPosts.length);

        setPosts(filteredPosts as PostWithAuthor[]);
      } catch (error) {
        console.error('💥 useBlogPosts - Erreur critique:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, searchTerm, selectedAlbum, startDate, endDate, selectedCategories, getEffectiveUserId]);

  return { posts, loading };
};

