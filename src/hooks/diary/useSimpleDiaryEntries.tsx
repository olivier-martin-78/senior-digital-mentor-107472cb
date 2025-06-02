
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
        .select('*')
        .order('entry_date', { ascending: false });

      // Appliquer les filtres de date si présents
      if (startDate) {
        query = query.gte('entry_date', startDate);
      }
      if (endDate) {
        query = query.lte('entry_date', endDate);
      }

      const { data: entriesData, error } = await query;
      
      if (error) {
        console.error('🔍 Diary Simple - Erreur lors de la récupération:', error);
        setEntries([]);
        return;
      }

      console.log('🔍 Diary Simple - Entrées récupérées depuis Supabase:', {
        count: entriesData?.length || 0,
        entries: entriesData?.map(e => ({ 
          id: e.id, 
          title: e.title, 
          user_id: e.user_id,
          entry_date: e.entry_date
        }))
      });

      if (!entriesData || entriesData.length === 0) {
        setEntries([]);
        return;
      }

      // Récupérer les profils des auteurs
      const userIds = [...new Set(entriesData.map(entry => entry.user_id))];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, display_name, avatar_url, created_at')
        .in('id', userIds);

      if (profilesError) {
        console.error('🔍 Diary Simple - Erreur lors de la récupération des profils:', profilesError);
        setEntries([]);
        return;
      }

      // Combiner les entrées avec leurs profils
      const entriesWithAuthors: DiaryEntryWithAuthor[] = entriesData.map(entry => {
        const profile = profiles?.find(p => p.id === entry.user_id);
        return {
          ...entry,
          profiles: profile || {
            id: entry.user_id,
            email: 'Utilisateur inconnu',
            display_name: null,
            avatar_url: null,
            created_at: new Date().toISOString()
          }
        };
      });

      let filteredEntries = entriesWithAuthors;

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

      setEntries(filteredEntries);
    } catch (error) {
      console.error('🔍 Diary Simple - Erreur lors du chargement des entrées:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return { entries, loading };
};
