
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
        .or(`author_id.eq.${user.id},author_id.in.(${await getAuthorizedUserIds(user.id)})`)
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

  // Fonction pour récupérer les IDs des utilisateurs autorisés via les groupes
  const getAuthorizedUserIds = async (userId: string): Promise<string> => {
    try {
      const { data: groupMembers } = await supabase
        .from('group_members')
        .select(`
          user_id,
          group_members_same_group:group_members!inner(user_id)
        `)
        .eq('group_members.user_id', userId);

      const userIds = groupMembers?.flatMap(gm => 
        gm.group_members_same_group?.map(sgm => sgm.user_id) || []
      ).filter(id => id !== userId) || [];

      return userIds.join(',') || 'null';
    } catch (error) {
      console.error('Erreur récupération groupe membres:', error);
      return 'null';
    }
  };

  useEffect(() => {
    fetchWishes();
  }, [fetchWishes]);

  return wishes;
};
