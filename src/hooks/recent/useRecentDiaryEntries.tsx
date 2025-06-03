
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
      // Récupérer les entrées avec logique d'accès côté application
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
          profiles!diary_entries_user_id_fkey(id, email, display_name)
        `)
        .or(`user_id.eq.${effectiveUserId},user_id.in.(${await getAuthorizedUserIds(effectiveUserId)})`)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('❌ Erreur récupération entries:', error);
        setDiaryEntries([]);
        return;
      }

      console.log('✅ Diary entries récupérées côté application:', entries?.length || 0);

      if (entries) {
        const items = entries.map(entry => ({
          id: entry.id,
          title: entry.title || 'Entrée sans titre',
          type: 'diary' as const,
          created_at: entry.created_at,
          author: entry.user_id === effectiveUserId ? 'Moi' : (entry.profiles?.display_name || entry.profiles?.email || 'Utilisateur'),
          content_preview: entry.activities?.substring(0, 150) + '...' || 'Entrée de journal',
          media_url: entry.media_url
        }));

        console.log('✅ Items diary transformés:', items.length);
        setDiaryEntries(items);
      }
    } catch (error) {
      console.error('💥 Erreur critique useRecentDiaryEntries:', error);
      setDiaryEntries([]);
    }
  }, [effectiveUserId]);

  // Fonction pour récupérer les IDs des utilisateurs autorisés via les groupes
  const getAuthorizedUserIds = async (userId: string): Promise<string> => {
    try {
      const { data: groupMembers } = await supabase
        .from('group_members')
        .select(`
          user_id,
          group_members_same_group:group_members!inner(user_id)
        `)
        .eq('group_members.user_id', userId);

      const userIds = groupMembers?.flatMap(gm => 
        gm.group_members_same_group?.map(sgm => sgm.user_id) || []
      ).filter(id => id !== userId) || [];

      return userIds.join(',') || 'null';
    } catch (error) {
      console.error('Erreur récupération groupe membres:', error);
      return 'null';
    }
  };

  useEffect(() => {
    fetchDiaryEntries();
  }, [fetchDiaryEntries]);

  return diaryEntries;
};
