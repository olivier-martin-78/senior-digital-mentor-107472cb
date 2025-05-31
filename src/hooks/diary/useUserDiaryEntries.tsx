
import { supabase } from '@/integrations/supabase/client';
import { DiaryEntryWithAuthor } from '@/types/diary';
import { filterEntriesBySearchTerm } from './utils/diaryFilters';

export const fetchUserDiaryEntries = async (
  effectiveUserId: string,
  searchTerm: string,
  startDate: string,
  endDate: string
): Promise<DiaryEntryWithAuthor[]> => {
  console.log('🔍 Diary - Récupération des entrées utilisateur effectif:', effectiveUserId);
  
  // Récupérer TOUTES les entrées de l'utilisateur (sans filtre de recherche SQL)
  let userEntriesQuery = supabase
    .from('diary_entries')
    .select('*')
    .eq('user_id', effectiveUserId)
    .order('entry_date', { ascending: false });

  console.log('🔍 Diary - Requête utilisateur effectif construite, filtres:', {
    searchTerm,
    startDate,
    endDate,
    userId: effectiveUserId
  });

  // Appliquer seulement les filtres de date via SQL
  if (startDate) {
    userEntriesQuery = userEntriesQuery.gte('entry_date', startDate);
    console.log('Diary - Filtre date début appliqué:', startDate);
  }
  if (endDate) {
    userEntriesQuery = userEntriesQuery.lte('entry_date', endDate);
    console.log('Diary - Filtre date fin appliqué:', endDate);
  }

  console.log('🔍 Diary - Exécution requête utilisateur effectif...');
  const { data: userEntries, error: userEntriesError } = await userEntriesQuery;
  
  if (userEntriesError) {
    console.error('🔍 Diary - Erreur lors de la récupération des entrées utilisateur:', userEntriesError);
    return [];
  }

  console.log('🔍 Diary - Réponse entrées utilisateur effectif:', { 
    count: userEntries?.length || 0, 
    searchTerm: searchTerm,
    hasSearchTerm: !!searchTerm
  });

  // Récupérer les utilisateurs autorisés via les groupes d'invitation
  console.log('Diary - Récupération des groupes pour utilisateur effectif:', effectiveUserId);
  const { data: groupPermissions, error: groupError } = await supabase
    .from('group_members')
    .select(`
      group_id,
      invitation_groups!inner(created_by)
    `)
    .eq('user_id', effectiveUserId);

  if (groupError) {
    console.error('Diary - Erreur groupes:', groupError);
    // En cas d'erreur, au moins retourner les entrées de l'utilisateur
    if (userEntries && userEntries.length > 0) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url, created_at')
        .eq('id', effectiveUserId)
        .single();

      const filteredUserEntries = filterEntriesBySearchTerm(
        userEntries, 
        searchTerm, 
        userProfile ? [userProfile] : []
      );
      
      console.log('Diary - Retour entrées utilisateur seulement après erreur groupes:', filteredUserEntries.length);
      return filteredUserEntries;
    } else {
      return [];
    }
  }

  console.log('Diary - Réponse groupes:', groupPermissions);

  // IDs des utilisateurs autorisés via les groupes d'invitation (créateurs des groupes)
  const groupCreatorIds = groupPermissions?.map(p => p.invitation_groups.created_by).filter(id => id !== effectiveUserId) || [];
  
  console.log('Diary - Utilisateurs autorisés via groupes:', groupCreatorIds);

  let otherEntries: any[] = [];

  // Récupérer les entrées des autres utilisateurs autorisés
  if (groupCreatorIds.length > 0) {
    console.log('Diary - Récupération des autres entrées pour:', groupCreatorIds);
    let otherEntriesQuery = supabase
      .from('diary_entries')
      .select('*')
      .in('user_id', groupCreatorIds)
      .order('entry_date', { ascending: false });

    // Appliquer seulement les filtres de date
    if (startDate) {
      otherEntriesQuery = otherEntriesQuery.gte('entry_date', startDate);
    }
    if (endDate) {
      otherEntriesQuery = otherEntriesQuery.lte('entry_date', endDate);
    }

    console.log('Diary - Exécution requête autres entrées...');
    const { data: otherEntriesData, error: otherEntriesError } = await otherEntriesQuery;
    
    if (otherEntriesError) {
      console.error('Diary - Erreur lors de la récupération des autres entrées:', otherEntriesError);
    } else {
      otherEntries = otherEntriesData || [];
      console.log('Diary - Réponse autres entrées:', { 
        count: otherEntries.length,
        searchTerm: searchTerm
      });
    }
  } else {
    console.log('Diary - Aucun autre utilisateur autorisé, pas de requête supplémentaire');
  }

  // Combiner ses entrées avec les entrées autorisées des autres
  const allEntries = [...(userEntries || []), ...otherEntries];
  console.log('Diary - Combinaison des entrées:', {
    userEntriesCount: userEntries?.length || 0,
    otherEntriesCount: otherEntries.length,
    totalCount: allEntries.length,
    searchTerm: searchTerm,
    hasSearchTerm: !!searchTerm
  });
  
  // Trier par date d'entrée (plus récent en premier)
  allEntries.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());

  // Récupérer tous les profils nécessaires
  const allUserIds = [...new Set(allEntries.map(entry => entry.user_id))];
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url, created_at')
    .in('id', allUserIds);

  // Filtrage côté client pour TOUS les champs
  const finalEntries = filterEntriesBySearchTerm(allEntries, searchTerm, allProfiles || []);
  
  console.log('🔍 Diary - Total entrées finales:', {
    totalCount: finalEntries.length,
    searchTerm: searchTerm,
    hasSearchTerm: !!searchTerm
  });
  
  return finalEntries;
};
