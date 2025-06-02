
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DiaryEntryWithAuthor } from '@/types/diary';
import { fetchAdminDiaryEntries } from './useAdminDiaryEntries';
import { useSimpleDiaryEntries } from './useSimpleDiaryEntries';

export const useDiaryEntries = (searchTerm: string, startDate: string, endDate: string) => {
  const { session, hasRole } = useAuth();
  const [entries, setEntries] = useState<DiaryEntryWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  // Utiliser le nouveau hook simplifié pour les utilisateurs normaux
  const { entries: simpleEntries, loading: simpleLoading } = useSimpleDiaryEntries(searchTerm, startDate, endDate);

  useEffect(() => {
    if (!session) return;
    
    if (hasRole('admin')) {
      fetchAdminEntries();
    } else {
      // Pour les utilisateurs normaux, utiliser le hook simplifié
      setEntries(simpleEntries);
      setLoading(simpleLoading);
    }
  }, [session, simpleEntries, simpleLoading, hasRole, searchTerm, startDate, endDate]);

  const fetchAdminEntries = async () => {
    try {
      setLoading(true);
      console.log('🔍 Diary - Admin fetchEntries:', {
        searchTerm,
        startDate,
        endDate
      });
      
      const result = await fetchAdminDiaryEntries(searchTerm, startDate, endDate);
      setEntries(result);
    } catch (error) {
      console.error('Diary - Erreur lors du chargement des entrées admin:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return { entries, loading };
};
