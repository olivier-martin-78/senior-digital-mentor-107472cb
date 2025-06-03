
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BlogPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  album_id: string | null;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
  published: boolean;
  profiles: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    created_at: string;
  };
}

interface BlogAlbum {
  id: string;
  name: string;
  author_id: string;
  thumbnail_url: string | null;
  description: string;
  created_at: string;
  profiles: {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    created_at: string;
  };
}

export const useBlogData = (
  searchTerm: string, 
  selectedAlbum: string, 
  startDate: string, 
  endDate: string,
  selectedCategories: string[] | null
) => {
  const { user, hasRole, getEffectiveUserId } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [albums, setAlbums] = useState<BlogAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCreatePermission, setHasCreatePermission] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) {
      console.log('🚫 useBlogData - Pas d\'utilisateur connecté');
      setPosts([]);
      setAlbums([]);
      setLoading(false);
      return;
    }

    console.log('🔍 useBlogData - DÉBUT - Récupération avec logique applicative stricte');
    setLoading(true);

    try {
      const effectiveUserId = getEffectiveUserId();
      console.log('👤 useBlogData - Utilisateur courant:', effectiveUserId);
      
      // 1. NOUVEAU DÉBOGAGE : Récupérer d'abord TOUS les groupes et leurs membres
      console.log('🔍 useBlogData - DÉBOGAGE COMPLET DES GROUPES');
      
      const { data: allGroups, error: allGroupsError } = await supabase
        .from('invitation_groups')
        .select('*');
      
      console.log('📋 useBlogData - TOUS les groupes dans la base:', {
        count: allGroups?.length || 0,
        groups: allGroups?.map(g => ({
          id: g.id,
          name: g.name,
          created_by: g.created_by
        }))
      });

      const { data: allGroupMembers, error: allGroupMembersError } = await supabase
        .from('group_members')
        .select('*');
      
      console.log('👥 useBlogData - TOUS les membres de TOUS les groupes:', {
        count: allGroupMembers?.length || 0,
        members: allGroupMembers?.map(gm => ({
          user_id: gm.user_id,
          group_id: gm.group_id,
          role: gm.role
        }))
      });

      // 2. Récupérer DIRECTEMENT les appartenances aux groupes de l'utilisateur
      const { data: userGroupMemberships, error: userGroupsError } = await supabase
        .from('group_members')
        .select('group_id, role')
        .eq('user_id', effectiveUserId);

      if (userGroupsError) {
        console.error('❌ useBlogData - Erreur récupération appartenances groupes:', userGroupsError);
        setPosts([]);
        setAlbums([]);
        setLoading(false);
        return;
      }

      console.log('👥 useBlogData - Appartenances directes aux groupes:', {
        count: userGroupMemberships?.length || 0,
        memberships: userGroupMemberships
      });

      const userGroupIds = userGroupMemberships?.map(g => g.group_id) || [];
      console.log('🎯 useBlogData - IDs des groupes de l\'utilisateur:', userGroupIds);

      // 3. NOUVEAU DÉBOGAGE : Vérifier tous les profils d'utilisateurs
      const { data: allProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, display_name');
      
      console.log('👤 useBlogData - TOUS les profils d\'utilisateurs:', {
        count: allProfiles?.length || 0,
        profiles: allProfiles?.map(p => ({
          id: p.id,
          email: p.email,
          display_name: p.display_name
        }))
      });

      // 4. Construire la liste des utilisateurs autorisés - TOUJOURS commencer par l'utilisateur courant
      let authorizedUserIds = [effectiveUserId];
      console.log('✅ useBlogData - ÉTAPE 1 - Utilisateur courant ajouté:', authorizedUserIds);

      if (userGroupIds.length > 0) {
        // Récupérer TOUS les membres de TOUS les groupes où l'utilisateur est présent
        const { data: allGroupMembers, error: groupMembersError } = await supabase
          .from('group_members')
          .select('user_id, group_id, role')
          .in('group_id', userGroupIds);

        if (groupMembersError) {
          console.error('❌ useBlogData - Erreur récupération membres groupes:', groupMembersError);
        } else {
          console.log('👥 useBlogData - TOUS les membres des groupes partagés:', {
            count: allGroupMembers?.length || 0,
            members: allGroupMembers
          });
          
          // NOUVEAU DÉBOGAGE : Enrichir avec les infos des profils
          if (allGroupMembers && allGroupMembers.length > 0) {
            const memberUserIds = allGroupMembers.map(gm => gm.user_id);
            const { data: memberProfiles } = await supabase
              .from('profiles')
              .select('id, email, display_name')
              .in('id', memberUserIds);

            console.log('👥 useBlogData - Détails des membres des groupes partagés:', {
              members: allGroupMembers.map(gm => {
                const profile = memberProfiles?.find(p => p.id === gm.user_id);
                return {
                  user_id: gm.user_id,
                  group_id: gm.group_id,
                  role: gm.role,
                  email: profile?.email,
                  display_name: profile?.display_name
                };
              })
            });
          }
          
          // Ajouter TOUS les membres trouvés
          const allMemberIds = allGroupMembers?.map(gm => gm.user_id) || [];
          
          // Fusionner avec l'utilisateur courant et supprimer les doublons
          authorizedUserIds = [...new Set([effectiveUserId, ...allMemberIds])];
          
          console.log('✅ useBlogData - ÉTAPE 2 - Après ajout des membres de groupe:', {
            authorizedUserIds,
            ajoutés: allMemberIds.filter(id => id !== effectiveUserId)
          });
        }
      } else {
        console.log('⚠️ useBlogData - Aucun groupe trouvé pour l\'utilisateur');
      }

      console.log('🎯 useBlogData - Utilisateurs autorisés FINAL:', {
        count: authorizedUserIds.length,
        userIds: authorizedUserIds,
        currentUser: effectiveUserId
      });

      // 5. NOUVEAU DÉBOGAGE : Vérifier TOUS les posts existants avant filtrage
      const { data: allPostsDebug, error: allPostsError } = await supabase
        .from('blog_posts')
        .select(`
          *,
          profiles!inner(id, email, display_name, avatar_url, created_at)
        `)
        .order('created_at', { ascending: false });

      console.log('📝 useBlogData - TOUS LES POSTS (avant filtrage):', {
        count: allPostsDebug?.length || 0,
        posts: allPostsDebug?.map(p => ({
          id: p.id,
          title: p.title,
          author_id: p.author_id,
          author_email: p.profiles?.email,
          author_display: p.profiles?.display_name,
          published: p.published
        }))
      });

      // 6. Récupérer les posts UNIQUEMENT des utilisateurs autorisés
      let postsQuery = supabase
        .from('blog_posts')
        .select(`
          *,
          profiles!inner(id, email, display_name, avatar_url, created_at)
        `)
        .in('author_id', authorizedUserIds)
        .order('created_at', { ascending: false });

      // Appliquer les filtres
      if (selectedAlbum) {
        postsQuery = postsQuery.eq('album_id', selectedAlbum);
      }
      if (startDate) {
        postsQuery = postsQuery.gte('created_at', startDate);
      }
      if (endDate) {
        postsQuery = postsQuery.lte('created_at', endDate + 'T23:59:59');
      }
      if (searchTerm) {
        postsQuery = postsQuery.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      const { data: postsData, error: postsError } = await postsQuery;

      if (postsError) {
        console.error('❌ useBlogData - Erreur récupération posts:', postsError);
        setPosts([]);
      } else {
        console.log('📝 useBlogData - Posts récupérés (DÉTAILLÉ):', {
          count: postsData?.length || 0,
          posts: postsData?.map(p => ({
            id: p.id,
            title: p.title,
            author_id: p.author_id,
            author_email: p.profiles?.email,
            author_display: p.profiles?.display_name,
            published: p.published
          }))
        });
        
        // Vérification de sécurité
        const unauthorizedPosts = postsData?.filter(post => !authorizedUserIds.includes(post.author_id)) || [];
        if (unauthorizedPosts.length > 0) {
          console.error('🚨 useBlogData - PROBLÈME SÉCURITÉ: Posts non autorisés détectés:', unauthorizedPosts);
        }
        
        const postsWithProfiles = (postsData || []).map(post => ({
          ...post,
          published: post.published ?? false,
          profiles: post.profiles || {
            id: post.author_id,
            email: 'unknown@example.com',
            display_name: 'Utilisateur inconnu',
            avatar_url: null,
            created_at: new Date().toISOString()
          }
        }));

        setPosts(postsWithProfiles);
      }

      // 7. Récupérer les albums UNIQUEMENT des utilisateurs autorisés
      const { data: albumsData, error: albumsError } = await supabase
        .from('blog_albums')
        .select(`
          *,
          profiles!inner(id, email, display_name, avatar_url, created_at)
        `)
        .in('author_id', authorizedUserIds)
        .order('created_at', { ascending: false });

      if (albumsError) {
        console.error('❌ useBlogData - Erreur récupération albums:', albumsError);
        setAlbums([]);
      } else {
        console.log('📁 useBlogData - Albums récupérés (DÉTAILLÉ):', {
          count: albumsData?.length || 0,
          albums: albumsData?.map(a => ({
            id: a.id,
            name: a.name,
            author_id: a.author_id,
            author_email: a.profiles?.email,
            author_display: a.profiles?.display_name
          }))
        });
        
        const albumsWithProfiles = (albumsData || []).map(album => ({
          ...album,
          description: album.description || '',
          thumbnail_url: album.thumbnail_url,
          profiles: album.profiles || {
            id: album.author_id,
            email: 'unknown@example.com',
            display_name: 'Utilisateur inconnu',
            avatar_url: null,
            created_at: new Date().toISOString()
          }
        }));

        setAlbums(albumsWithProfiles);
      }

      // 8. Déterminer les permissions de création
      setHasCreatePermission(hasRole('admin') || hasRole('editor'));

      console.log('🏁 useBlogData - FIN - Récapitulatif:', {
        authorizedUsers: authorizedUserIds.length,
        postsFound: postsData?.length || 0,
        albumsFound: albumsData?.length || 0
      });

    } catch (error) {
      console.error('💥 useBlogData - Erreur critique:', error);
      setPosts([]);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, [user, searchTerm, selectedAlbum, startDate, endDate, hasRole, getEffectiveUserId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    posts,
    albums,
    loading,
    hasCreatePermission,
    refetch: fetchData
  };
};
