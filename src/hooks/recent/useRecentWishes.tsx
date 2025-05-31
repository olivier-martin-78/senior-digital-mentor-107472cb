
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';

export const useRecentWishes = () => {
  const { user } = useAuth();
  const [wishes, setWishes] = useState<RecentItem[]>([]);

  useEffect(() => {
    const fetchWishes = async () => {
      if (!user) {
        setWishes([]);
        return;
      }

      try {
        console.log('useRecentWishes - Utilisation des politiques RLS consolidées');
        
        // Utilisation directe des politiques RLS consolidées
        // La politique "wish_posts_final" gère automatiquement l'accès
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
            profiles(display_name)
          `)
          .order('created_at', { ascending: false })
          .limit(15);

        if (error) {
          console.error('useRecentWishes - Erreur:', error);
          return;
        }

        if (wishesData) {
          const items = wishesData.map(wish => ({
            id: wish.id,
            title: wish.title,
            type: 'wish' as const,
            created_at: wish.created_at,
            author: wish.first_name || wish.profiles?.display_name || 'Anonyme',
            content_preview: wish.content?.substring(0, 150) + '...',
            cover_image: wish.cover_image,
            first_name: wish.first_name
          }));
          setWishes(items);
        }
      } catch (error) {
        console.error('useRecentWishes - Erreur:', error);
        setWishes([]);
      }
    };

    fetchWishes();
  }, [user]);

  return wishes;
};
