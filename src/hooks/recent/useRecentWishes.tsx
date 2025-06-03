
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

    console.log('🔍 ===== DIAGNOSTIC WISHES DÉTAILLÉ =====');
    console.log('🔍 Utilisateur connecté:', user.email, user.id);

    try {
      // Test 1: Récupérer TOUS les souhaits sans filtre
      const { data: allWishes, error: allWishesError } = await supabase
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
          profiles(display_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      console.log('🔍 TOUS les souhaits (sans filtre RLS):', allWishes?.length || 0);
      if (allWishesError) {
        console.error('❌ Erreur récupération tous les souhaits:', allWishesError);
      } else if (allWishes) {
        const wishesByAuthor = allWishes.reduce((acc, wish) => {
          const authorEmail = wish.profiles?.email || 'Email non disponible';
          if (!acc[authorEmail]) {
            acc[authorEmail] = 0;
          }
          acc[authorEmail]++;
          return acc;
        }, {} as Record<string, number>);
        console.log('🔍 Souhaits par auteur (tous):', wishesByAuthor);

        // Vérifier spécifiquement les souhaits de Conception
        const conceptionWishes = allWishes.filter(wish => 
          wish.profiles?.email?.toLowerCase().includes('conception')
        );
        console.log('🔍 Souhaits de Conception trouvés (sans filtre):', conceptionWishes.length);
      }

      // Test 2: Récupérer avec les politiques RLS
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
          profiles(display_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error) {
        console.error('❌ Erreur récupération souhaits avec RLS:', error);
        setWishes([]);
        return;
      }

      console.log('🔍 Souhaits AVEC politiques RLS:', wishesData?.length || 0);
      if (wishesData) {
        const wishesByAuthorRLS = wishesData.reduce((acc, wish) => {
          const authorEmail = wish.profiles?.email || 'Email non disponible';
          if (!acc[authorEmail]) {
            acc[authorEmail] = 0;
          }
          acc[authorEmail]++;
          return acc;
        }, {} as Record<string, number>);
        console.log('🔍 Souhaits par auteur (avec RLS):', wishesByAuthorRLS);

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

        console.log('🔍 Items wishes finaux:', items.length);
        console.log('🔍 Auteurs wishes:', items.map(i => i.author));
        setWishes(items);
      }
    } catch (error) {
      console.error('❌ Erreur useRecentWishes:', error);
      setWishes([]);
    }
  }, [user]);

  useEffect(() => {
    fetchWishes();
  }, [fetchWishes]);

  return wishes;
};
