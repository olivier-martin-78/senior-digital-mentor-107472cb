
import { supabase } from '@/integrations/supabase/client';

export const fetchUserOwnEntries = async (
  effectiveUserId: string,
  startDate: string,
  endDate: string
) => {
  console.log('🔍 Diary - Récupération des entrées pour utilisateur:', effectiveUserId);
  
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

  return userEntries || [];
};
