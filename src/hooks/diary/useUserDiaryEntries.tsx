
import { supabase } from '@/integrations/supabase/client';
import { DiaryEntryWithAuthor } from '@/types/diary';
import { filterEntriesBySearchTerm } from './utils/diaryFilters';

export const fetchUserDiaryEntries = async (
  effectiveUserId: string,
  searchTerm: string,
  startDate: string,
  endDate: string
): Promise<DiaryEntryWithAuthor[]> => {
  console.log('🔍 Diary - Récupération des entrées pour utilisateur:', effectiveUserId);
  
  // 1. Récupérer les entrées de l'utilisateur effectif
  let userEntriesQuery = supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', effectiveUserId)
    .order('entry_date', { ascending: false });

  // Appliquer les filtres de date
  if (startDate) {
    userEntriesQuery = userEntriesQuery.gte('entry_date', startDate);
  }
  if (endDate) {
    userEntriesQuery = userEntriesQuery.lte('entry_date', endDate);
  }

  const { data: userEntries, error: userEntriesError } = await userEntriesQuery;
  
  if (userEntriesError) {
    console.error('🔍 Diary - Erreur lors de la récupération des entrées utilisateur:', userEntriesError);
    return [];
  }

  console.log('🔍 Diary - Entrées utilisateur trouvées:', { 
    count: userEntries?.length || 0
  });

  // 2. Récupérer les utilisateurs autorisés via les permissions directes
  console.log('🔍 Diary - Vérification des permissions directes pour:', effectiveUserId);
  const { data: directPermissions, error: directPermError } = await supabase
    .from('diary_permissions')
    .select('diary_owner_id')
    .eq('permitted_user_id', effectiveUserId);

  if (directPermError) {
    console.error('🔍 Diary - Erreur permissions directes:', directPermError);
  }

  const directAuthorizedIds = directPermissions?.map(p => p.diary_owner_id) || [];
  console.log('🔍 Diary - Permissions directes trouvées:', directAuthorizedIds);

  // 3. APPROCHE SIMPLIFIÉE : Récupérer les groupes étape par étape
  console.log('🔍 Diary - ÉTAPE 1: Récupération des memberships de groupe');
  
  // D'abord récupérer les memberships de l'utilisateur
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
    
    // CORRECTION: Récupérer les détails des groupes avec une approche plus simple
    const groupIds = userMemberships.map(m => m.group_id);
    console.log('🔍 Diary - Group IDs à rechercher:', groupIds);
    
    const { data: groupDetails, error: groupDetailsError } = await supabase
      .from('invitation_groups')
      .select('id, created_by, name')
      .in('id', groupIds);

    if (groupDetailsError) {
      console.error('🔍 Diary - Erreur détails groupes:', groupDetailsError);
      console.error('🔍 Diary - Détails de l\'erreur:', {
        message: groupDetailsError.message,
        details: groupDetailsError.details,
        hint: groupDetailsError.hint,
        code: groupDetailsError.code
      });
    } else {
      console.log('🔍 Diary - Détails des groupes récupérés avec succès:', {
        count: groupDetails?.length || 0,
        groups: groupDetails?.map(g => ({ id: g.id, created_by: g.created_by, name: g.name }))
      });
    }

    if (groupDetails && groupDetails.length > 0) {
      console.log('🔍 Diary - ÉTAPE 3: Vérification des invitations avec accès journal');
      
      // Pour chaque groupe, vérifier les invitations avec diary_access
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

        // Si des invitations avec accès journal existent, ajouter le créateur du groupe
        if (groupInvitations && groupInvitations.length > 0) {
          const hasValidInvitation = groupInvitations.some(inv => 
            inv.diary_access === true && inv.used_at !== null
          );
          
          if (hasValidInvitation) {
            console.log(`🔍 Diary - ✅ Invitation valide trouvée - Ajout du créateur ${group.created_by}`);
            invitationAuthorizedIds.push(group.created_by);
          } else {
            console.log(`🔍 Diary - ❌ Aucune invitation valide trouvée pour le groupe ${group.id}`);
          }
        } else {
          console.log(`🔍 Diary - ❌ Aucune invitation avec accès journal pour le groupe ${group.id}`);
        }
      }
    } else {
      console.log('🔍 Diary - ❌ Aucun détail de groupe récupéré - Vérification directe des invitations');
      
      // Si la récupération des groupes échoue, essayer une approche directe
      // Récupérer directement les invitations pour les groupes de l'utilisateur
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
          // Ajouter les créateurs des invitations (invited_by)
          const creators = directInvitations.map(inv => inv.invited_by);
          invitationAuthorizedIds.push(...creators);
          console.log(`🔍 Diary - ✅ Ajout des créateurs d'invitations: ${creators.join(', ')}`);
        }
      }
    }
  } else {
    console.log('🔍 Diary - ❌ Aucun membership de groupe trouvé pour l\'utilisateur');
  }

  // Déduplication des IDs autorisés via invitations
  invitationAuthorizedIds = [...new Set(invitationAuthorizedIds)];
  console.log('🔍 Diary - IDs autorisés via invitations (dédupliqués):', invitationAuthorizedIds);

  // 4. Combiner tous les IDs autorisés (sauf l'utilisateur effectif lui-même)
  const allAuthorizedIds = [...new Set([...directAuthorizedIds, ...invitationAuthorizedIds])]
    .filter(id => id !== effectiveUserId);
  
  console.log('🔍 Diary - RÉSULTAT FINAL - Tous les utilisateurs autorisés:', {
    directPermissions: directAuthorizedIds,
    invitationPermissions: invitationAuthorizedIds,
    combined: allAuthorizedIds,
    effectiveUserId: effectiveUserId
  });

  let otherEntries: any[] = [];

  // 5. Récupérer les entrées des autres utilisateurs autorisés
  if (allAuthorizedIds.length > 0) {
    console.log('🔍 Diary - Récupération des entrées des utilisateurs autorisés:', allAuthorizedIds);
    
    // CORRECTION: Vérifier d'abord combien d'entrées existent pour ces utilisateurs
    const { data: countCheck, error: countError } = await supabase
      .from('diary_entries')
      .select('user_id, id, title, entry_date')
      .in('user_id', allAuthorizedIds);

    if (countError) {
      console.error('🔍 Diary - Erreur lors de la vérification du nombre d\'entrées:', countError);
    } else {
      console.log('🔍 Diary - Vérification des entrées existantes:', {
        totalEntries: countCheck?.length || 0,
        entriesByUser: countCheck?.reduce((acc, entry) => {
          acc[entry.user_id] = (acc[entry.user_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
        sampleEntries: countCheck?.slice(0, 3).map(e => ({
          user_id: e.user_id,
          id: e.id,
          title: e.title,
          entry_date: e.entry_date
        })) || []
      });
    }
    
    let otherEntriesQuery = supabase
      .from('diary_entries')
      .select('*')
      .in('user_id', allAuthorizedIds)
      .order('entry_date', { ascending: false });

    // Appliquer les filtres de date
    if (startDate) {
      otherEntriesQuery = otherEntriesQuery.gte('entry_date', startDate);
    }
    if (endDate) {
      otherEntriesQuery = otherEntriesQuery.lte('entry_date', endDate);
    }

    const { data: otherEntriesData, error: otherEntriesError } = await otherEntriesQuery;
    
    if (otherEntriesError) {
      console.error('🔍 Diary - Erreur lors de la récupération des autres entrées:', otherEntriesError);
    } else {
      otherEntries = otherEntriesData || [];
      console.log('🔍 Diary - Autres entrées trouvées:', { 
        count: otherEntries.length,
        fromUsers: [...new Set(otherEntries.map(e => e.user_id))],
        entriesByUser: otherEntries.reduce((acc, entry) => {
          const userId = entry.user_id;
          acc[userId] = (acc[userId] || []).concat([{ id: entry.id, title: entry.title }]);
          return acc;
        }, {} as Record<string, any[]>)
      });
    }
  } else {
    console.log('🔍 Diary - Aucun autre utilisateur autorisé trouvé');
  }

  // 6. Combiner toutes les entrées
  const allEntries = [...(userEntries || []), ...otherEntries];
  console.log('🔍 Diary - Total entrées combinées:', {
    userEntriesCount: userEntries?.length || 0,
    otherEntriesCount: otherEntries.length,
    totalCount: allEntries.length
  });
  
  // 7. Trier par date d'entrée (plus récent en premier)
  allEntries.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());

  // 8. Récupérer tous les profils nécessaires
  const allUserIds = [...new Set(allEntries.map(entry => entry.user_id))];
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url, created_at')
    .in('id', allUserIds);

  // 9. Filtrage côté client pour le terme de recherche
  const finalEntries = filterEntriesBySearchTerm(allEntries, searchTerm, allProfiles || []);
  
  console.log('🔍 Diary - Entrées finales après filtrage:', {
    totalCount: finalEntries.length,
    searchTerm: searchTerm,
    entriesByUser: finalEntries.reduce((acc, entry) => {
      const userId = entry.user_id;
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  });
  
  return finalEntries;
};
