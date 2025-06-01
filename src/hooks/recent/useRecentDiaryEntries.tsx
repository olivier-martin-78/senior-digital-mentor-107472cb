
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';
import { getThumbnailUrlSync, DIARY_MEDIA_BUCKET } from '@/utils/thumbnailtUtils';

export const useRecentDiaryEntries = (effectiveUserId: string, authorizedUserIds: string[]) => {
  const { hasRole } = useAuth();
  const [diaryEntries, setDiaryEntries] = useState<RecentItem[]>([]);

  useEffect(() => {
    const fetchDiaryEntries = async () => {
      console.log('🔍 ===== RÉCUPÉRATION ENTRÉES JOURNAL =====');
      console.log('🔍 Utilisateur effectif:', effectiveUserId);
      console.log('🔍 authorizedUserIds pour journal:', authorizedUserIds);
      console.log('🔍 hasRole admin:', hasRole('admin'));

      const items: RecentItem[] = [];

      if (hasRole('admin')) {
        const { data: entries } = await supabase
          .from('diary_entries')
          .select(`
            id, 
            title, 
            created_at, 
            activities, 
            media_url,
            user_id
          `)
          .order('created_at', { ascending: false })
          .limit(15);

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
            // Corriger l'URL des médias pour le bucket diary_media
            let mediaUrl = entry.media_url;
            if (mediaUrl) {
              // Si l'URL est déjà complète, la garder telle quelle
              if (!mediaUrl.startsWith('http')) {
                // Sinon, construire l'URL correcte avec le bon bucket
                mediaUrl = getThumbnailUrlSync(mediaUrl, DIARY_MEDIA_BUCKET);
              }
            }
            
            return {
              id: entry.id,
              title: entry.title,
              type: 'diary' as const,
              created_at: entry.created_at,
              author: entry.user_id === effectiveUserId ? 'Moi' : (profilesMap[entry.user_id] || 'Utilisateur'),
              content_preview: entry.activities?.substring(0, 150) + '...' || 'Entrée de journal',
              media_url: mediaUrl
            };
          }));
        }
      } else {
        // Récupérer SEULEMENT les entrées de journal de l'utilisateur effectif (impersonné)
        console.log('🔍 UTILISATEUR NON-ADMIN - récupération entrées journal de l\'utilisateur effectif uniquement');
        
        const { data: entries, error: diaryError } = await supabase
          .from('diary_entries')
          .select(`
            id, 
            title, 
            created_at, 
            activities, 
            media_url,
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
            // Corriger l'URL des médias pour le bucket diary_media
            let mediaUrl = entry.media_url;
            if (mediaUrl) {
              // Si l'URL est déjà complète, la garder telle quelle
              if (!mediaUrl.startsWith('http')) {
                // Sinon, construire l'URL correcte avec le bon bucket
                mediaUrl = getThumbnailUrlSync(mediaUrl, DIARY_MEDIA_BUCKET);
              }
            }
            
            return {
              id: entry.id,
              title: entry.title,
              type: 'diary' as const,
              created_at: entry.created_at,
              author: 'Moi',
              content_preview: entry.activities?.substring(0, 150) + '...' || 'Entrée de journal',
              media_url: mediaUrl
            };
          }));
        }
      }

      setDiaryEntries(items);
    };

    if (effectiveUserId) {
      fetchDiaryEntries();
    }
  }, [effectiveUserId, authorizedUserIds, hasRole]);

  return diaryEntries;
};
