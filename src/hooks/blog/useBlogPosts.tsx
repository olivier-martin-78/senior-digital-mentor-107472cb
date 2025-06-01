
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
        
        console.log('🚀 useBlogPosts - CORRECTION FINALE: récupération posts des albums accessibles');
        console.log('🚀 useBlogPosts - Données utilisateur:', {
          originalUserId: user.id,
          originalUserEmail: user.email,
          effectiveUserId: effectiveUserId,
          isImpersonating: effectiveUserId !== user.id,
          isAdmin: hasRole('admin')
        });

        let allPosts: any[] = [];

        if (hasRole('admin')) {
          console.log('🔑 useBlogPosts - Mode admin: récupération de tous les posts publiés');
          let query = supabase
            .from('blog_posts')
            .select(`
              *,
              profiles(id, display_name, email, avatar_url, created_at)
            `)
            .eq('published', true)
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
            console.error('useBlogPosts - Erreur Supabase admin:', error);
            throw error;
          }

          allPosts = data || [];
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
          
          // 2. Albums avec permissions
          const { data: permittedAlbums, error: permissionsError } = await supabase
            .from('album_permissions')
            .select('album_id')
            .eq('user_id', effectiveUserId);
          
          if (permissionsError) {
            console.error('❌ useBlogPosts - Erreur permissions albums:', permissionsError);
          } else if (permittedAlbums) {
            const permittedAlbumIds = permittedAlbums.map(p => p.album_id);
            accessibleAlbumIds.push(...permittedAlbumIds);
            console.log('🔑 useBlogPosts - Albums avec permissions:', {
              count: permittedAlbumIds.length,
              albumIds: permittedAlbumIds,
              userEmail: user.email
            });
          }
          
          // Supprimer les doublons
          const uniqueAccessibleAlbumIds = [...new Set(accessibleAlbumIds)];
          console.log('🎯 useBlogPosts - Albums accessibles uniques:', {
            count: uniqueAccessibleAlbumIds.length,
            albumIds: uniqueAccessibleAlbumIds,
            userEmail: user.email
          });

          // CORRECTION CRITIQUE : Une seule requête pour tous les posts accessibles
          allPosts = [];

          if (uniqueAccessibleAlbumIds.length > 0) {
            console.log('🔍 useBlogPosts - Récupération de TOUS les posts des albums accessibles');
            
            let postsQuery = supabase
              .from('blog_posts')
              .select(`
                *,
                profiles(id, display_name, email, avatar_url, created_at)
              `)
              .in('album_id', uniqueAccessibleAlbumIds)
              .or(`author_id.eq.${effectiveUserId},published.eq.true`) // Posts de l'utilisateur OU posts publiés
              .order('created_at', { ascending: false });

            // Appliquer les filtres
            if (searchTerm) {
              postsQuery = postsQuery.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
            }

            if (selectedAlbum && selectedAlbum !== 'none') {
              postsQuery = postsQuery.eq('album_id', selectedAlbum);
            }

            if (startDate) {
              postsQuery = postsQuery.gte('created_at', startDate);
            }

            if (endDate) {
              postsQuery = postsQuery.lte('created_at', endDate);
            }

            const { data: accessiblePosts, error: accessiblePostsError } = await postsQuery;
            
            if (accessiblePostsError) {
              console.error('❌ useBlogPosts - Erreur posts accessibles:', accessiblePostsError);
            } else if (accessiblePosts) {
              allPosts = accessiblePosts;
              console.log('✅ useBlogPosts - Posts accessibles récupérés:', {
                count: accessiblePosts.length,
                posts: accessiblePosts.map((p: any) => ({
                  id: p.id,
                  title: p.title,
                  author_id: p.author_id,
                  album_id: p.album_id,
                  published: p.published
                }))
              });
            }
          } else {
            console.log('⚠️ useBlogPosts - Aucun album accessible trouvé');
          }

          // Récupérer aussi les posts de l'utilisateur qui ne sont dans aucun album
          let userPostsQuery = supabase
            .from('blog_posts')
            .select(`
              *,
              profiles(id, display_name, email, avatar_url, created_at)
            `)
            .eq('author_id', effectiveUserId)
            .is('album_id', null)
            .order('created_at', { ascending: false });

          // Appliquer les filtres
          if (searchTerm) {
            userPostsQuery = userPostsQuery.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
          }

          if (selectedAlbum && selectedAlbum !== 'none') {
            // Si un album spécifique est sélectionné, on ignore les posts sans album
            userPostsQuery = userPostsQuery.eq('album_id', selectedAlbum);
          }

          if (startDate) {
            userPostsQuery = userPostsQuery.gte('created_at', startDate);
          }

          if (endDate) {
            userPostsQuery = userPostsQuery.lte('created_at', endDate);
          }

          const { data: userPostsWithoutAlbum, error: userPostsError } = await userPostsQuery;
          
          if (userPostsError) {
            console.error('❌ useBlogPosts - Erreur posts utilisateur sans album:', userPostsError);
          } else if (userPostsWithoutAlbum) {
            // Ajouter les posts sans album en évitant les doublons
            userPostsWithoutAlbum.forEach(post => {
              if (!allPosts.find(p => p.id === post.id)) {
                allPosts.push(post);
              }
            });
            console.log('✅ useBlogPosts - Posts utilisateur sans album ajoutés:', {
              count: userPostsWithoutAlbum.length
            });
          }

          // Trier par date
          allPosts.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }

        console.log('✅ useBlogPosts - Posts FINAUX CORRIGÉS:', {
          count: allPosts.length,
          userEmail: user.email,
          posts: allPosts.map(post => ({
            id: post.id,
            title: post.title,
            author_id: post.author_id,
            album_id: post.album_id,
            published: post.published
          }))
        });

        setPosts(allPosts);
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
