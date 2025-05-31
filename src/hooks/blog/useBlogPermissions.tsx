
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useBlogPermissions = (effectiveUserId: string) => {
  const { hasRole } = useAuth();
  const [authorizedUserIds, setAuthorizedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!effectiveUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('useBlogPermissions - Utilisation des nouvelles politiques consolidées');
        
        if (hasRole('admin')) {
          // Admins peuvent tout voir, pas besoin de permissions spécifiques
          console.log('useBlogPermissions - Admin: pas de restrictions');
          setAuthorizedUserIds([]);
          setLoading(false);
          return;
        }

        // Avec les nouvelles politiques RLS consolidées, la gestion des permissions
        // est simplifiée car les politiques gèrent automatiquement l'accès
        // Récupérer les utilisateurs autorisés via les groupes d'invitation
        const { data: groupPermissions, error: groupError } = await supabase
          .from('group_members')
          .select(`
            group_id,
            invitation_groups!inner(created_by)
          `)
          .eq('user_id', effectiveUserId);

        if (groupError) {
          console.error('useBlogPermissions - Erreur groupes:', groupError);
          setAuthorizedUserIds([]);
          return;
        }

        // IDs des utilisateurs autorisés via les groupes d'invitation
        const groupCreatorIds = groupPermissions?.map(p => p.invitation_groups.created_by).filter(id => id !== effectiveUserId) || [];
        
        console.log('useBlogPermissions - Utilisateurs autorisés via groupes:', groupCreatorIds);
        setAuthorizedUserIds(groupCreatorIds);
        
      } catch (error) {
        console.error('useBlogPermissions - Erreur lors de la récupération des permissions:', error);
        setAuthorizedUserIds([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [effectiveUserId, hasRole]);

  return { authorizedUserIds, loading };
};
