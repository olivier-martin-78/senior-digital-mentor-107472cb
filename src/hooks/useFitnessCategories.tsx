import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { FitnessCategory } from '@/types/fitness';

export const useFitnessCategories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<FitnessCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('fitness_categories')
        .select('*')
        .order('is_predefined', { ascending: false })
        .order('name');

      if (error) throw error;

      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching fitness categories:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les catégories',
        variant: 'destructive',
      });
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (name: string) => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour créer une catégorie',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('fitness_categories')
        .insert({
          name,
          is_predefined: false,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Catégorie créée avec succès',
      });

      fetchCategories(); // Refresh the list
      return data;
    } catch (error: any) {
      console.error('Error creating fitness category:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la catégorie',
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    refetch: fetchCategories,
    createCategory
  };
};