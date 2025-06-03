
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

    console.log('🔍 ===== DIAGNOSTIC DIARY ENTRIES DÉTAILLÉ =====');
    console.log('🔍 Utilisateur effectif:', effectiveUserId);

    try {
      // Test 1: Récupérer TOUTES les entrées de journal sans filtre
      const { data: allEntries, error: allEntriesError } = await supabase
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
        .limit(50);

      console.log('🔍 TOUTES les entrées journal (sans filtre RLS):', allEntries?.length || 0);
      if (allEntriesError) {
        console.error('❌ Erreur récupération toutes les entrées:', allEntriesError);
      } else if (allEntries) {
        // Récupérer les profiles séparément
        const userIds = [...new Set(allEntries.map(entry => entry.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, email, display_name')
          .in('id', userIds);
        
        const profilesMap = profiles?.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as { [key: string]: any }) || {};

        const entriesByAuthor = allEntries.reduce((acc, entry) => {
          const profile = profilesMap[entry.user_id];
          const authorEmail = profile?.email || 'Email non disponible';
          if (!acc[authorEmail]) {
            acc[authorEmail] = 0;
          }
          acc[authorEmail]++;
          return acc;
        }, {} as Record<string, number>);
        console.log('🔍 Entrées par auteur (toutes):', entriesByAuthor);

        // Vérifier spécifiquement les entrées de Conception
        const conceptionEntries = allEntries.filter(entry => {
          const profile = profilesMap[entry.user_id];
          return profile?.email?.toLowerCase().includes('conception');
        });
        console.log('🔍 Entrées de Conception trouvées (sans filtre):', conceptionEntries.length);
      }

      // Test 2: Récupérer avec les politiques RLS
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

      console.log('🔍 Entrées journal AVEC politiques RLS:', entries?.length || 0);
      if (entriesError) {
        console.error('❌ Erreur récupération entries avec RLS:', entriesError);
        setDiaryEntries([]);
        return;
      }

      if (entries) {
        const userIds = [...new Set(entries.map(entry => entry.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', userIds);
        
        const profilesMap = profiles?.reduce((acc, profile) => {
          acc[profile.id] = {
            name: profile.display_name || profile.email || 'Utilisateur',
            email: profile.email
          };
          return acc;
        }, {} as { [key: string]: { name: string; email: string } }) || {};

        console.log('🔍 Profiles récupérés pour diary:', profilesMap);

        const items = entries.map(entry => {
          const profile = profilesMap[entry.user_id];
          return {
            id: entry.id,
            title: entry.title || 'Entrée sans titre',
            type: 'diary' as const,
            created_at: entry.created_at,
            author: entry.user_id === effectiveUserId ? 'Moi' : (profile?.name || 'Utilisateur'),
            content_preview: entry.activities?.substring(0, 150) + '...' || 'Entrée de journal',
            media_url: entry.media_url
          };
        });

        console.log('🔍 Items diary finaux:', items.length);
        console.log('🔍 Auteurs diary items:', items.map(i => i.author));

        setDiaryEntries(items);
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
