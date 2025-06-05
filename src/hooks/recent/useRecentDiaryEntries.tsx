
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';
import { useGroupPermissions } from '../useGroupPermissions';

export const useRecentDiaryEntries = () => {
  const { user, getEffectiveUserId } = useAuth();
  const [diaryEntries, setDiaryEntries] = useState<RecentItem[]>([]);
  const { authorizedUserIds, loading: permissionsLoading } = useGroupPermissions();

  const fetchDiaryEntries = useCallback(async () => {
    if (!user || permissionsLoading) {
      setDiaryEntries([]);
      return;
    }

    console.log('🔍 useRecentDiaryEntries - Récupération avec permissions de groupe centralisées');

    try {
      const currentUserId = getEffectiveUserId();

      if (authorizedUserIds.length === 0) {
        console.log('⚠️ useRecentDiaryEntries - Aucun utilisateur autorisé');
        setDiaryEntries([]);
        return;
      }

      console.log('✅ useRecentDiaryEntries - Utilisateurs autorisés:', authorizedUserIds);

      // Utiliser la jointure directe maintenant que les FK sont correctes
      const { data: entries, error } = await supabase
        .from('diary_entries')
        .select(`
          id, 
          title, 
          created_at, 
          activities, 
          media_url,
          media_type,
          user_id,
          profiles!inner(id, email, display_name)
        `)
        .in('user_id', authorizedUserIds)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('❌ useRecentDiaryEntries - Erreur récupération entries:', error);
        setDiaryEntries([]);
        return;
      }

      console.log('✅ useRecentDiaryEntries - Diary entries récupérées:', entries?.length || 0);

      if (entries && entries.length > 0) {
        const items = entries.map(entry => ({
          id: entry.id,
          title: entry.title || 'Entrée sans titre',
          type: 'diary' as const,
          created_at: entry.created_at,
          author: entry.user_id === currentUserId ? 'Moi' : (entry.profiles?.display_name || entry.profiles?.email || 'Utilisateur'),
          content_preview: entry.activities?.substring(0, 150) + '...' || 'Entrée de journal',
          media_url: entry.media_url
        }));

        console.log('✅ useRecentDiaryEntries - Items diary transformés:', items.length);
        setDiaryEntries(items);
      } else {
        setDiaryEntries([]);
      }
    } catch (error) {
      console.error('💥 useRecentDiaryEntries - Erreur critique:', error);
      setDiaryEntries([]);
    }
  }, [user, authorizedUserIds, permissionsLoading, getEffectiveUserId]);

  useEffect(() => {
    fetchDiaryEntries();
  }, [fetchDiaryEntries]);

  return diaryEntries;
};
