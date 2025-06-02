
import { supabase } from '@/integrations/supabase/client';
import { DiaryEntryWithAuthor } from '@/types/diary';
import { filterEntriesBySearchTerm } from './utils/diaryFilters';
import { getUserPermissions } from './utils/permissionChecker';
import { fetchUserOwnEntries } from './utils/userEntriesFetcher';
import { fetchOtherUsersEntries } from './utils/otherEntriesFetcher';

export const fetchUserDiaryEntries = async (
  effectiveUserId: string,
  searchTerm: string,
  startDate: string,
  endDate: string
): Promise<DiaryEntryWithAuthor[]> => {
  // 1. Récupérer les entrées de l'utilisateur
  const userEntries = await fetchUserOwnEntries(effectiveUserId, startDate, endDate);

  // 2. Récupérer les permissions pour accéder aux autres journaux
  const { allAuthorizedIds } = await getUserPermissions(effectiveUserId);

  // 3. Récupérer les entrées des autres utilisateurs autorisés
  const otherEntries = await fetchOtherUsersEntries(allAuthorizedIds, startDate, endDate);

  // 4. Combiner toutes les entrées
  const allEntries = [...userEntries, ...otherEntries];
  console.log('🔍 Diary - Total entrées combinées:', {
    userEntriesCount: userEntries.length,
    otherEntriesCount: otherEntries.length,
    totalCount: allEntries.length
  });
  
  // 5. Trier par date d'entrée (plus récent en premier)
  allEntries.sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime());

  // 6. Récupérer tous les profils nécessaires
  const allUserIds = [...new Set(allEntries.map(entry => entry.user_id))];
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, email, display_name, avatar_url, created_at')
    .in('id', allUserIds);

  // 7. Filtrage côté client pour le terme de recherche
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
