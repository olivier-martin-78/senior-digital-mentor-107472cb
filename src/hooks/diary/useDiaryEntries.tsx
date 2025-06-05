
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

      // CORRIGÉ: Utiliser user_id (pas author_id) car diary_entries utilise user_id pour l'auteur
      // ET ajouter la récupération des profils comme dans le blog
      let query = supabase
        .from('diary_entries')
        .select(`
          *,
          profiles!inner(id, email, display_name, avatar_url, created_at)
        `)
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

        // Les données incluent déjà les profils via le join
        const entriesWithAuthors = diaryData;

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
