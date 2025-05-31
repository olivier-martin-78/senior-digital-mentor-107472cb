
import { supabase } from '@/integrations/supabase/client';
import { DiaryEntryWithAuthor } from '@/types/diary';
import { filterEntriesBySearchTerm } from './utils/diaryFilters';

export const fetchAdminDiaryEntries = async (
  searchTerm: string,
  startDate: string,
  endDate: string
): Promise<DiaryEntryWithAuthor[]> => {
  console.log('Diary - Mode admin: voir toutes les entrées');
  
  let query = supabase
    .from('diary_entries')
    .select('*')
    .order('entry_date', { ascending: false });

  // Appliquer les filtres de date pour admin
  if (startDate) {
    query = query.gte('entry_date', startDate);
  }
  if (endDate) {
    query = query.lte('entry_date', endDate);
  }

  console.log('Diary - Requête admin construite, exécution...');
  const { data: diaryData, error } = await query;
  
  if (error) {
    console.error('Diary - Erreur requête admin:', error);
    throw error;
  }
  
  console.log('Diary - Réponse admin:', { 
    count: diaryData?.length || 0, 
    searchTerm: searchTerm,
    hasSearchTerm: !!searchTerm
  });
  
  if (diaryData && diaryData.length > 0) {
    // Récupérer les profils séparément
    const userIds = [...new Set(diaryData.map(entry => entry.user_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, display_name, avatar_url, created_at')
      .in('id', userIds);

    if (profilesError) {
      console.error('Diary - Erreur profils admin:', profilesError);
      throw profilesError;
    }

    // Filtrage côté client pour tous les champs (texte ET arrays)
    const filteredEntries = filterEntriesBySearchTerm(diaryData, searchTerm, profilesData || []);
    
    console.log('Diary - Entrées admin récupérées après filtrage:', {
      totalCount: filteredEntries.length,
      searchApplied: !!searchTerm
    });
    
    return filteredEntries;
  } else {
    console.log('Diary - Admin - Aucune entrée trouvée');
    return [];
  }
};
