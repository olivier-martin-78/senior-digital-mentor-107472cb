
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';

export const useRecentWishes = () => {
  const { user } = useAuth();
  const [wishes, setWishes] = useState<RecentItem[]>([]);

  const fetchWishes = useCallback(async () => {
    if (!user) {
      setWishes([]);
      return;
    }

    console.log('🔍 Récupération wishes avec logique applicative:', user.id);

    try {
      // Récupérer d'abord les groupes de l'utilisateur
      const { data: userGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      const groupIds = userGroups?.map(g => g.group_id) || [];
      
      // Récupérer les membres des mêmes groupes
      let authorizedUsers = [user.id];
      if (groupIds.length > 0) {
        const { data: groupMembers } = await supabase
          .from('group_members')
          .select('user_id')
          .in('group_id', groupIds);
        
        const additionalUsers = groupMembers?.map(gm => gm.user_id).filter(id => id !== user.id) || [];
        authorizedUsers = [...authorizedUsers, ...additionalUsers];
      }

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
          author_id,
          profiles!wish_posts_author_id_fkey(id, email, display_name)
        `)
        .in('author_id', authorizedUsers)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('❌ Erreur récupération wishes:', error);
        setWishes([]);
        return;
      }

      console.log('✅ Wishes récupérées côté application:', wishesData?.length || 0);

      if (wishesData) {
        const items = wishesData.map(wish => ({
          id: wish.id,
          title: wish.title,
          type: 'wish' as const,
          created_at: wish.created_at,
          author: wish.first_name || wish.profiles?.display_name || wish.profiles?.email || 'Anonyme',
          content_preview: wish.content?.substring(0, 150) + '...',
          cover_image: wish.cover_image,
          first_name: wish.first_name
        }));

        console.log('✅ Items wishes transformés:', items.length);
        setWishes(items);
      }
    } catch (error) {
      console.error('💥 Erreur critique useRecentWishes:', error);
      setWishes([]);
    }
  }, [user]);

  useEffect(() => {
    fetchWishes();
  }, [fetchWishes]);

  return wishes;
};
