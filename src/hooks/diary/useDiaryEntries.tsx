
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DiaryEntryWithAuthor, DiaryEntry } from '@/types/diary';
import { Profile } from '@/types/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useGroupPermissions } from '../useGroupPermissions';

export const useDiaryEntries = (searchTerm: string, startDate: string, endDate: string) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<DiaryEntryWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const { authorizedUserIds, loading: permissionsLoading } = useGroupPermissions();

  useEffect(() => {
    if (!user) {
      setEntries([]);
      setLoading(false);
      return;
    }

    if (!permissionsLoading) {
      fetchEntries();
    }
  }, [user, searchTerm, startDate, endDate, authorizedUserIds, permissionsLoading]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 useDiaryEntries - Récupération avec permissions de groupe');
      console.log('🎯 useDiaryEntries - Utilisateurs autorisés:', authorizedUserIds);

      if (authorizedUserIds.length === 0) {
        console.log('⚠️ useDiaryEntries - Aucun utilisateur autorisé');
        setEntries([]);
        return;
      }

      // Récupérer les entrées des utilisateurs autorisés
      let query = supabase
        .from('diary_entries')
        .select('*')
        .in('user_id', authorizedUserIds)
        .order('entry_date', { ascending: false });

      if (startDate) {
        query = query.gte('entry_date', startDate);
      }
      if (endDate) {
        query = query.lte('entry_date', endDate);
      }

      const { data: diaryData, error } = await query;
      
      if (error) {
        console.error('❌ useDiaryEntries - Erreur récupération entries:', error);
        throw error;
      }
      
      if (diaryData && diaryData.length > 0) {
        console.log('📓 useDiaryEntries - Entrées récupérées:', diaryData.length);

        // Récupérer les profils des auteurs séparément
        const userIds = [...new Set(diaryData.map(entry => entry.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, display_name, avatar_url, created_at')
          .in('id', userIds);

        if (profilesError) {
          console.error('❌ useDiaryEntries - Erreur récupération profiles:', profilesError);
          throw profilesError;
        }

        // Combiner les données avec typage correct
        const entriesWithAuthors: DiaryEntryWithAuthor[] = diaryData.map((entry: DiaryEntry) => {
          const profile = profilesData?.find((p: Profile) => p.id === entry.user_id);
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

        console.log('🏁 useDiaryEntries - Entrées filtrées finales:', filteredEntries.length);
        setEntries(filteredEntries);
      } else {
        console.log('📓 useDiaryEntries - Aucune entrée trouvée');
        setEntries([]);
      }
    } catch (error) {
      console.error('💥 useDiaryEntries - Erreur critique:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return { entries, loading };
};
