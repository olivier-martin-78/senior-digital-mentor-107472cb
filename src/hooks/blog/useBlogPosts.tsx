
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
        console.log('🚫 useBlogPosts - Pas d\'utilisateur connecté');
        setPosts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const effectiveUserId = getEffectiveUserId();
        const isAdmin = hasRole('admin');
        
        console.log('🚀 useBlogPosts - DÉBUT RÉCUPÉRATION POSTS CORRIGÉE');
        console.log('🔍 useBlogPosts - Utilisateur:', {
          originalUserId: user.id,
          originalUserEmail: user.email,
          effectiveUserId: effectiveUserId,
          isAdmin: isAdmin
        });

        let allPosts: any[] = [];

        if (isAdmin) {
          console.log('🔑 useBlogPosts - Mode admin: tous les posts publiés');
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
            console.error('❌ useBlogPosts - Erreur admin:', error);
            throw error;
          }

          allPosts = data || [];
          console.log('✅ useBlogPosts - Posts admin récupérés:', allPosts.length);
        } else {
          console.log('👤 useBlogPosts - Mode utilisateur: récupération posts accessibles');
          
          // ÉTAPE 1: Récupérer les albums créés par l'utilisateur
          console.log('📋 ÉTAPE 1 - Albums créés par utilisateur:', effectiveUserId);
          const { data: ownedAlbums, error: ownedError } = await supabase
            .from('blog_albums')
            .select('id, name, author_id')
            .eq('author_id', effectiveUserId);
          
          if (ownedError) {
            console.error('❌ ÉTAPE 1 - Erreur albums possédés:', ownedError);
          }
          
          const ownedAlbumIds = ownedAlbums?.map(album => album.id) || [];
          console.log('✅ ÉTAPE 1 - Albums possédés:', {
            count: ownedAlbumIds.length,
            albumIds: ownedAlbumIds
          });
          
          // ÉTAPE 2: Récupérer les albums avec permissions
          console.log('🔑 ÉTAPE 2 - Albums avec permissions pour:', effectiveUserId);
          const { data: albumPermissions, error: permissionsError } = await supabase
            .from('album_permissions')
            .select('album_id')
            .eq('user_id', effectiveUserId);
          
          if (permissionsError) {
            console.error('❌ ÉTAPE 2 - Erreur permissions:', permissionsError);
          }
          
          const permittedAlbumIds = albumPermissions?.map(p => p.album_id) || [];
          console.log('✅ ÉTAPE 2 - Albums avec permissions:', {
            count: permittedAlbumIds.length,
            albumIds: permittedAlbumIds
          });

          // ÉTAPE 3: Combiner tous les albums accessibles
          const allAccessibleAlbumIds = [...new Set([...ownedAlbumIds, ...permittedAlbumIds])];
          
          console.log('🎯 ÉTAPE 3 - TOUS albums accessibles:', {
            count: allAccessibleAlbumIds.length,
            albumIds: allAccessibleAlbumIds,
            détails: {
              albumsPossédés: ownedAlbumIds.length,
              albumsAvecPermissions: permittedAlbumIds.length,
              totalUnique: allAccessibleAlbumIds.length
            }
          });

          // ÉTAPE 4: Récupérer TOUS les posts publiés des albums accessibles (CORRECTION FINALE)
          if (allAccessibleAlbumIds.length > 0) {
            console.log('📝 ÉTAPE 4 - RÉCUPÉRATION FINALE: Tous posts publiés des albums accessibles');
            
            let postsQuery = supabase
              .from('blog_posts')
              .select(`
                *,
                profiles(id, display_name, email, avatar_url, created_at)
              `)
              .in('album_id', allAccessibleAlbumIds)
              .eq('published', true)
              .order('created_at', { ascending: false });

            console.log('🔧 ÉTAPE 4 - Requête sans filtrage auteur:', {
              albumIds: allAccessibleAlbumIds,
              note: 'AUCUN filtrage par author_id - tous les auteurs inclus'
            });

            // Appliquer les filtres de recherche
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
              console.error('❌ ÉTAPE 4 - Erreur récupération posts:', accessiblePostsError);
            } else if (accessiblePosts) {
              allPosts.push(...accessiblePosts);
              
              console.log('✅ ÉTAPE 4 - TOUS POSTS RÉCUPÉRÉS (CORRECTION FINALE):', {
                count: accessiblePosts.length,
                postsParAuteur: accessiblePosts.reduce((acc, post) => {
                  const authorEmail = post.profiles?.email || 'Email non disponible';
                  if (!acc[authorEmail]) {
                    acc[authorEmail] = 0;
                  }
                  acc[authorEmail]++;
                  return acc;
                }, {} as Record<string, number>),
                postsParAlbum: allAccessibleAlbumIds.map(albumId => {
                  const albumPosts = accessiblePosts.filter(p => p.album_id === albumId);
                  return {
                    albumId,
                    postsCount: albumPosts.length,
                    auteurs: [...new Set(albumPosts.map(p => p.profiles?.email || 'Inconnu'))]
                  };
                }),
                postsDétaillés: accessiblePosts.map(p => ({
                  id: p.id,
                  title: p.title,
                  author_id: p.author_id,
                  author_email: p.profiles?.email,
                  album_id: p.album_id,
                  published: p.published
                }))
              });
            }
          }

          // ÉTAPE 5: Ajouter les posts de l'utilisateur sans album
          console.log('📝 ÉTAPE 5 - Posts utilisateur sans album');
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
            console.error('❌ ÉTAPE 5 - Erreur posts utilisateur:', userPostsError);
          } else if (userPostsWithoutAlbum) {
            userPostsWithoutAlbum.forEach(post => {
              if (!allPosts.find(p => p.id === post.id)) {
                allPosts.push(post);
              }
            });
            console.log('✅ ÉTAPE 5 - Posts utilisateur sans album ajoutés:', userPostsWithoutAlbum.length);
          }

          // Trier par date
          allPosts.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }

        console.log('🏁 useBlogPosts - RÉSULTAT FINAL (TOUS AUTEURS):', {
          totalPosts: allPosts.length,
          userEmail: user.email,
          effectiveUserId,
          isAdmin,
          postsParAuteur: allPosts.reduce((acc, post) => {
            const authorEmail = post.profiles?.email || 'Email non disponible';
            if (!acc[authorEmail]) {
              acc[authorEmail] = [];
            }
            acc[authorEmail].push({
              id: post.id,
              title: post.title,
              album_id: post.album_id
            });
            return acc;
          }, {} as Record<string, any[]>),
          vérificationFinale: 'Tous les posts publiés des albums accessibles doivent être visibles'
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
  }, [user, searchTerm, selectedAlbum, startDate, endDate, getEffectiveUserId, hasRole]);

  return { posts, loading };
};
