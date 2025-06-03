
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';

export const useRecentDiaryEntries = (effectiveUserId: string, authorizedUserIds: string[]) => {
  const { hasRole } = useAuth();
  const [diaryEntries, setDiaryEntries] = useState<RecentItem[]>([]);

  const fetchDiaryEntries = useCallback(async () => {
    if (!effectiveUserId) {
      setDiaryEntries([]);
      return;
    }

    console.log('🔍 Récupération diary entries avec logique applicative:', effectiveUserId);

    try {
      // Récupérer d'abord les groupes de l'utilisateur
      const { data: userGroups, error: groupsError } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', effectiveUserId);

      if (groupsError) {
        console.error('❌ Erreur récupération groupes:', groupsError);
        setDiaryEntries([]);
        return;
      }

      const groupIds = userGroups?.map(g => g.group_id) || [];
      
      // Récupérer les membres des mêmes groupes
      let authorizedUsers = [effectiveUserId];
      if (groupIds.length > 0) {
        const { data: groupMembers, error: membersError } = await supabase
          .from('group_members')
          .select('user_id')
          .in('group_id', groupIds);
        
        if (!membersError && groupMembers) {
          const additionalUsers = groupMembers.map(gm => gm.user_id).filter(id => id !== effectiveUserId);
          authorizedUsers = [...authorizedUsers, ...additionalUsers];
        }
      }

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
        .in('user_id', authorizedUsers)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('❌ Erreur récupération entries:', error);
        setDiaryEntries([]);
        return;
      }

      console.log('✅ Diary entries récupérées côté application:', entries?.length || 0);

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
            author: entry.user_id === effectiveUserId ? 'Moi' : (profile?.display_name || profile?.email || 'Utilisateur'),
            content_preview: entry.activities?.substring(0, 150) + '...' || 'Entrée de journal',
            media_url: entry.media_url
          };
        });

        console.log('✅ Items diary transformés:', items.length);
        setDiaryEntries(items);
      } else {
        setDiaryEntries([]);
      }
    } catch (error) {
      console.error('💥 Erreur critique useRecentDiaryEntries:', error);
      setDiaryEntries([]);
    }
  }, [effectiveUserId]);

  useEffect(() => {
    fetchDiaryEntries();
  }, [fetchDiaryEntries]);

  return diaryEntries;
};
