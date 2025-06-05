
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGroupPermissions } from '../useGroupPermissions';

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
  const { user } = useAuth();
  const [stories, setStories] = useState<LifeStoryWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const { authorizedUserIds, loading: permissionsLoading } = useGroupPermissions();

  useEffect(() => {
    if (!user || permissionsLoading) {
      setStories([]);
      setLoading(permissionsLoading);
      return;
    }

    fetchStories();
  }, [user, authorizedUserIds, permissionsLoading]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 useLifeStories - Récupération avec permissions de groupe');
      console.log('🎯 useLifeStories - Utilisateurs autorisés:', authorizedUserIds);

      if (authorizedUserIds.length === 0) {
        console.log('⚠️ useLifeStories - Aucun utilisateur autorisé');
        setStories([]);
        return;
      }

      // Récupérer les histoires de vie des utilisateurs autorisés
      const { data: storiesData, error } = await supabase
        .from('life_stories')
        .select(`
          id,
          title,
          user_id,
          chapters,
          created_at,
          updated_at,
          last_edited_chapter,
          last_edited_question
        `)
        .in('user_id', authorizedUserIds)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ useLifeStories - Erreur récupération histoires:', error);
        throw error;
      }

      if (storiesData && storiesData.length > 0) {
        console.log('📚 useLifeStories - Histoires récupérées:', storiesData.length);

        // Récupérer les profils séparément
        const userIds = [...new Set(storiesData.map(story => story.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, email, display_name, avatar_url')
          .in('id', userIds);

        // Joindre les données
        const storiesWithProfiles = storiesData.map(story => ({
          ...story,
          profiles: profilesData?.find(profile => profile.id === story.user_id)
        }));

        setStories(storiesWithProfiles);
      } else {
        console.log('📚 useLifeStories - Aucune histoire trouvée');
        setStories([]);
      }
    } catch (error) {
      console.error('💥 useLifeStories - Erreur lors du chargement des histoires:', error);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  return { stories, loading };
};
