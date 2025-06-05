
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { RecentItem } from '../useRecentItems';

export const useRecentWishes = () => {
  const { user, getEffectiveUserId } = useAuth();
  const [wishes, setWishes] = useState<RecentItem[]>([]);

  const fetchWishes = useCallback(async () => {
    if (!user) {
      setWishes([]);
      return;
    }

    console.log('🔍 useRecentWishes - Récupération avec logique de groupe CORRIGÉE');

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
        console.error('❌ useRecentWishes - Erreur récupération groupes:', userGroupsError);
        setWishes([]);
        return;
      }

      // 2. Construire la liste des utilisateurs autorisés
      let authorizedUsers = [effectiveUserId]; // Toujours inclure l'utilisateur courant

      if (userGroupMemberships && userGroupMemberships.length > 0) {
        console.log('🔍 useRecentWishes - Utilisateur dans des groupes:', userGroupMemberships.length);
        
        // Pour chaque groupe, ajouter le créateur du groupe ET tous les membres
        for (const membership of userGroupMemberships) {
          const groupCreator = membership.invitation_groups?.created_by;
          if (groupCreator && !authorizedUsers.includes(groupCreator)) {
            authorizedUsers.push(groupCreator);
            console.log('✅ useRecentWishes - Ajout du créateur du groupe:', groupCreator);
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
        console.log('🔍 useRecentWishes - Utilisateur dans AUCUN groupe - accès limité à ses propres contenus');
      }

      console.log('✅ useRecentWishes - Utilisateurs autorisés:', {
        count: authorizedUsers.length,
        userIds: authorizedUsers
      });

      // 3. Récupérer les souhaits avec logique d'accès côté application
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
        console.error('❌ useRecentWishes - Erreur récupération wishes:', error);
        setWishes([]);
        return;
      }

      console.log('✅ useRecentWishes - Wishes récupérées côté application:', {
        count: wishesData?.length || 0,
        wishesParAuteur: wishesData?.reduce((acc, wish) => {
          const authorEmail = wish.profiles?.email || 'Email non disponible';
          if (!acc[authorEmail]) {
            acc[authorEmail] = 0;
          }
          acc[authorEmail]++;
          return acc;
        }, {} as Record<string, number>)
      });

      if (wishesData) {
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
