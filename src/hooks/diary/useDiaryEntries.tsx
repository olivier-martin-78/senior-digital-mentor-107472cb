
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DiaryEntryWithAuthor } from '@/types/diary';
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

      // Récupérer les entrées de journal
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

        // Récupérer les profils des auteurs
        const userIds = [...new Set(diaryData.map(entry => entry.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', userIds);

        if (profilesError) {
          console.error('❌ useDiaryEntries - Erreur récupération profils:', profilesError);
          throw profilesError;
        }

        // Associer les profils aux entrées
        const entriesWithAuthors: DiaryEntryWithAuthor[] = diaryData.map(entry => ({
          ...entry,
          profiles: profilesData?.find(profile => profile.id === entry.user_id) || {
            id: entry.user_id,
            email: 'Utilisateur inconnu',
            display_name: null,
            avatar_url: null,
            created_at: new Date().toISOString()
          }
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
