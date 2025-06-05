
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';
import { useGroupPermissions } from '../useGroupPermissions';

export const useRecentDiaryEntries = (effectiveUserId: string, authorizedUserIds: string[]) => {
  const { getEffectiveUserId } = useAuth();
  const [diaryEntries, setDiaryEntries] = useState<RecentItem[]>([]);
  const { authorizedUserIds: groupAuthorizedUserIds, loading: permissionsLoading } = useGroupPermissions();

  const fetchDiaryEntries = useCallback(async () => {
    if (!effectiveUserId || permissionsLoading) {
      setDiaryEntries([]);
      return;
    }

    console.log('🔍 useRecentDiaryEntries - Récupération avec permissions de groupe centralisées');

    try {
      const currentUserId = getEffectiveUserId();
      const usersToQuery = groupAuthorizedUserIds.length > 0 ? groupAuthorizedUserIds : [currentUserId];

      console.log('✅ useRecentDiaryEntries - Utilisateurs autorisés:', usersToQuery);

      // Récupérer les entrées de journal
      const { data: entries, error } = await supabase
        .from('diary_entries')
        .select(`
          id, 
          title, 
          created_at, 
          activities, 
          media_url,
          media_type,
          user_id
        `)
        .in('user_id', usersToQuery)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('❌ useRecentDiaryEntries - Erreur récupération entries:', error);
        setDiaryEntries([]);
        return;
      }

      console.log('✅ useRecentDiaryEntries - Diary entries récupérées:', entries?.length || 0);

      if (entries && entries.length > 0) {
        // Récupérer les profils des auteurs séparément
        const userIds = [...new Set(entries.map(entry => entry.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, display_name')
          .in('id', userIds);

        const profilesMap = profiles?.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>) || {};

        const items = entries.map(entry => {
          const profile = profilesMap[entry.user_id];
          return {
            id: entry.id,
            title: entry.title || 'Entrée sans titre',
            type: 'diary' as const,
            created_at: entry.created_at,
            author: entry.user_id === currentUserId ? 'Moi' : (profile?.display_name || profile?.email || 'Utilisateur'),
            content_preview: entry.activities?.substring(0, 150) + '...' || 'Entrée de journal',
            media_url: entry.media_url
          };
        });

        console.log('✅ useRecentDiaryEntries - Items diary transformés:', items.length);
        setDiaryEntries(items);
      } else {
        setDiaryEntries([]);
      }
    } catch (error) {
      console.error('💥 useRecentDiaryEntries - Erreur critique:', error);
      setDiaryEntries([]);
    }
  }, [effectiveUserId, groupAuthorizedUserIds, permissionsLoading, getEffectiveUserId]);

  useEffect(() => {
    fetchDiaryEntries();
  }, [fetchDiaryEntries]);

  return diaryEntries;
};
