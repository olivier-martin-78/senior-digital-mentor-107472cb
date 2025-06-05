
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';
import { useGroupPermissions } from '../useGroupPermissions';

export const useRecentWishes = () => {
  const { user, getEffectiveUserId } = useAuth();
  const [wishes, setWishes] = useState<RecentItem[]>([]);
  const { authorizedUserIds, loading: permissionsLoading } = useGroupPermissions();

  const fetchWishes = useCallback(async () => {
    if (!user || permissionsLoading) {
      setWishes([]);
      return;
    }

    console.log('🔍 useRecentWishes - Récupération avec permissions de groupe centralisées');

    try {
      const effectiveUserId = getEffectiveUserId();
      const usersToQuery = authorizedUserIds.length > 0 ? authorizedUserIds : [effectiveUserId];

      console.log('✅ useRecentWishes - Utilisateurs autorisés:', usersToQuery);

      // Récupérer les souhaits avec logique d'accès côté application
      const { data: wishesData, error } = await supabase
        .from('wish_posts')
        .select(`
          id,
          title,
          content,
          created_at,
          first_name,
          cover_image,
          published,
          author_id
        `)
        .in('author_id', usersToQuery)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('❌ useRecentWishes - Erreur récupération wishes:', error);
        setWishes([]);
        return;
      }

      console.log('✅ useRecentWishes - Wishes récupérées:', wishesData?.length || 0);

      if (wishesData) {
        // Récupérer les profils séparément
        const userIds = [...new Set(wishesData.map(wish => wish.author_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, display_name')
          .in('id', userIds);

        const profilesMap = profilesData?.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>) || {};

        const items = wishesData.map(wish => {
          const profile = profilesMap[wish.author_id];
          return {
            id: wish.id,
            title: wish.title,
            type: 'wish' as const,
            created_at: wish.created_at,
            author: wish.author_id === effectiveUserId ? 'Moi' : (wish.first_name || profile?.display_name || profile?.email || 'Anonyme'),
            content_preview: wish.content?.substring(0, 150) + '...',
            cover_image: wish.cover_image,
            first_name: wish.first_name
          };
        });

        console.log('✅ useRecentWishes - Items wishes transformés:', items.length);
        setWishes(items);
      }
    } catch (error) {
      console.error('💥 useRecentWishes - Erreur critique:', error);
      setWishes([]);
    }
  }, [user, authorizedUserIds, permissionsLoading, getEffectiveUserId]);

  useEffect(() => {
    fetchWishes();
  }, [fetchWishes]);

  return wishes;
};
