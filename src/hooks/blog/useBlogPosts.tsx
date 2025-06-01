
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
        
        console.log('🚀 useBlogPosts - DÉBUT DIAGNOSTIC FINAL');
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

          // ÉTAPE 5: Récupérer TOUS les posts publiés des albums accessibles - CORRECTION FINALE
          if (uniqueAccessibleAlbumIds.length > 0) {
            console.log('📝 ÉTAPE 5 - CORRECTION FINALE: Récupération TOUS posts publiés des albums accessibles sans aucune restriction d\'auteur');
            
            // REQUÊTE CORRIGÉE: Récupérer TOUS les posts publiés de ces albums
            let postsQuery = supabase
              .from('blog_posts')
              .select(`
                *,
                profiles(id, display_name, email, avatar_url, created_at)
              `)
              .in('album_id', uniqueAccessibleAlbumIds)
              .eq('published', true)  // Seulement les posts publiés
              .order('created_at', { ascending: false });

            console.log('🔧 ÉTAPE 5 - REQUÊTE CORRIGÉE:', {
              albumIds: uniqueAccessibleAlbumIds,
              requête: 'Tous posts publiés des albums accessibles sans filtrage auteur'
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

            console.log('🔍 ÉTAPE 5 - Exécution de la requête...');
            const { data: accessiblePosts, error: accessiblePostsError } = await postsQuery;
            
            if (accessiblePostsError) {
              console.error('❌ ÉTAPE 5 - Erreur posts accessibles:', accessiblePostsError);
            } else if (accessiblePosts) {
              allPosts = accessiblePosts;
              console.log('✅ ÉTAPE 5 - CORRECTION FINALE: TOUS posts récupérés de la base de données:', {
                count: accessiblePosts.length,
                postsParAuteur: accessiblePosts.reduce((acc, post) => {
                  const authorEmail = post.profiles?.email || 'Email non disponible';
                  if (!acc[authorEmail]) {
                    acc[authorEmail] = 0;
                  }
                  acc[authorEmail]++;
                  return acc;
                }, {} as Record<string, number>),
                postsParAlbum: uniqueAccessibleAlbumIds.map(albumId => {
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

              // VÉRIFICATION FINALE: Compter les posts par auteur
              const postsByAuthor = accessiblePosts.reduce((acc, post) => {
                const authorEmail = post.profiles?.email || 'Inconnu';
                if (!acc[authorEmail]) {
                  acc[authorEmail] = [];
                }
                acc[authorEmail].push({
                  id: post.id,
                  title: post.title,
                  album_id: post.album_id
                });
                return acc;
              }, {} as Record<string, any[]>);

              console.log('🔍 VÉRIFICATION FINALE - Posts par auteur récupérés de la DB:', postsByAuthor);
            }
          } else {
            console.log('⚠️ ÉTAPE 5 - Aucun album accessible trouvé');
          }

          // ÉTAPE 6: Ajouter les posts de l'utilisateur qui ne sont dans aucun album (brouillons inclus)
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

        console.log('🏁 useBlogPosts - RÉSULTAT FINAL CORRIGÉ DÉFINITIF:', {
          totalPosts: allPosts.length,
          userEmail: user.email,
          effectiveUserId,
          isAdmin: hasRole('admin'),
          posts: allPosts.map(post => ({
            id: post.id,
            title: post.title,
            author_id: post.author_id,
            author_email: post.profiles?.email || 'Email non disponible',
            album_id: post.album_id,
            published: post.published,
            isOwnPost: post.author_id === effectiveUserId
          })),
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
          DIAGNOSTIC: 'Si vous ne voyez que vos propres posts, le problème est maintenant dans la base de données ou les permissions'
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
