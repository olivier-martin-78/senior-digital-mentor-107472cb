
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Profile, AppRole } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ImpersonationState {
  isImpersonating: boolean;
  originalUser: Profile | null;
  impersonatedUser: Profile | null;
  impersonatedRoles: AppRole[];
}

export const useImpersonation = () => {
  const { hasRole } = useAuth();
  const [impersonationState, setImpersonationState] = useState<ImpersonationState>({
    isImpersonating: false,
    originalUser: null,
    impersonatedUser: null,
    impersonatedRoles: []
  });

  const startImpersonation = async (targetUser: Profile): Promise<boolean> => {
    // Vérifier que l'utilisateur actuel est admin
    if (!hasRole('admin')) {
      toast({
        title: "Accès refusé",
        description: "Seuls les administrateurs peuvent utiliser cette fonctionnalité",
        variant: "destructive"
      });
      return false;
    }

    try {
      console.log('🎭 Début impersonnation pour:', targetUser.email);

      // Récupérer les rôles directs de l'utilisateur cible
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', targetUser.id);

      if (rolesError) {
        console.error('❌ Erreur récupération rôles directs:', rolesError);
        throw rolesError;
      }

      let roles = userRoles?.map(r => r.role as AppRole) || [];
      console.log('📋 Rôles directs de l\'utilisateur:', roles);

      // Vérifier si l'utilisateur est membre d'un groupe créé par un admin
      const { data: groupMemberships, error: groupError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          invitation_groups(
            created_by
          )
        `)
        .eq('user_id', targetUser.id);

      if (groupError) {
        console.error('❌ Erreur récupération groupes:', groupError);
      } else if (groupMemberships && groupMemberships.length > 0) {
        console.log('👥 Groupes trouvés:', groupMemberships);

        // Vérifier si un des créateurs de groupe est admin
        for (const membership of groupMemberships) {
          const groupCreatorId = membership.invitation_groups?.created_by;
          if (groupCreatorId) {
            console.log('🔍 Vérification si le créateur du groupe est admin:', groupCreatorId);
            
            const { data: creatorRoles, error: creatorRolesError } = await supabase
              .from('user_roles')
              .select('role')
              .eq('user_id', groupCreatorId);

            if (!creatorRolesError && creatorRoles) {
              const creatorIsAdmin = creatorRoles.some(r => r.role === 'admin');
              if (creatorIsAdmin) {
                console.log('✅ Créateur du groupe est admin - héritage des permissions admin');
                if (!roles.includes('admin')) {
                  roles.push('admin');
                }
                break; // Un seul admin suffit
              }
            }
          }
        }
      }

      console.log('🎯 Rôles finaux (directs + hérités):', roles);

      // Obtenir l'utilisateur actuel depuis le localStorage
      const currentUserData = localStorage.getItem('supabase.auth.user');
      const currentUser = currentUserData ? JSON.parse(currentUserData) : null;

      // Sauvegarder l'état d'impersonnation
      const newState: ImpersonationState = {
        isImpersonating: true,
        originalUser: currentUser,
        impersonatedUser: targetUser,
        impersonatedRoles: roles
      };

      setImpersonationState(newState);
      localStorage.setItem('impersonation_state', JSON.stringify(newState));

      toast({
        title: "Impersonnation activée",
        description: `Vous naviguez maintenant en tant que ${targetUser.display_name || targetUser.email} ${roles.includes('admin') ? '(avec permissions admin héritées)' : ''}`,
        duration: 3000
      });

      return true;
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'impersonnation:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer l'impersonnation",
        variant: "destructive"
      });
      return false;
    }
  };

  const stopImpersonation = () => {
    setImpersonationState({
      isImpersonating: false,
      originalUser: null,
      impersonatedUser: null,
      impersonatedRoles: []
    });
    localStorage.removeItem('impersonation_state');

    toast({
      title: "Impersonnation terminée",
      description: "Vous êtes revenu à votre compte administrateur",
      duration: 2000
    });

    // Recharger la page pour réinitialiser l'état
    window.location.href = '/admin/users';
  };

  // Restaurer l'état d'impersonnation depuis le localStorage au chargement
  const initializeImpersonation = () => {
    const savedState = localStorage.getItem('impersonation_state');
    if (savedState) {
      try {
        const parsedState: ImpersonationState = JSON.parse(savedState);
        setImpersonationState(parsedState);
      } catch (error) {
        console.error('Erreur lors de la restauration de l\'état d\'impersonnation:', error);
        localStorage.removeItem('impersonation_state');
      }
    }
  };

  return {
    impersonationState,
    startImpersonation,
    stopImpersonation,
    initializeImpersonation
  };
};
