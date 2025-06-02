
import { supabase } from '@/integrations/supabase/client';

export const fetchOtherUsersEntries = async (
  authorizedUserIds: string[],
  startDate: string,
  endDate: string
) => {
  if (authorizedUserIds.length === 0) {
    console.log('🔍 Diary - Aucun autre utilisateur autorisé trouvé');
    return [];
  }

  console.log('🔍 Diary - Récupération des entrées des utilisateurs autorisés:', authorizedUserIds);
  
  // Vérifier d'abord combien d'entrées existent pour ces utilisateurs
  const { data: countCheck, error: countError } = await supabase
    .from('diary_entries')
    .select('user_id, id, title, entry_date')
    .in('user_id', authorizedUserIds);

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
    .in('user_id', authorizedUserIds)
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
    return [];
  }

  const otherEntries = otherEntriesData || [];
  console.log('🔍 Diary - Autres entrées trouvées:', { 
    count: otherEntries.length,
    fromUsers: [...new Set(otherEntries.map(e => e.user_id))],
    entriesByUser: otherEntries.reduce((acc, entry) => {
      const userId = entry.user_id;
      acc[userId] = (acc[userId] || []).concat([{ id: entry.id, title: entry.title }]);
      return acc;
    }, {} as Record<string, any[]>)
  });

  return otherEntries;
};
