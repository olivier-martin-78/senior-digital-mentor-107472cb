
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';

export const useRecentWishes = () => {
  const { user, getEffectiveUserId } = useAuth();
  const [wishes, setWishes] = useState<RecentItem[]>([]);

  const fetchWishes = useCallback(async () => {
    if (!user) {
      console.log('🚫 useRecentWishes - Pas d\'utilisateur connecté');
      setWishes([]);
      return;
    }

    console.log('🔍 useRecentWishes - Récupération des souhaits récents');

    try {
      const effectiveUserId = getEffectiveUserId();

      // Récupérer TOUS les souhaits accessibles via RLS
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
  }, [user, getEffectiveUserId]);

  useEffect(() => {
    fetchWishes();
  }, [fetchWishes]);

  return wishes;
};
