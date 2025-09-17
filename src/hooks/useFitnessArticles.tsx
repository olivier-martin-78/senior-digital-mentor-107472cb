import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOptionalAuth } from '@/hooks/useOptionalAuth';
import { useToast } from '@/hooks/use-toast';
import type { FitnessArticle, FitnessArticleWithCategory } from '@/types/fitness';

export const useFitnessArticles = (filters?: {
  categoryId?: string;
  limit?: number;
  published?: boolean;
  orderBy?: 'created_at' | 'view_count';
  ascending?: boolean;
}) => {
  const { user } = useOptionalAuth();
  const { toast } = useToast();
  const [articles, setArticles] = useState<FitnessArticleWithCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('fitness_articles')
        .select(`
          *,
          fitness_categories!inner (
            id,
            name,
            is_predefined
          )
        `);

      // Apply ordering
      const orderField = filters?.orderBy || 'created_at';
      const ascending = filters?.ascending || false;
      query = query.order(orderField, { ascending });

      if (filters?.published !== undefined) {
        query = query.eq('published', filters.published);
      }

      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      setArticles(data || []);
    } catch (error: any) {
      console.error('Error fetching fitness articles:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les articles',
        variant: 'destructive',
      });
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [filters?.categoryId, filters?.limit, filters?.published, filters?.orderBy, filters?.ascending]);

  return {
    articles,
    loading,
    refetch: fetchArticles
  };
};

export const useFitnessArticle = (id: string) => {
  const { toast } = useToast();
  const [article, setArticle] = useState<FitnessArticleWithCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('fitness_articles')
          .select(`
            *,
            fitness_categories!inner (
              id,
              name,
              is_predefined
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        setArticle(data);

        // Increment view count
        if (data?.published) {
          await supabase.rpc('increment_fitness_article_views', {
            article_id_param: id,
            user_id_param: null, // We'll handle user tracking later if needed
            ip_address_param: null
          });
        }
      } catch (error: any) {
        console.error('Error fetching fitness article:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger l\'article',
          variant: 'destructive',
        });
        setArticle(null);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id, toast]);

  return {
    article,
    loading
  };
};