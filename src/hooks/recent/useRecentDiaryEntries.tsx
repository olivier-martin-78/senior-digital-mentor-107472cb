
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';

export const useRecentDiaryEntries = (effectiveUserId: string, authorizedUserIds: string[]) => {
  const { getEffectiveUserId } = useAuth();
  const [diaryEntries, setDiaryEntries] = useState<RecentItem[]>([]);

  const fetchDiaryEntries = useCallback(async () => {
    if (!effectiveUserId) {
      setDiaryEntries([]);
      return;
    }

    console.log('🔍 useRecentDiaryEntries - Récupération avec logique de groupe CORRIGÉE');

    try {
      const currentUserId = getEffectiveUserId();

      // 1. Récupérer les groupes où l'utilisateur est membre
      const { data: userGroupMemberships, error: userGroupsError } = await supabase
        .from('group_members')
        .select(`
          group_id, 
          role,
          invitation_groups!inner(
            id,
            name,
            created_by
          )
        `)
        .eq('user_id', currentUserId);

      if (userGroupsError) {
        console.error('❌ useRecentDiaryEntries - Erreur récupération groupes:', userGroupsError);
        setDiaryEntries([]);
        return;
      }

      // 2. Construire la liste des utilisateurs autorisés
      let actualAuthorizedUsers = [currentUserId]; // Toujours inclure l'utilisateur courant

      if (userGroupMemberships && userGroupMemberships.length > 0) {
        console.log('🔍 useRecentDiaryEntries - Utilisateur dans des groupes:', userGroupMemberships.length);
        
        // Pour chaque groupe, ajouter le créateur du groupe ET tous les membres
        for (const membership of userGroupMemberships) {
          const groupCreator = membership.invitation_groups?.created_by;
          if (groupCreator && !actualAuthorizedUsers.includes(groupCreator)) {
            actualAuthorizedUsers.push(groupCreator);
            console.log('✅ useRecentDiaryEntries - Ajout du créateur du groupe:', groupCreator);
          }
        }

        // Récupérer tous les membres des groupes où l'utilisateur est présent
        const groupIds = userGroupMemberships.map(g => g.group_id);
        const { data: allGroupMembers } = await supabase
          .from('group_members')
          .select('user_id')
          .in('group_id', groupIds);

        if (allGroupMembers) {
          for (const member of allGroupMembers) {
            if (!actualAuthorizedUsers.includes(member.user_id)) {
              actualAuthorizedUsers.push(member.user_id);
            }
          }
        }
      } else {
        console.log('🔍 useRecentDiaryEntries - Utilisateur dans AUCUN groupe - accès limité à ses propres contenus');
      }

      console.log('✅ useRecentDiaryEntries - Utilisateurs autorisés:', {
        count: actualAuthorizedUsers.length,
        userIds: actualAuthorizedUsers
      });

      // 3. Récupérer les entrées de journal
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
        .in('user_id', actualAuthorizedUsers)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('❌ useRecentDiaryEntries - Erreur récupération entries:', error);
        setDiaryEntries([]);
        return;
      }

      console.log('✅ useRecentDiaryEntries - Diary entries récupérées côté application:', {
        count: entries?.length || 0,
        entriesParAuteur: entries?.reduce((acc, entry) => {
          if (!acc[entry.user_id]) {
            acc[entry.user_id] = 0;
          }
          acc[entry.user_id]++;
          return acc;
        }, {} as Record<string, number>)
      });

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
  }, [effectiveUserId, getEffectiveUserId]);

  useEffect(() => {
    fetchDiaryEntries();
  }, [fetchDiaryEntries]);

  return diaryEntries;
};
