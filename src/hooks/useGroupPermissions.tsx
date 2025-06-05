
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
      
      console.log('🔍 useGroupPermissions - Récupération des utilisateurs autorisés');

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

      // 2. Construire la liste des utilisateurs autorisés
      let authorizedUsers = [effectiveUserId]; // Toujours inclure l'utilisateur courant

      if (userGroupMemberships && userGroupMemberships.length > 0) {
        console.log('✅ useGroupPermissions - Utilisateur dans des groupes:', userGroupMemberships.length);
        
        // Pour chaque groupe, ajouter le créateur du groupe ET tous les membres
        for (const membership of userGroupMemberships) {
          const groupCreator = membership.invitation_groups?.created_by;
          if (groupCreator && !authorizedUsers.includes(groupCreator)) {
            authorizedUsers.push(groupCreator);
            console.log('✅ useGroupPermissions - Ajout du créateur du groupe:', groupCreator);
          }
        }

        // Récupérer tous les membres des groupes où l'utilisateur est présent
        const groupIds = userGroupMemberships.map(g => g.group_id);
        const { data: allGroupMembers } = await supabase
          .from('group_members')
          .select('user_id')
          .in('group_id', groupIds);

        if (allGroupMembers) {
          for (const member of allGroupMembers) {
            if (!authorizedUsers.includes(member.user_id)) {
              authorizedUsers.push(member.user_id);
            }
          }
        }
      } else {
        console.log('🔍 useGroupPermissions - Utilisateur dans AUCUN groupe - accès limité à ses propres contenus');
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
