import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserRoles {
  [userId: string]: AppRole[];
}

export const useUserRoles = (userIds: string[]) => {
  const [userRoles, setUserRoles] = useState<UserRoles>({});
  const [loading, setLoading] = useState(true);

  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (error) throw error;

      // Organiser les rôles par utilisateur
      const rolesByUser: UserRoles = {};
      userIds.forEach(id => {
        rolesByUser[id] = [];
      });

      data?.forEach(userRole => {
        if (!rolesByUser[userRole.user_id]) {
          rolesByUser[userRole.user_id] = [];
        }
        rolesByUser[userRole.user_id].push(userRole.role);
      });

      setUserRoles(rolesByUser);
    } catch (error) {
      console.error('Erreur lors de la récupération des rôles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userIds.length > 0) {
      fetchUserRoles();
    }
  }, [JSON.stringify(userIds)]);

  return { userRoles, loading, refetch: fetchUserRoles };
};