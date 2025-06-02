
import { supabase } from '@/integrations/supabase/client';

export interface UserPermissions {
  directAuthorizedIds: string[];
  invitationAuthorizedIds: string[];
  allAuthorizedIds: string[];
}

export const getUserPermissions = async (effectiveUserId: string): Promise<UserPermissions> => {
  console.log('🔍 Diary - Vérification des permissions directes pour:', effectiveUserId);
  
  // 1. Récupérer les permissions directes
  const { data: directPermissions, error: directPermError } = await supabase
    .from('diary_permissions')
    .select('diary_owner_id')
    .eq('permitted_user_id', effectiveUserId);

  if (directPermError) {
    console.error('🔍 Diary - Erreur permissions directes:', directPermError);
  }

  const directAuthorizedIds = directPermissions?.map(p => p.diary_owner_id) || [];
  console.log('🔍 Diary - Permissions directes trouvées:', directAuthorizedIds);

  // 2. Récupérer les permissions via groupes
  console.log('🔍 Diary - ÉTAPE 1: Récupération des memberships de groupe');
  
  const { data: userMemberships, error: membershipsError } = await supabase
    .from('group_members')
    .select('group_id, role')
    .eq('user_id', effectiveUserId)
    .eq('role', 'guest');

  if (membershipsError) {
    console.error('🔍 Diary - Erreur memberships:', membershipsError);
  }

  console.log('🔍 Diary - Memberships trouvés:', {
    count: userMemberships?.length || 0,
    memberships: userMemberships?.map(m => ({ group_id: m.group_id, role: m.role }))
  });

  let invitationAuthorizedIds: string[] = [];

  if (userMemberships && userMemberships.length > 0) {
    console.log('🔍 Diary - ÉTAPE 2: Récupération des détails des groupes');
    
    const groupIds = userMemberships.map(m => m.group_id);
    console.log('🔍 Diary - Group IDs à rechercher:', groupIds);
    
    const { data: groupDetails, error: groupDetailsError } = await supabase
      .from('invitation_groups')
      .select('id, created_by, name')
      .in('id', groupIds);

    if (groupDetailsError) {
      console.error('🔍 Diary - Erreur détails groupes:', groupDetailsError);
    }

    console.log('🔍 Diary - Détails des groupes récupérés avec succès:', {
      count: groupDetails?.length || 0,
      groups: groupDetails?.map(g => ({ id: g.id, created_by: g.created_by, name: g.name }))
    });

    if (groupDetails && groupDetails.length > 0) {
      console.log('🔍 Diary - ÉTAPE 3: Vérification des invitations avec accès journal');
      
      for (const group of groupDetails) {
        console.log(`🔍 Diary - Vérification du groupe ${group.id} créé par ${group.created_by}`);
        
        const { data: groupInvitations, error: invitationsError } = await supabase
          .from('invitations')
          .select('id, invited_by, email, diary_access, used_at')
          .eq('group_id', group.id)
          .eq('diary_access', true)
          .not('used_at', 'is', null);

        if (invitationsError) {
          console.error(`🔍 Diary - Erreur invitations pour groupe ${group.id}:`, invitationsError);
          continue;
        }

        console.log(`🔍 Diary - Invitations avec accès journal pour groupe ${group.id}:`, {
          count: groupInvitations?.length || 0,
          invitations: groupInvitations?.map(inv => ({
            id: inv.id,
            invited_by: inv.invited_by,
            email: inv.email,
            diary_access: inv.diary_access,
            used_at: inv.used_at
          }))
        });

        if (groupInvitations && groupInvitations.length > 0) {
          const hasValidInvitation = groupInvitations.some(inv => 
            inv.diary_access === true && inv.used_at !== null
          );
          
          if (hasValidInvitation) {
            console.log(`🔍 Diary - ✅ Invitation valide trouvée - Ajout du créateur ${group.created_by}`);
            invitationAuthorizedIds.push(group.created_by);
          }
        }
      }
    } else {
      console.log('🔍 Diary - ❌ Aucun détail de groupe récupéré - Vérification directe des invitations');
      
      for (const membership of userMemberships) {
        console.log(`🔍 Diary - Vérification directe des invitations pour le groupe ${membership.group_id}`);
        
        const { data: directInvitations, error: directInvError } = await supabase
          .from('invitations')
          .select('invited_by, diary_access, used_at')
          .eq('group_id', membership.group_id)
          .eq('diary_access', true)
          .not('used_at', 'is', null);

        if (directInvError) {
          console.error(`🔍 Diary - Erreur invitations directes pour groupe ${membership.group_id}:`, directInvError);
          continue;
        }

        console.log(`🔍 Diary - Invitations directes trouvées pour groupe ${membership.group_id}:`, {
          count: directInvitations?.length || 0,
          invitations: directInvitations
        });

        if (directInvitations && directInvitations.length > 0) {
          const creators = directInvitations.map(inv => inv.invited_by);
          invitationAuthorizedIds.push(...creators);
          console.log(`🔍 Diary - ✅ Ajout des créateurs d'invitations: ${creators.join(', ')}`);
        }
      }
    }
  }

  // Déduplication des IDs autorisés via invitations
  invitationAuthorizedIds = [...new Set(invitationAuthorizedIds)];
  console.log('🔍 Diary - IDs autorisés via invitations (dédupliqués):', invitationAuthorizedIds);

  // Combiner tous les IDs autorisés (sauf l'utilisateur effectif lui-même)
  const allAuthorizedIds = [...new Set([...directAuthorizedIds, ...invitationAuthorizedIds])]
    .filter(id => id !== effectiveUserId);
  
  console.log('🔍 Diary - RÉSULTAT FINAL - Tous les utilisateurs autorisés:', {
    directPermissions: directAuthorizedIds,
    invitationPermissions: invitationAuthorizedIds,
    combined: allAuthorizedIds,
    effectiveUserId: effectiveUserId
  });

  return {
    directAuthorizedIds,
    invitationAuthorizedIds,
    allAuthorizedIds
  };
};
