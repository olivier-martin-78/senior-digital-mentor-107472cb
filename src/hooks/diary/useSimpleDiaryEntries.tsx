
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DiaryEntryWithAuthor } from '@/types/diary';

export const useSimpleDiaryEntries = (searchTerm: string, startDate: string, endDate: string) => {
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
      console.log('🔍 Diary Simple - Début fetchEntries:', {
        searchTerm,
        startDate,
        endDate
      });
      
      // Une seule requête simple qui fait confiance à la politique RLS
      let query = supabase
        .from('diary_entries')
        .select(`
          *,
          profiles!diary_entries_user_id_fkey (
            id, email, display_name, avatar_url, created_at
          )
        `)
        .order('entry_date', { ascending: false });

      // Appliquer les filtres de date si présents
      if (startDate) {
        query = query.gte('entry_date', startDate);
      }
      if (endDate) {
        query = query.lte('entry_date', endDate);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('🔍 Diary Simple - Erreur lors de la récupération:', error);
        setEntries([]);
        return;
      }

      console.log('🔍 Diary Simple - Entrées récupérées depuis Supabase:', {
        count: data?.length || 0,
        entries: data?.map(e => ({ 
          id: e.id, 
          title: e.title, 
          user_id: e.user_id,
          entry_date: e.entry_date,
          author: e.profiles?.display_name || e.profiles?.email 
        }))
      });

      let filteredEntries = data || [];

      // Filtrage côté client pour le terme de recherche uniquement
      if (searchTerm && searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        filteredEntries = filteredEntries.filter(entry => {
          // Recherche dans les champs texte
          const textFields = [
            entry.title,
            entry.activities,
            entry.reflections,
            entry.positive_things,
            entry.negative_things,
            entry.desire_of_day,
            entry.objectives,
            entry.private_notes,
            entry.physical_state,
            entry.mental_state
          ];
          
          const textMatch = textFields.some(field => 
            field && field.toLowerCase().includes(searchLower)
          );
          
          // Recherche dans les arrays
          const tagsMatch = entry.tags?.some(tag => 
            tag && tag.toLowerCase().includes(searchLower)
          ) || false;
          
          const peopleMatch = entry.contacted_people?.some(person => 
            person && person.toLowerCase().includes(searchLower)
          ) || false;
          
          return textMatch || tagsMatch || peopleMatch;
        });

        console.log('🔍 Diary Simple - Après filtrage par terme de recherche:', {
          searchTerm,
          filteredCount: filteredEntries.length
        });
      }

      setEntries(filteredEntries as DiaryEntryWithAuthor[]);
    } catch (error) {
      console.error('🔍 Diary Simple - Erreur lors du chargement des entrées:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return { entries, loading };
};
