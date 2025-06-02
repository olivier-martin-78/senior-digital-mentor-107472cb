
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DiaryEntryWithAuthor } from '@/types/diary';
import { fetchUserDiaryEntries } from './useUserDiaryEntries';
import { detectAuthDesync } from '@/utils/authRecovery';

export const useSimpleDiaryEntries = (searchTerm: string, startDate: string, endDate: string) => {
  const { session, getEffectiveUserId } = useAuth();
  const [entries, setEntries] = useState<DiaryEntryWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      console.log('🔍 Diary Simple - Pas de session, pas de récupération');
      setLoading(false);
      return;
    }
    fetchEntries();
  }, [session, searchTerm, startDate, endDate]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      
      const effectiveUserId = getEffectiveUserId();
      if (!effectiveUserId) {
        console.log('🔍 Diary Simple - Pas d\'utilisateur effectif');
        setEntries([]);
        return;
      }

      console.log('🔍 Diary Simple - Début fetchEntries:', {
        searchTerm,
        startDate,
        endDate,
        effectiveUserId
      });

      // Vérifier la synchronisation de l'authentification avant de faire des requêtes
      const isDesynced = await detectAuthDesync();
      if (isDesynced) {
        console.warn('🔍 Diary Simple - Authentification désynchronisée détectée, arrêt de la requête');
        setEntries([]);
        return;
      }

      console.log('🔍 Diary Simple - Utilisation de fetchUserDiaryEntries pour gérer les permissions...');
      
      // Utiliser la même logique que useUserDiaryEntries qui gère correctement les permissions
      const result = await fetchUserDiaryEntries(effectiveUserId, searchTerm, startDate, endDate);
      
      console.log('🔍 Diary Simple - Entrées récupérées avec permissions:', {
        count: result.length,
        entries: result.map(e => ({ 
          id: e.id, 
          title: e.title, 
          user_id: e.user_id,
          entry_date: e.entry_date,
          author: e.profiles?.email
        }))
      });

      setEntries(result);
    } catch (error) {
      console.error('🔍 Diary Simple - Erreur lors du chargement des entrées:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return { entries, loading };
};
