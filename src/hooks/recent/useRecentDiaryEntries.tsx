
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

    console.log('🔍 ===== RÉCUPÉRATION ENTRÉES JOURNAL =====');
    console.log('🔍 Utilisateur effectif:', effectiveUserId);
    console.log('🔍 authorizedUserIds pour journal:', authorizedUserIds);
    console.log('🔍 hasRole admin:', hasRole('admin'));

    const items: RecentItem[] = [];

    if (hasRole('admin')) {
      const { data: entries, error: entriesError } = await supabase
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
        .order('created_at', { ascending: false })
        .limit(15);

      console.log('🔍 Admin diary entries query result:', { entries, error: entriesError });

      if (entries) {
        const userIds = [...new Set(entries.map(entry => entry.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', userIds);
        
        const profilesMap = profiles?.reduce((acc, profile) => {
          acc[profile.id] = profile.display_name || 'Utilisateur';
          return acc;
        }, {} as { [key: string]: string }) || {};

        items.push(...entries.map(entry => {
          console.log('🔍 Processing admin diary entry:', {
            id: entry.id,
            title: entry.title,
            media_url: entry.media_url,
            media_type: entry.media_type
          });
          
          return {
            id: entry.id,
            title: entry.title || 'Entrée sans titre',
            type: 'diary' as const,
            created_at: entry.created_at,
            author: entry.user_id === effectiveUserId ? 'Moi' : (profilesMap[entry.user_id] || 'Utilisateur'),
            content_preview: entry.activities?.substring(0, 150) + '...' || 'Entrée de journal',
            media_url: entry.media_url
          };
        }));
      }
    } else {
      console.log('🔍 UTILISATEUR NON-ADMIN - récupération entrées journal de l\'utilisateur effectif uniquement');
      
      const { data: entries, error: diaryError } = await supabase
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
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: false })
        .limit(15);

      console.log('🔍 Requête entrées journal utilisateur effectif:', {
        data: entries,
        error: diaryError,
        count: entries?.length || 0
      });

      if (entries) {
        items.push(...entries.map(entry => {
          console.log('🔍 Processing user diary entry:', {
            id: entry.id,
            title: entry.title,
            media_url: entry.media_url,
            media_type: entry.media_type
          });
          
          return {
            id: entry.id,
            title: entry.title || 'Entrée sans titre',
            type: 'diary' as const,
            created_at: entry.created_at,
            author: 'Moi',
            content_preview: entry.activities?.substring(0, 150) + '...' || 'Entrée de journal',
            media_url: entry.media_url
          };
        }));
      }
    }

    console.log('🔍 Final diary entries for Recent:', items.map(item => ({ 
      id: item.id, 
      title: item.title, 
      media_url: item.media_url,
      hasMedia: !!item.media_url
    })));

    setDiaryEntries(items);
  }, [effectiveUserId, hasRole]);

  useEffect(() => {
    fetchDiaryEntries();
  }, [fetchDiaryEntries]);

  return diaryEntries;
};
