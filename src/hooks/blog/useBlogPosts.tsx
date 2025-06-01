
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
        
        console.log('🚀 useBlogPosts - DÉBUT DIAGNOSTIC DÉTAILLÉ');
        console.log('🔍 useBlogPosts - Utilisateur connecté:', {
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
            console.error('❌ useBlogPosts - Erreur Supabase admin:', error);
            throw error;
          }

          allPosts = data || [];
          console.log('✅ useBlogPosts - Posts admin récupérés:', allPosts.length);
        } else {
          console.log('👤 useBlogPosts - Mode utilisateur: récupération albums accessibles');
          
          // ÉTAPE 1: Récupérer les albums créés par l'utilisateur
          console.log('📋 ÉTAPE 1 - Recherche albums créés par utilisateur:', effectiveUserId);
          const { data: ownedAlbums, error: ownedError } = await supabase
            .from('blog_albums')
            .select('id, name, author_id')
            .eq('author_id', effectiveUserId);
          
          if (ownedError) {
            console.error('❌ ÉTAPE 1 - Erreur albums possédés:', ownedError);
          } else {
            console.log('✅ ÉTAPE 1 - Albums créés par l\'utilisateur:', {
              count: ownedAlbums?.length || 0,
              albums: ownedAlbums?.map(a => ({ id: a.id, name: a.name, author_id: a.author_id })) || []
            });
          }
          
          // ÉTAPE 2: Récupérer les permissions d'albums
          console.log('🔑 ÉTAPE 2 - Recherche permissions albums pour utilisateur:', effectiveUserId);
          const { data: albumPermissions, error: permissionsError } = await supabase
            .from('album_permissions')
            .select('album_id, user_id')
            .eq('user_id', effectiveUserId);
          
          if (permissionsError) {
            console.error('❌ ÉTAPE 2 - Erreur permissions albums:', permissionsError);
          } else {
            console.log('✅ ÉTAPE 2 - Permissions albums trouvées:', {
              count: albumPermissions?.length || 0,
              permissions: albumPermissions?.map(p => ({ album_id: p.album_id, user_id: p.user_id })) || []
            });
          }

          // ÉTAPE 3: Récupérer les détails des albums avec permissions
          let permittedAlbumsDetails: any[] = [];
          if (albumPermissions && albumPermissions.length > 0) {
            console.log('🔍 ÉTAPE 3 - Récupération détails albums avec permissions');
            const permittedAlbumIds = albumPermissions.map(p => p.album_id);
            
            const { data: albumsDetails, error: albumsDetailsError } = await supabase
              .from('blog_albums')
              .select('id, name, author_id')
              .in('id', permittedAlbumIds);
            
            if (albumsDetailsError) {
              console.error('❌ ÉTAPE 3 - Erreur détails albums:', albumsDetailsError);
            } else {
              permittedAlbumsDetails = albumsDetails || [];
              console.log('✅ ÉTAPE 3 - Détails albums avec permissions:', {
                count: permittedAlbumsDetails.length,
                albums: permittedAlbumsDetails.map(a => ({ id: a.id, name: a.name, author_id: a.author_id }))
              });
            }
          }

          // ÉTAPE 4: Combiner tous les albums accessibles
          const accessibleAlbumIds: string[] = [];
          
          // Ajouter albums possédés
          if (ownedAlbums) {
            accessibleAlbumIds.push(...ownedAlbums.map(album => album.id));
          }
          
          // Ajouter albums avec permissions
          if (permittedAlbumsDetails) {
            accessibleAlbumIds.push(...permittedAlbumsDetails.map(album => album.id));
          }
          
          // Supprimer les doublons
          const uniqueAccessibleAlbumIds = [...new Set(accessibleAlbumIds)];
          
          console.log('🎯 ÉTAPE 4 - Albums accessibles finaux:', {
            count: uniqueAccessibleAlbumIds.length,
            albumIds: uniqueAccessibleAlbumIds,
            détails: {
              albumsPossédés: ownedAlbums?.length || 0,
              albumsAvecPermissions: permittedAlbumsDetails.length,
              totalUnique: uniqueAccessibleAlbumIds.length
            }
          });

          // Vérification spécifique pour les albums "Tiago" et "Papy & Mamie"
          const allAccessibleAlbums = [
            ...(ownedAlbums || []),
            ...permittedAlbumsDetails
          ];
          const tiaoAlbum = allAccessibleAlbums.find(album => album.name.toLowerCase().includes('tiago'));
          const papyMamieAlbum = allAccessibleAlbums.find(album => album.name.toLowerCase().includes('papy') || album.name.toLowerCase().includes('mamie'));
          
          console.log('🔍 VÉRIFICATION SPÉCIFIQUE - Albums Tiago et Papy & Mamie:', {
            tiaoTrouvé: !!tiaoAlbum,
            tiaoAlbum: tiaoAlbum ? { id: tiaoAlbum.id, name: tiaoAlbum.name, author_id: tiaoAlbum.author_id } : null,
            papyMamieTrouvé: !!papyMamieAlbum,
            papyMamieAlbum: papyMamieAlbum ? { id: papyMamieAlbum.id, name: papyMamieAlbum.name, author_id: papyMamieAlbum.author_id } : null
          });

          // ÉTAPE 5: Récupérer les posts des albums accessibles
          if (uniqueAccessibleAlbumIds.length > 0) {
            console.log('📝 ÉTAPE 5 - Récupération posts des albums accessibles');
            
            let postsQuery = supabase
              .from('blog_posts')
              .select(`
                *,
                profiles(id, display_name, email, avatar_url, created_at)
              `)
              .in('album_id', uniqueAccessibleAlbumIds)
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
              console.error('❌ ÉTAPE 5 - Erreur posts accessibles:', accessiblePostsError);
            } else if (accessiblePosts) {
              allPosts = accessiblePosts;
              console.log('✅ ÉTAPE 5 - Posts des albums accessibles récupérés:', {
                count: accessiblePosts.length,
                postsParAlbum: uniqueAccessibleAlbumIds.map(albumId => ({
                  albumId,
                  posts: accessiblePosts.filter(p => p.album_id === albumId).map(p => ({
                    id: p.id,
                    title: p.title,
                    author_id: p.author_id,
                    published: p.published
                  }))
                }))
              });

              // Vérification spécifique pour les posts des albums "Tiago" et "Papy & Mamie"
              const tiaoAlbumId = tiaoAlbum?.id;
              const papyMamieAlbumId = papyMamieAlbum?.id;
              
              if (tiaoAlbumId) {
                const tiaoPosts = accessiblePosts.filter(p => p.album_id === tiaoAlbumId);
                console.log('🔍 POSTS ALBUM TIAGO:', {
                  albumId: tiaoAlbumId,
                  albumName: tiaoAlbum.name,
                  postsCount: tiaoPosts.length,
                  posts: tiaoPosts.map(p => ({ id: p.id, title: p.title, published: p.published }))
                });
              }
              
              if (papyMamieAlbumId) {
                const papyMamiePosts = accessiblePosts.filter(p => p.album_id === papyMamieAlbumId);
                console.log('🔍 POSTS ALBUM PAPY & MAMIE:', {
                  albumId: papyMamieAlbumId,
                  albumName: papyMamieAlbum.name,
                  postsCount: papyMamiePosts.length,
                  posts: papyMamiePosts.map(p => ({ id: p.id, title: p.title, published: p.published }))
                });
              }
            }
          } else {
            console.log('⚠️ ÉTAPE 5 - Aucun album accessible trouvé');
          }

          // ÉTAPE 6: Récupérer les posts de l'utilisateur qui ne sont dans aucun album
          console.log('📝 ÉTAPE 6 - Récupération posts utilisateur sans album');
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
            console.error('❌ ÉTAPE 6 - Erreur posts utilisateur sans album:', userPostsError);
          } else if (userPostsWithoutAlbum) {
            // Ajouter les posts sans album en évitant les doublons
            userPostsWithoutAlbum.forEach(post => {
              if (!allPosts.find(p => p.id === post.id)) {
                allPosts.push(post);
              }
            });
            console.log('✅ ÉTAPE 6 - Posts utilisateur sans album ajoutés:', {
              count: userPostsWithoutAlbum.length,
              posts: userPostsWithoutAlbum.map(p => ({ id: p.id, title: p.title }))
            });
          }

          // Trier par date
          allPosts.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        }

        console.log('🏁 useBlogPosts - RÉSULTAT FINAL DIAGNOSTIC:', {
          totalPosts: allPosts.length,
          userEmail: user.email,
          effectiveUserId,
          isAdmin: hasRole('admin'),
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
        console.error('💥 useBlogPosts - Erreur critique lors du chargement des posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, searchTerm, selectedAlbum, startDate, endDate, getEffectiveUserId, hasRole]);

  return { posts, loading };
};
