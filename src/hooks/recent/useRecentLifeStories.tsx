
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';
import { useGroupPermissions } from '../useGroupPermissions';

export const useRecentLifeStories = () => {
  const { user, getEffectiveUserId } = useAuth();
  const [lifeStories, setLifeStories] = useState<RecentItem[]>([]);
  const { authorizedUserIds, loading: permissionsLoading } = useGroupPermissions();

  const fetchLifeStories = useCallback(async () => {
    if (!user || permissionsLoading) {
      setLifeStories([]);
      return;
    }

    console.log('🔍 useRecentLifeStories - Récupération avec permissions de groupe centralisées');

    try {
      const effectiveUserId = getEffectiveUserId();

      if (authorizedUserIds.length === 0) {
        console.log('⚠️ useRecentLifeStories - Aucun utilisateur autorisé');
        setLifeStories([]);
        return;
      }

      console.log('✅ useRecentLifeStories - Utilisateurs autorisés:', authorizedUserIds);

      // Récupérer les histoires de vie
      const { data: storiesData, error } = await supabase
        .from('life_stories')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          user_id
        `)
        .in('user_id', authorizedUserIds)
        .order('updated_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('❌ useRecentLifeStories - Erreur récupération histoires:', error);
        setLifeStories([]);
        return;
      }

      console.log('✅ useRecentLifeStories - Histoires récupérées:', storiesData?.length || 0);

      if (storiesData && storiesData.length > 0) {
        // Récupérer les profils séparément
        const userIds = [...new Set(storiesData.map(story => story.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, display_name')
          .in('id', userIds);

        const profilesMap = profilesData?.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>) || {};

        const items = storiesData.map(story => {
          const profile = profilesMap[story.user_id];
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
      } else {
        setLifeStories([]);
      }
    } catch (error) {
      console.error('💥 useRecentLifeStories - Erreur critique:', error);
      setLifeStories([]);
    }
  }, [user, authorizedUserIds, permissionsLoading, getEffectiveUserId]);

  useEffect(() => {
    fetchLifeStories();
  }, [fetchLifeStories]);

  return lifeStories;
};
