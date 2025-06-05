
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';

export const useRecentLifeStories = () => {
  const { user, getEffectiveUserId } = useAuth();
  const [lifeStories, setLifeStories] = useState<RecentItem[]>([]);

  const fetchLifeStories = useCallback(async () => {
    if (!user) {
      setLifeStories([]);
      return;
    }

    console.log('🔍 useRecentLifeStories - Récupération avec logique de groupe CORRIGÉE');

    try {
      const effectiveUserId = getEffectiveUserId();

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
        .eq('user_id', effectiveUserId);

      if (userGroupsError) {
        console.error('❌ useRecentLifeStories - Erreur récupération groupes:', userGroupsError);
        setLifeStories([]);
        return;
      }

      // 2. Construire la liste des utilisateurs autorisés
      let authorizedUsers = [effectiveUserId]; // Toujours inclure l'utilisateur courant

      if (userGroupMemberships && userGroupMemberships.length > 0) {
        console.log('🔍 useRecentLifeStories - Utilisateur dans des groupes:', userGroupMemberships.length);
        
        // Pour chaque groupe, ajouter le créateur du groupe ET tous les membres
        for (const membership of userGroupMemberships) {
          const groupCreator = membership.invitation_groups?.created_by;
          if (groupCreator && !authorizedUsers.includes(groupCreator)) {
            authorizedUsers.push(groupCreator);
            console.log('✅ useRecentLifeStories - Ajout du créateur du groupe:', groupCreator);
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
            if (!authorizedUsers.includes(member.user_id)) {
              authorizedUsers.push(member.user_id);
            }
          }
        }
      } else {
        console.log('🔍 useRecentLifeStories - Utilisateur dans AUCUN groupe - accès limité à ses propres contenus');
      }

      console.log('✅ useRecentLifeStories - Utilisateurs autorisés:', {
        count: authorizedUsers.length,
        userIds: authorizedUsers
      });

      // 3. Récupérer les histoires de vie
      const { data: storiesData, error } = await supabase
        .from('life_stories')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          user_id
        `)
        .in('user_id', authorizedUsers)
        .order('updated_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('❌ useRecentLifeStories - Erreur récupération histoires:', error);
        setLifeStories([]);
        return;
      }

      // 4. Récupérer les profils séparément
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .in('id', authorizedUsers);

      console.log('✅ useRecentLifeStories - Histoires récupérées côté application:', {
        count: storiesData?.length || 0,
        histoiresParAuteur: storiesData?.reduce((acc, story) => {
          const profile = profilesData?.find(p => p.id === story.user_id);
          const authorEmail = profile?.email || 'Email non disponible';
          if (!acc[authorEmail]) {
            acc[authorEmail] = 0;
          }
          acc[authorEmail]++;
          return acc;
        }, {} as Record<string, number>)
      });

      if (storiesData) {
        const items = storiesData.map(story => {
          const profile = profilesData?.find(p => p.id === story.user_id);
          return {
            id: story.id,
            title: story.title,
            type: 'life-story' as const,
            created_at: story.updated_at || story.created_at,
            author: story.user_id === effectiveUserId ? 'Moi' : (profile?.display_name || profile?.email || 'Anonyme'),
            content_preview: `Histoire de vie - ${story.title}`
          };
        });

        console.log('✅ useRecentLifeStories - Items histoires transformés:', items.length);
        setLifeStories(items);
      }
    } catch (error) {
      console.error('💥 useRecentLifeStories - Erreur critique:', error);
      setLifeStories([]);
    }
  }, [user, getEffectiveUserId]);

  useEffect(() => {
    fetchLifeStories();
  }, [fetchLifeStories]);

  return lifeStories;
};
