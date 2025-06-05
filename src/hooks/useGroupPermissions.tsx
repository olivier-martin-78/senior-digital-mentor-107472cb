
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useGroupPermissions = () => {
  const { user, getEffectiveUserId } = useAuth();
  const [authorizedUserIds, setAuthorizedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAuthorizedUsers = useCallback(async () => {
    if (!user) {
      setAuthorizedUserIds([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const effectiveUserId = getEffectiveUserId();
      
      console.log('🔍 useGroupPermissions - Récupération des utilisateurs autorisés pour:', effectiveUserId);

      // Initialiser avec l'utilisateur courant
      let authorizedUsers = [effectiveUserId];

      // 1. Récupérer les groupes où l'utilisateur est membre
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
        console.error('❌ useGroupPermissions - Erreur récupération groupes:', userGroupsError);
        setAuthorizedUserIds([effectiveUserId]);
        setLoading(false);
        return;
      }

      if (userGroupMemberships && userGroupMemberships.length > 0) {
        console.log('✅ useGroupPermissions - Groupes trouvés:', userGroupMemberships.length);
        
        // Récupérer tous les membres de tous les groupes où l'utilisateur est présent
        const groupIds = userGroupMemberships.map(gm => gm.group_id);
        
        const { data: allGroupMembers, error: membersError } = await supabase
          .from('group_members')
          .select('user_id')
          .in('group_id', groupIds);

        if (membersError) {
          console.error('❌ useGroupPermissions - Erreur récupération membres:', membersError);
        } else if (allGroupMembers) {
          // Ajouter tous les membres des groupes
          for (const member of allGroupMembers) {
            if (!authorizedUsers.includes(member.user_id)) {
              authorizedUsers.push(member.user_id);
            }
          }
        }

        // Ajouter aussi les créateurs des groupes
        for (const membership of userGroupMemberships) {
          const groupCreator = membership.invitation_groups?.created_by;
          if (groupCreator && !authorizedUsers.includes(groupCreator)) {
            authorizedUsers.push(groupCreator);
          }
        }
      } else {
        console.log('🔍 useGroupPermissions - Aucun groupe trouvé pour cet utilisateur');
      }

      console.log('🎯 useGroupPermissions - Utilisateurs autorisés FINAL:', {
        count: authorizedUsers.length,
        userIds: authorizedUsers
      });

      setAuthorizedUserIds(authorizedUsers);
    } catch (error) {
      console.error('💥 useGroupPermissions - Erreur critique:', error);
      setAuthorizedUserIds([getEffectiveUserId()]);
    } finally {
      setLoading(false);
    }
  }, [user, getEffectiveUserId]);

  useEffect(() => {
    fetchAuthorizedUsers();
  }, [fetchAuthorizedUsers]);

  return { authorizedUserIds, loading, refetch: fetchAuthorizedUsers };
};
