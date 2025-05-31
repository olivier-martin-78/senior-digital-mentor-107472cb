
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { DiaryEntryWithAuthor } from '@/types/diary';
import { fetchAdminDiaryEntries } from './useAdminDiaryEntries';
import { fetchUserDiaryEntries } from './useUserDiaryEntries';

export const useDiaryEntries = (searchTerm: string, startDate: string, endDate: string) => {
  const { session, hasRole, getEffectiveUserId } = useAuth();
  const [entries, setEntries] = useState<DiaryEntryWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  const effectiveUserId = getEffectiveUserId();

  useEffect(() => {
    if (!session) return;
    fetchEntries();
  }, [session, effectiveUserId, searchTerm, startDate, endDate]);

  const fetchEntries = async () => {
    if (!effectiveUserId) return;
    
    try {
      setLoading(true);
      console.log('🔍 Diary - Début fetchEntries:', {
        currentUserId: effectiveUserId,
        isAdmin: hasRole('admin'),
        searchTerm: searchTerm,
        searchTermLength: searchTerm?.length || 0,
        startDate,
        endDate
      });
      
      let result: DiaryEntryWithAuthor[] = [];
      
      if (hasRole('admin')) {
        result = await fetchAdminDiaryEntries(searchTerm, startDate, endDate);
      } else {
        result = await fetchUserDiaryEntries(effectiveUserId, searchTerm, startDate, endDate);
      }
      
      setEntries(result);
    } catch (error) {
      console.error('Diary - Erreur lors du chargement des entrées:', error);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  return { entries, loading };
};
