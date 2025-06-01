
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

          // CORRECTION : Faire deux requêtes séparées et les combiner
          const postsPromises: Promise<any>[] = [];

          // 1. Posts de l'utilisateur (tous, publiés ou non)
          let userPostsQuery = supabase
            .from('blog_posts')
            .select(`
              *,
              profiles(id, display_name, email, avatar_url, created_at)
            `)
            .eq('author_id', effectiveUserId)
            .order('created_at', { ascending: false });

          // Appliquer les filtres aux posts de l'utilisateur
          if (searchTerm) {
            userPostsQuery = userPostsQuery.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
          }

          if (selectedAlbum && selectedAlbum !== 'none') {
            userPostsQuery = userPostsQuery.eq('album_id', selectedAlbum);
          }

          if (startDate) {
            userPostsQuery = userPostsQuery.gte('created_at', startDate);
          }

          if (endDate) {
            userPostsQuery = userPostsQuery.lte('created_at', endDate);
          }

          // CORRECTION : Exécuter la requête et ajouter la promesse
          postsPromises.push(userPostsQuery);

          // 2. Posts des albums accessibles (seulement publiés)
          if (uniqueAccessibleAlbumIds.length > 0) {
            let albumPostsQuery = supabase
              .from('blog_posts')
              .select(`
                *,
                profiles(id, display_name, email, avatar_url, created_at)
              `)
              .in('album_id', uniqueAccessibleAlbumIds)
              .eq('published', true)
              .neq('author_id', effectiveUserId) // Éviter les doublons avec les posts de l'utilisateur
              .order('created_at', { ascending: false });

            // Appliquer les filtres aux posts des albums
            if (searchTerm) {
              albumPostsQuery = albumPostsQuery.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
            }

            if (selectedAlbum && selectedAlbum !== 'none') {
              albumPostsQuery = albumPostsQuery.eq('album_id', selectedAlbum);
            }

            if (startDate) {
              albumPostsQuery = albumPostsQuery.gte('created_at', startDate);
            }

            if (endDate) {
              albumPostsQuery = albumPostsQuery.lte('created_at', endDate);
            }

            // CORRECTION : Exécuter la requête et ajouter la promesse
            postsPromises.push(albumPostsQuery);
          }

          // Exécuter toutes les requêtes en parallèle
          const results = await Promise.all(postsPromises);
          
          // Combiner tous les résultats
          allPosts = [];
          results.forEach((result, index) => {
            if (result.error) {
              console.error(`❌ useBlogPosts - Erreur requête ${index}:`, result.error);
            } else if (result.data) {
              allPosts.push(...result.data);
              console.log(`✅ useBlogPosts - Requête ${index} réussie:`, {
                count: result.data.length,
                posts: result.data.map((p: any) => ({
                  id: p.id,
                  title: p.title,
                  author_id: p.author_id,
                  album_id: p.album_id,
                  published: p.published
                }))
              });
            }
          });

          // Supprimer les doublons par ID et trier par date
          const uniquePosts = allPosts.filter((post, index, self) => 
            index === self.findIndex(p => p.id === post.id)
          );
          
          allPosts = uniquePosts.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }

        console.log('✅ useBlogPosts - Posts récupérés AVANT filtrage final CORRIGÉ:', {
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

        console.log('🎉 useBlogPosts - Posts FINAUX (APRÈS FILTRAGE) CORRIGÉ:', {
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
