
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

  // 3. Récupérer les utilisateurs autorisés via les invitations avec accès journal
  console.log('🔍 Diary - Vérification des invitations avec accès journal pour:', effectiveUserId);
  const { data: invitationPermissions, error: invitationError } = await supabase
    .from('group_members')
    .select(`
      group_id,
      invitation_groups!inner(
        created_by,
        invitations!inner(
          invited_by,
          diary_access,
          used_at
        )
      )
    `)
    .eq('user_id', effectiveUserId)
    .eq('role', 'guest')
    .eq('invitation_groups.invitations.diary_access', true)
    .not('invitation_groups.invitations.used_at', 'is', null);

  if (invitationError) {
    console.error('🔍 Diary - Erreur invitations avec accès journal:', invitationError);
  }

  // Extraire les IDs des créateurs ayant accordé l'accès journal
  const invitationAuthorizedIds = invitationPermissions?.map(p => p.invitation_groups.created_by) || [];
  console.log('🔍 Diary - Permissions via invitations trouvées:', invitationAuthorizedIds);

  // 4. Combiner tous les IDs autorisés (sauf l'utilisateur effectif lui-même)
  const allAuthorizedIds = [...new Set([...directAuthorizedIds, ...invitationAuthorizedIds])]
    .filter(id => id !== effectiveUserId);
  
  console.log('🔍 Diary - Tous les utilisateurs autorisés:', allAuthorizedIds);

  let otherEntries: any[] = [];

  // 5. Récupérer les entrées des autres utilisateurs autorisés
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
        fromUsers: [...new Set(otherEntries.map(e => e.user_id))]
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
