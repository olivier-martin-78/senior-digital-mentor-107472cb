
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

  // 3. NOUVELLE APPROCHE : Récupérer les groupes de l'utilisateur en deux étapes
  console.log('🔍 Diary - ÉTAPE 1: Récupération des groupes de l\'utilisateur');
  const { data: userGroups, error: groupsError } = await supabase
    .from('group_members')
    .select(`
      group_id,
      role,
      invitation_groups!inner(
        id,
        created_by,
        name
      )
    `)
    .eq('user_id', effectiveUserId)
    .eq('role', 'guest');

  if (groupsError) {
    console.error('🔍 Diary - Erreur lors de la récupération des groupes:', groupsError);
  }

  console.log('🔍 Diary - Groupes trouvés pour l\'utilisateur:', {
    count: userGroups?.length || 0,
    groups: userGroups?.map(g => ({
      group_id: g.group_id,
      creator: g.invitation_groups.created_by,
      name: g.invitation_groups.name
    }))
  });

  let invitationAuthorizedIds: string[] = [];

  if (userGroups && userGroups.length > 0) {
    // 4. ÉTAPE 2: Pour chaque groupe, récupérer les invitations avec accès journal
    console.log('🔍 Diary - ÉTAPE 2: Vérification des invitations pour chaque groupe');
    
    for (const group of userGroups) {
      const groupId = group.group_id;
      const groupCreator = group.invitation_groups.created_by;
      
      console.log(`🔍 Diary - Vérification du groupe ${groupId} créé par ${groupCreator}`);
      
      const { data: groupInvitations, error: invitationsError } = await supabase
        .from('invitations')
        .select('invited_by, diary_access, used_at, email')
        .eq('group_id', groupId)
        .eq('diary_access', true)
        .not('used_at', 'is', null);

      if (invitationsError) {
        console.error(`🔍 Diary - Erreur invitations pour groupe ${groupId}:`, invitationsError);
        continue;
      }

      console.log(`🔍 Diary - Invitations avec accès journal pour groupe ${groupId}:`, {
        count: groupInvitations?.length || 0,
        invitations: groupInvitations?.map(inv => ({
          invited_by: inv.invited_by,
          email: inv.email,
          diary_access: inv.diary_access,
          used_at: inv.used_at
        }))
      });

      // Si des invitations avec accès journal existent, ajouter le créateur du groupe
      if (groupInvitations && groupInvitations.length > 0) {
        console.log(`🔍 Diary - Ajout du créateur ${groupCreator} aux utilisateurs autorisés`);
        invitationAuthorizedIds.push(groupCreator);
      }
    }
  }

  // Déduplication des IDs autorisés via invitations
  invitationAuthorizedIds = [...new Set(invitationAuthorizedIds)];
  console.log('🔍 Diary - IDs autorisés via invitations (dédupliqués):', invitationAuthorizedIds);

  // 5. Combiner tous les IDs autorisés (sauf l'utilisateur effectif lui-même)
  const allAuthorizedIds = [...new Set([...directAuthorizedIds, ...invitationAuthorizedIds])]
    .filter(id => id !== effectiveUserId);
  
  console.log('🔍 Diary - RÉSULTAT FINAL - Tous les utilisateurs autorisés:', {
    directPermissions: directAuthorizedIds,
    invitationPermissions: invitationAuthorizedIds,
    combined: allAuthorizedIds,
    effectiveUserId: effectiveUserId
  });

  let otherEntries: any[] = [];

  // 6. Récupérer les entrées des autres utilisateurs autorisés
  if (allAuthorizedIds.length > 0) {
    console.log('🔍 Diary - Récupération des entrées des utilisateurs autorisés:', allAuthorizedIds);
    
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

  // 7. Combiner toutes les entrées
  const allEntries = [...(userEntries || []), ...otherEntries];
  console.log('🔍 Diary - Total entrées combinées:', {
    userEntriesCount: userEntries?.length || 0,
    otherEntriesCount: otherEntries.length,
    totalCount: allEntries.length
  });
  
  // 8. Trier par date d'entrée (plus récent en premier)
  allEntries.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());

  // 9. Récupérer tous les profils nécessaires
  const allUserIds = [...new Set(allEntries.map(entry => entry.user_id))];
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url, created_at')
    .in('id', allUserIds);

  // 10. Filtrage côté client pour le terme de recherche
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
