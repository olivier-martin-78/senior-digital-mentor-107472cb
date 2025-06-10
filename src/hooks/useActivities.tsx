
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface Activity {
  id: string;
  activity_type: string;
  title: string;
  link: string;
  thumbnail_url?: string;
  activity_date?: string;
  created_at: string;
  created_by: string;
  sub_activity_tag_id?: string;
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
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
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

      // Si l'utilisateur n'est pas admin, ne montrer que ses propres activités
      if (!hasRole('admin')) {
        query = query.eq('created_by', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des activités:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les activités',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [activityType, user]);

  const canEditActivity = (activity: Activity) => {
    return user && (hasRole('admin') || activity.created_by === user.id);
  };

  return { activities, loading, refetch: fetchActivities, canEditActivity };
};
