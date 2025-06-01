
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
        
        console.log('🚀 useBlogPosts - LOGIQUE CORRIGÉE: récupération posts des albums accessibles');
        console.log('🚀 useBlogPosts - Données utilisateur:', {
          originalUserId: user.id,
          originalUserEmail: user.email,
          effectiveUserId: effectiveUserId,
          isImpersonating: effectiveUserId !== user.id,
          isAdmin: hasRole('admin')
        });

        let query = supabase
          .from('blog_posts')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .order('created_at', { ascending: false });

        if (hasRole('admin')) {
          console.log('🔑 useBlogPosts - Mode admin: récupération de tous les posts publiés');
          // Admin peut voir tous les posts publiés
          query = query.eq('published', true);
        } else {
          console.log('👤 useBlogPosts - Mode utilisateur: récupération albums accessibles');
          
          // Récupérer d'abord les albums accessibles
          const accessibleAlbumIds: string[] = [];
          
          // 1. Albums créés par l'utilisateur
          const { data: ownedAlbums, error: ownedError } = await supabase
            .from('blog_albums')
            .select('id')
            .eq('author_id', effectiveUserId);
          
          if (ownedError) {
            console.error('❌ useBlogPosts - Erreur albums possédés:', ownedError);
          } else if (ownedAlbums) {
            accessibleAlbumIds.push(...ownedAlbums.map(album => album.id));
            console.log('📋 useBlogPosts - Albums créés par l\'utilisateur:', {
              count: ownedAlbums.length,
              albums: ownedAlbums.map(a => a.id)
            });
          }
          
          // 2. Albums avec permissions - CORRECTION IMPORTANTE
          const { data: permittedAlbums, error: permissionsError } = await supabase
            .from('album_permissions')
            .select('album_id')
            .eq('user_id', effectiveUserId);
          
          if (permissionsError) {
            console.error('❌ useBlogPosts - Erreur permissions albums:', permissionsError);
          } else if (permittedAlbums) {
            const permittedAlbumIds = permittedAlbums.map(p => p.album_id);
            accessibleAlbumIds.push(...permittedAlbumIds);
            console.log('🔑 useBlogPosts - Albums avec permissions CORRIGÉ:', {
              count: permittedAlbumIds.length,
              albumIds: permittedAlbumIds,
              userEmail: user.email
            });
          }
          
          // Supprimer les doublons
          const uniqueAccessibleAlbumIds = [...new Set(accessibleAlbumIds)];
          console.log('🎯 useBlogPosts - Albums accessibles uniques CORRIGÉ:', {
            count: uniqueAccessibleAlbumIds.length,
            albumIds: uniqueAccessibleAlbumIds,
            userEmail: user.email
          });
          
          if (uniqueAccessibleAlbumIds.length > 0) {
            // CORRECTION : Récupérer tous les posts des albums accessibles (publiés) + posts de l'utilisateur (publiés ou non)
            console.log('🔍 useBlogPosts - Construction requête avec albums accessibles');
            query = query.or(`and(album_id.in.(${uniqueAccessibleAlbumIds.join(',')}),published.eq.true),author_id.eq.${effectiveUserId}`);
          } else {
            // Aucun album accessible, récupérer seulement les posts de l'utilisateur
            console.log('⚠️ useBlogPosts - Aucun album accessible, posts utilisateur seulement');
            query = query.eq('author_id', effectiveUserId);
          }
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

        console.log('✅ useBlogPosts - Posts récupérés AVANT filtrage final CORRIGÉ:', {
          count: filteredPosts.length,
          userEmail: user.email,
          posts: filteredPosts.map(post => ({
            id: post.id,
            title: post.title,
            author_id: post.author_id,
            album_id: post.album_id,
            published: post.published
          }))
        });

        // FILTRAGE CÔTÉ CLIENT pour l'impersonnation (si nécessaire)
        if (hasRole('admin') && effectiveUserId !== user.id) {
          console.log('🔄 useBlogPosts - Mode impersonnation admin: filtrage côté client');
          filteredPosts = filteredPosts.filter(post => {
            const canSee = post.author_id === effectiveUserId || post.published;
            console.log('🔍 useBlogPosts - Post filtrage impersonnation:', {
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

        console.log('🎉 useBlogPosts - Posts FINAUX (APRÈS FILTRAGE) CORRIGÉ:', {
          count: filteredPosts.length,
          userEmail: user.email,
          posts: filteredPosts.map(post => ({
            id: post.id,
            title: post.title,
            author_id: post.author_id,
            album_id: post.album_id,
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
