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
        
        console.log('🔍 useBlogPosts - DÉBUT - Récupération avec logique applicative stricte');

        const effectiveUserId = getEffectiveUserId();
        console.log('👤 useBlogPosts - Utilisateur courant:', effectiveUserId);

        // 1. Récupérer TOUS les groupes où l'utilisateur est membre avec les détails des groupes
        const { data: userGroupsData, error: userGroupsError } = await supabase
          .from('group_members')
          .select(`
            group_id, 
            role,
            invitation_groups!inner(
              id,
              name,
              created_by
            )
          `)
          .eq('user_id', effectiveUserId);

        if (userGroupsError) {
          console.error('❌ useBlogPosts - Erreur récupération groupes utilisateur:', userGroupsError);
          setPosts([]);
          setLoading(false);
          return;
        }

        console.log('👥 useBlogPosts - Groupes de l\'utilisateur (DÉTAILLÉ):', {
          count: userGroupsData?.length || 0,
          groups: userGroupsData?.map(g => ({
            group_id: g.group_id,
            role: g.role,
            group_name: g.invitation_groups?.name,
            created_by: g.invitation_groups?.created_by
          }))
        });

        const userGroupIds = userGroupsData?.map(g => g.group_id) || [];
        console.log('🎯 useBlogPosts - IDs des groupes:', userGroupIds);

        // 2. Construire la liste des utilisateurs autorisés - TOUJOURS commencer par l'utilisateur courant
        let authorizedUserIds = [effectiveUserId];
        console.log('✅ useBlogPosts - ÉTAPE 1 - Utilisateur courant ajouté:', authorizedUserIds);

        if (userGroupIds.length > 0) {
          // Récupérer TOUS les membres de TOUS les groupes où l'utilisateur est présent
          const { data: groupMembersData, error: groupMembersError } = await supabase
            .from('group_members')
            .select(`
              user_id, 
              group_id, 
              role
            `)
            .in('group_id', userGroupIds);

          if (groupMembersError) {
            console.error('❌ useBlogPosts - Erreur récupération membres groupes:', groupMembersError);
          } else {
            // Récupérer les profils des membres séparément
            const memberUserIds = groupMembersData?.map(gm => gm.user_id) || [];
            const { data: memberProfiles } = await supabase
              .from('profiles')
              .select('id, email, display_name')
              .in('id', memberUserIds);

            console.log('👥 useBlogPosts - TOUS les membres des groupes (DÉTAILLÉ):', {
              count: groupMembersData?.length || 0,
              members: groupMembersData?.map(gm => {
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
            
            // Ajouter TOUS les membres trouvés (y compris le current user)
            const allMemberIds = groupMembersData?.map(gm => gm.user_id) || [];
            
            // Fusionner avec l'utilisateur courant et supprimer les doublons
            authorizedUserIds = [...new Set([effectiveUserId, ...allMemberIds])];
            
            console.log('✅ useBlogPosts - ÉTAPE 2 - Après ajout des membres de groupe:', {
              authorizedUserIds,
              ajoutés: allMemberIds.filter(id => id !== effectiveUserId)
            });
          }
        } else {
          console.log('⚠️ useBlogPosts - Aucun groupe trouvé pour l\'utilisateur');
        }

        console.log('🎯 useBlogPosts - Utilisateurs autorisés FINAL:', {
          count: authorizedUserIds.length,
          userIds: authorizedUserIds,
          currentUser: effectiveUserId
        });

        // 3. Récupérer les posts UNIQUEMENT des utilisateurs autorisés avec les profils complets
        let query = supabase
          .from('blog_posts')
          .select(`
            *,
            profiles!inner(id, display_name, email, avatar_url, created_at, receive_contacts)
          `)
          .in('author_id', authorizedUserIds)
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
        
        console.log('📝 useBlogPosts - Posts récupérés (DÉTAILLÉ):', {
          count: allPosts.length,
          posts: allPosts.map(p => ({
            id: p.id,
            title: p.title,
            author_id: p.author_id,
            author_email: p.profiles?.email,
            author_display: p.profiles?.display_name,
            published: p.published
          }))
        });

        // Vérifier que tous les posts appartiennent bien aux utilisateurs autorisés
        const unauthorizedPosts = allPosts.filter(post => !authorizedUserIds.includes(post.author_id));
        if (unauthorizedPosts.length > 0) {
          console.error('🚨 useBlogPosts - PROBLÈME SÉCURITÉ: Posts non autorisés détectés:', unauthorizedPosts);
        }

        console.log('🏁 useBlogPosts - FIN - Récapitulatif:', {
          authorizedUsers: authorizedUserIds.length,
          postsFound: allPosts.length
        });

        setPosts(allPosts as PostWithAuthor[]);
      } catch (error) {
        console.error('💥 useBlogPosts - Erreur critique:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [user, searchTerm, selectedAlbum, startDate, endDate, getEffectiveUserId]);

  return { posts, loading };
};
