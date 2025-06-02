
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DiaryEntryWithAuthor } from '@/types/diary';
import { supabase } from '@/integrations/supabase/client';

export const useDiaryEntries = (searchTerm: string, startDate: string, endDate: string) => {
  const { session } = useAuth();
  const [entries, setEntries] = useState<DiaryEntryWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    
    fetchEntries();
  }, [session, searchTerm, startDate, endDate]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      
      // Construire la requête avec filtres de date
      let query = supabase
        .from('diary_entries')
        .select('*')
        .order('entry_date', { ascending: false });

      if (startDate) {
        query = query.gte('entry_date', startDate);
      }
      if (endDate) {
        query = query.lte('entry_date', endDate);
      }

      const { data: diaryData, error } = await query;
      
      if (error) throw error;
      
      if (diaryData && diaryData.length > 0) {
        // Récupérer les profils des auteurs
        const userIds = [...new Set(diaryData.map(entry => entry.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, display_name, avatar_url, created_at')
          .in('id', userIds);

        // Combiner les données
        const entriesWithAuthors = diaryData.map(entry => ({
          ...entry,
          profiles: profilesData?.find(profile => profile.id === entry.user_id) || null
        }));

        // Filtrage côté client pour le terme de recherche
        let filteredEntries = entriesWithAuthors;
        if (searchTerm) {
          const lowercaseSearch = searchTerm.toLowerCase();
          filteredEntries = entriesWithAuthors.filter(entry => {
            return (
              entry.title?.toLowerCase().includes(lowercaseSearch) ||
              entry.activities?.toLowerCase().includes(lowercaseSearch) ||
              entry.reflections?.toLowerCase().includes(lowercaseSearch) ||
              entry.tags?.some(tag => tag.toLowerCase().includes(lowercaseSearch)) ||
              entry.profiles?.email?.toLowerCase().includes(lowercaseSearch) ||
              entry.profiles?.display_name?.toLowerCase().includes(lowercaseSearch)
            );
          });
        }

        setEntries(filteredEntries);
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des entrées:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return { entries, loading };
};
