
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Activity {
  id: string;
  activity_type: string;
  title: string;
  link: string;
  iframe_code?: string;
  thumbnail_url?: string;
  activity_date?: string;
  created_at: string;
  created_by: string;
  sub_activity_tag_id?: string;
  shared_globally?: boolean;
  activity_sub_tags?: {
    id: string;
    name: string;
  };
}

export const useActivities = (activityType: string) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, hasRole } = useAuth();

  const fetchActivities = async () => {
    try {
      setLoading(true);
      console.log('🔍 Récupération des activités pour le type:', activityType);

      let query = supabase
        .from('activities')
        .select(`
          *,
          activity_sub_tags (
            id,
            name
          )
        `)
        .eq('activity_type', activityType)
        .order('created_at', { ascending: false });

      // Si l'utilisateur est connecté et n'est pas admin
      if (user && !hasRole('admin')) {
        // Récupérer les activités de l'utilisateur ET les activités partagées globalement
        query = query.or(`created_by.eq.${user.id},shared_globally.eq.true`);
      } else if (!user) {
        // Si l'utilisateur n'est pas connecté, ne montrer que les activités partagées globalement
        query = query.eq('shared_globally', true);
      }
      // Si l'utilisateur est admin, il voit tout (pas de filtre supplémentaire)

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erreur lors du chargement des activités:', error);
        throw error;
      }

      console.log('✅ Activités récupérées:', {
        count: data?.length || 0,
        type: activityType,
        user: user?.id,
        isAdmin: hasRole('admin'),
        activities: data
      });

      setActivities(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des activités:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les activités',
        variant: 'destructive',
      });
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activityType) {
      console.log('🔄 Changement de type d\'activité:', activityType);
      fetchActivities();
    }
  }, [activityType, user]);

  const canEditActivity = (activity: Activity) => {
    if (!user) return false;
    
    // L'utilisateur peut éditer ses propres activités ou si c'est un admin
    return hasRole('admin') || activity.created_by === user.id;
  };

  return { activities, loading, refetch: fetchActivities, canEditActivity };
};
