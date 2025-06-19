
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

        // Récupérer les utilisateurs autorisés via les groupes
        const authorizedUserIds = await getAuthorizedUserIds(effectiveUserId);
        
        // Filtrer les posts selon les permissions
        let filteredPosts = allPosts.filter(post => {
          return authorizedUserIds.includes(post.author_id);
        });

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

// Fonction helper pour récupérer les utilisateurs autorisés
const getAuthorizedUserIds = async (currentUserId: string): Promise<string[]> => {
  try {
    // Commencer par l'utilisateur courant
    let authorizedUsers = [currentUserId];

    // Récupérer TOUS les groupes où l'utilisateur est membre
    const { data: userGroups, error: userGroupsError } = await supabase
      .from('group_members')
      .select(`
        group_id,
        role,
        invitation_groups!inner(id, name, created_by)
      `)
      .eq('user_id', currentUserId);

    if (userGroupsError) {
      console.error('❌ Erreur récupération groupes utilisateur:', userGroupsError);
      return authorizedUsers;
    }

    console.log('👥 Groupes de l\'utilisateur:', userGroups?.length || 0);

    if (userGroups && userGroups.length > 0) {
      const groupIds = userGroups.map(g => g.group_id);
      
      // Récupérer TOUS les membres de TOUS ces groupes
      const { data: allMembers, error: membersError } = await supabase
        .from('group_members')
        .select('user_id, group_id, role')
        .in('group_id', groupIds);

      if (membersError) {
        console.error('❌ Erreur récupération membres:', membersError);
      } else if (allMembers) {
        // Ajouter tous les membres trouvés
        const memberIds = allMembers.map(m => m.user_id);
        authorizedUsers = [...new Set([...authorizedUsers, ...memberIds])];
        console.log('✅ Membres ajoutés via groupes:', memberIds.length);
      }

      // Ajouter les créateurs des groupes
      for (const group of userGroups) {
        const creatorId = group.invitation_groups?.created_by;
        if (creatorId && !authorizedUsers.includes(creatorId)) {
          authorizedUsers.push(creatorId);
          console.log('👑 Créateur de groupe ajouté:', creatorId);
        }
      }
    }

    // Récupérer aussi les groupes créés par l'utilisateur
    const { data: createdGroups, error: createdGroupsError } = await supabase
      .from('invitation_groups')
      .select('id, name, created_by')
      .eq('created_by', currentUserId);

    if (createdGroupsError) {
      console.error('❌ Erreur récupération groupes créés:', createdGroupsError);
    } else if (createdGroups && createdGroups.length > 0) {
      console.log('🏗️ Groupes créés par l\'utilisateur:', createdGroups.length);
      
      // Ajouter tous les membres des groupes créés
      for (const group of createdGroups) {
        const { data: groupMembers } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', group.id);

        if (groupMembers) {
          for (const member of groupMembers) {
            if (!authorizedUsers.includes(member.user_id)) {
              authorizedUsers.push(member.user_id);
              console.log('👤 Membre du groupe créé ajouté:', member.user_id);
            }
          }
        }
      }
    }

    console.log('🎯 Utilisateurs autorisés FINAL:', {
      count: authorizedUsers.length,
      userIds: authorizedUsers
    });

    return authorizedUsers;
  } catch (error) {
    console.error('💥 Erreur récupération utilisateurs autorisés:', error);
    return [currentUserId];
  }
};
