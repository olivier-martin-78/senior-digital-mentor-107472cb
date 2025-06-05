
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LifeStoryWithAuthor {
  id: string;
  title: string;
  user_id: string;
  chapters: any;
  created_at: string;
  updated_at: string;
  last_edited_chapter?: string;
  last_edited_question?: string;
  profiles?: {
    id: string;
    email: string;
    display_name: string;
    avatar_url?: string;
  };
}

export const useLifeStories = () => {
  const { user, getEffectiveUserId } = useAuth();
  const [stories, setStories] = useState<LifeStoryWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      if (!user) {
        setStories([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        console.log('🔍 useLifeStories - Récupération avec logique de groupe CORRIGÉE');
        
        const effectiveUserId = getEffectiveUserId();
        console.log('👤 useLifeStories - Utilisateur courant:', effectiveUserId);

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
          console.error('❌ useLifeStories - Erreur récupération groupes utilisateur:', userGroupsError);
          setStories([]);
          setLoading(false);
          return;
        }

        console.log('👥 useLifeStories - Groupes de l\'utilisateur:', userGroupMemberships);

        // 2. Construire la liste des utilisateurs autorisés
        let authorizedUserIds = [effectiveUserId]; // Toujours inclure l'utilisateur courant

        if (userGroupMemberships && userGroupMemberships.length > 0) {
          // Pour chaque groupe, ajouter le créateur du groupe ET tous les membres
          for (const membership of userGroupMemberships) {
            const groupCreator = membership.invitation_groups?.created_by;
            if (groupCreator && !authorizedUserIds.includes(groupCreator)) {
              authorizedUserIds.push(groupCreator);
              console.log('✅ useLifeStories - Ajout du créateur du groupe:', groupCreator);
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
              if (!authorizedUserIds.includes(member.user_id)) {
                authorizedUserIds.push(member.user_id);
              }
            }
          }
        }

        console.log('🎯 useLifeStories - Utilisateurs autorisés:', authorizedUserIds);

        // 3. Récupérer les histoires de vie des utilisateurs autorisés
        const { data: storiesData, error } = await supabase
          .from('life_stories')
          .select(`
            *,
            profiles(id, email, display_name, avatar_url)
          `)
          .in('user_id', authorizedUserIds)
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('❌ useLifeStories - Erreur récupération histoires:', error);
          throw error;
        }

        console.log('📚 useLifeStories - Histoires récupérées:', {
          count: storiesData?.length || 0,
          stories: storiesData?.map(s => ({
            id: s.id,
            title: s.title,
            user_id: s.user_id
          }))
        });

        setStories(storiesData || []);
      } catch (error) {
        console.error('💥 useLifeStories - Erreur lors du chargement des histoires:', error);
        setStories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, [user, getEffectiveUserId]);

  return { stories, loading };
};
