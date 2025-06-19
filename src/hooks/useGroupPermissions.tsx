
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useGroupPermissions = () => {
  const { user, getEffectiveUserId } = useAuth();
  const [authorizedUserIds, setAuthorizedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInvitedUser, setIsInvitedUser] = useState(false);

  const fetchAuthorizedUsers = useCallback(async () => {
    if (!user) {
      setAuthorizedUserIds([]);
      setIsInvitedUser(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const effectiveUserId = getEffectiveUserId();
      
      console.log('🔍 useGroupPermissions - CORRECTION BIDIRECTIONNELLE - Récupération pour:', effectiveUserId);

      // Initialiser avec l'utilisateur courant
      let authorizedUsers = [effectiveUserId];

      // Vérifier si l'utilisateur est un invité (membre d'un groupe avec rôle 'guest')
      const { data: userGroupMemberships, error: userGroupsError } = await supabase
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
        console.error('❌ useGroupPermissions - Erreur récupération groupes comme membre:', userGroupsError);
      }

      // Déterminer si l'utilisateur est invité (a le rôle 'guest' dans au moins un groupe)
      const isGuest = userGroupMemberships?.some(membership => membership.role === 'guest') || false;
      setIsInvitedUser(isGuest);

      // 2. Récupérer AUSSI les groupes créés par l'utilisateur
      const { data: createdGroups, error: createdGroupsError } = await supabase
        .from('invitation_groups')
        .select('id, name, created_by')
        .eq('created_by', effectiveUserId);

      if (createdGroupsError) {
        console.error('❌ useGroupPermissions - Erreur récupération groupes créés:', createdGroupsError);
      }

      // Combiner tous les groupes (membre + créateur)
      let allGroupIds: string[] = [];
      
      if (userGroupMemberships && userGroupMemberships.length > 0) {
        const memberGroupIds = userGroupMemberships.map(gm => gm.group_id);
        allGroupIds.push(...memberGroupIds);
        console.log('✅ useGroupPermissions - Groupes comme membre:', memberGroupIds.length);
      }

      if (createdGroups && createdGroups.length > 0) {
        const createdGroupIds = createdGroups.map(g => g.id);
        allGroupIds.push(...createdGroupIds);
        console.log('✅ useGroupPermissions - Groupes créés:', createdGroupIds.length);
      }

      // Supprimer les doublons
      allGroupIds = [...new Set(allGroupIds)];

      if (allGroupIds.length > 0) {
        console.log('🎯 useGroupPermissions - TOUS les groupes liés à l\'utilisateur:', allGroupIds);
        
        // 3. Récupérer TOUS les membres de TOUS ces groupes
        const { data: allGroupMembers, error: membersError } = await supabase
          .from('group_members')
          .select('user_id, group_id')
          .in('group_id', allGroupIds);

        if (membersError) {
          console.error('❌ useGroupPermissions - Erreur récupération membres:', membersError);
        } else if (allGroupMembers) {
          // Ajouter tous les membres des groupes
          for (const member of allGroupMembers) {
            if (!authorizedUsers.includes(member.user_id)) {
              authorizedUsers.push(member.user_id);
            }
          }
          console.log('👥 useGroupPermissions - Membres ajoutés:', allGroupMembers.length);
        }

        // 4. Ajouter aussi TOUS les créateurs des groupes où l'utilisateur est membre
        if (userGroupMemberships) {
          for (const membership of userGroupMemberships) {
            const groupCreator = membership.invitation_groups?.created_by;
            if (groupCreator && !authorizedUsers.includes(groupCreator)) {
              authorizedUsers.push(groupCreator);
              console.log('👑 useGroupPermissions - Créateur de groupe ajouté:', groupCreator);
            }
          }
        }

        // 5. Ajouter TOUS les membres des groupes créés par l'utilisateur
        if (createdGroups) {
          for (const group of createdGroups) {
            const { data: groupMembers } = await supabase
              .from('group_members')
              .select('user_id')
              .eq('group_id', group.id);

            if (groupMembers) {
              for (const member of groupMembers) {
                if (!authorizedUsers.includes(member.user_id)) {
                  authorizedUsers.push(member.user_id);
                  console.log('👤 useGroupPermissions - Membre du groupe créé ajouté:', member.user_id);
                }
              }
            }
          }
        }
      } else {
        console.log('🔍 useGroupPermissions - Aucun groupe trouvé pour cet utilisateur');
      }

      console.log('🎯 useGroupPermissions - FINAL (BIDIRECTIONNEL):', {
        count: authorizedUsers.length,
        userIds: authorizedUsers,
        currentUser: effectiveUserId,
        isInvitedUser: isGuest
      });

      setAuthorizedUserIds(authorizedUsers);
    } catch (error) {
      console.error('💥 useGroupPermissions - Erreur critique:', error);
      setAuthorizedUserIds([getEffectiveUserId()]);
      setIsInvitedUser(false);
    } finally {
      setLoading(false);
    }
  }, [user, getEffectiveUserId]);

  useEffect(() => {
    fetchAuthorizedUsers();
  }, [fetchAuthorizedUsers]);

  return { authorizedUserIds, loading, isInvitedUser, refetch: fetchAuthorizedUsers };
};
