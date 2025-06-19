
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useBlogPosts } from './blog/useBlogPosts';
import { useBlogAlbums } from './blog/useBlogAlbums';
import { BlogCategory } from '@/types/supabase';

export const useBlogData = (
  searchTerm: string = '', 
  albumId: string = '', 
  startDate: string = '', 
  endDate: string = '', 
  categoryId: string | null = null
) => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  const { posts, loading: postsLoading, refetch: refetchPosts } = useBlogPosts(
    searchTerm, 
    albumId, 
    startDate, 
    endDate, 
    categoryId
  );
  const { albums, loading: albumsLoading } = useBlogAlbums();

  const hasCreatePermission = user && (hasRole('admin') || hasRole('editor'));

  // Récupérer les catégories
  const fetchCategories = async () => {
    if (!user) {
      setCategories([]);
      setLoadingCategories(false);
      return;
    }

    try {
      setLoadingCategories(true);
      
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name');

      if (error) throw error;

      setCategories(data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des catégories:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les catégories',
        variant: 'destructive',
      });
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  const refetch = () => {
    refetchPosts();
    fetchCategories();
  };

  return {
    posts,
    albums,
    categories,
    loading: postsLoading || albumsLoading || loadingCategories,
    hasCreatePermission,
    refetch
  };
};
