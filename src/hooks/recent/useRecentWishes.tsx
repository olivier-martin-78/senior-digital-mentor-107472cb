
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

      if (authorizedUserIds.length === 0) {
        console.log('⚠️ useRecentWishes - Aucun utilisateur autorisé');
        setWishes([]);
        return;
      }

      console.log('✅ useRecentWishes - Utilisateurs autorisés:', authorizedUserIds);

      // Utiliser la jointure directe maintenant que les FK sont correctes
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
          author_id,
          profiles!inner(id, email, display_name)
        `)
        .in('author_id', authorizedUserIds)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('❌ useRecentWishes - Erreur récupération wishes:', error);
        setWishes([]);
        return;
      }

      console.log('✅ useRecentWishes - Wishes récupérées:', wishesData?.length || 0);

      if (wishesData && wishesData.length > 0) {
        const items = wishesData.map(wish => ({
          id: wish.id,
          title: wish.title,
          type: 'wish' as const,
          created_at: wish.created_at,
          author: wish.author_id === effectiveUserId ? 'Moi' : (wish.first_name || wish.profiles?.display_name || wish.profiles?.email || 'Anonyme'),
          content_preview: wish.content?.substring(0, 150) + '...',
          cover_image: wish.cover_image,
          first_name: wish.first_name
        }));

        console.log('✅ useRecentWishes - Items wishes transformés:', items.length);
        setWishes(items);
      } else {
        setWishes([]);
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
