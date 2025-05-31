
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
  const { user, hasRole, getEffectiveUserId } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!user) {
        console.log('useBlogPosts - Pas d\'utilisateur connecté');
        setPosts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const effectiveUserId = getEffectiveUserId();
        
        console.log('useBlogPosts - Données utilisateur (CORRIGÉES):', {
          originalUserId: user.id,
          effectiveUserId: effectiveUserId,
          isImpersonating: effectiveUserId !== user.id,
          isAdmin: hasRole('admin')
        });

        console.log('useBlogPosts - Récupération avec nouvelles politiques RLS simplifiées');
        
        let query = supabase
          .from('blog_posts')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .order('created_at', { ascending: false });

        // Si l'utilisateur réel n'est pas admin, appliquer des filtres côté requête
        if (!hasRole('admin')) {
          // Utilisateur non-admin : voir seulement ses posts
          query = query.eq('author_id', effectiveUserId);
        }

        // Filtres de recherche
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
          console.error('useBlogPosts - Erreur Supabase:', error);
          throw error;
        }

        let filteredPosts = data || [];

        // FILTRAGE CÔTÉ CLIENT pour l'impersonnation
        if (hasRole('admin') && effectiveUserId !== user.id) {
          // En mode impersonnation : filtrer pour montrer seulement ce que l'utilisateur impersonné peut voir
          console.log('useBlogPosts - Mode impersonnation : filtrage côté client');
          filteredPosts = filteredPosts.filter(post => {
            // L'utilisateur impersonné peut voir :
            // - Ses propres posts (publiés ou non)
            // - Les posts publiés des autres (logique métier normale)
            const canSee = post.author_id === effectiveUserId || post.published;
            console.log('useBlogPosts - Post filtrage:', {
              postId: post.id,
              title: post.title,
              authorId: post.author_id,
              published: post.published,
              effectiveUserId,
              canSee
            });
            return canSee;
          });
        }

        console.log('useBlogPosts - Posts récupérés (APRÈS FILTRAGE):', {
          count: filteredPosts.length,
          posts: filteredPosts.map(post => ({
            id: post.id,
            title: post.title,
            author_id: post.author_id,
            published: post.published
          }))
        });

        setPosts(filteredPosts);
      } catch (error) {
        console.error('useBlogPosts - Erreur lors du chargement des posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, searchTerm, selectedAlbum, startDate, endDate, getEffectiveUserId, hasRole]);

  return { posts, loading };
};
