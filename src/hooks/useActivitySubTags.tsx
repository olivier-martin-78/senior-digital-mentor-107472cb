
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface ActivitySubTag {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  activity_type: string;
}

export const useActivitySubTags = (activityType?: string) => {
  const [subTags, setSubTags] = useState<ActivitySubTag[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSubTags = async () => {
    if (!user || !activityType) {
      setSubTags([]);
      setLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('activity_sub_tags')
        .select('*')
        .eq('created_by', user.id)
        .eq('activity_type', activityType)
        .order('name', { ascending: true });

      if (error) throw error;
      setSubTags(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des tags:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les sous-activités',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createSubTag = async (name: string, activityType: string): Promise<ActivitySubTag | null> => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('activity_sub_tags')
        .insert([{ name, created_by: user.id, activity_type: activityType }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchSubTags(); // Refresh la liste
      return data;
    } catch (error) {
      console.error('Erreur lors de la création du tag:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la sous-activité',
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    fetchSubTags();
  }, [user, activityType]);

  return { subTags, loading, refetch: fetchSubTags, createSubTag };
};
