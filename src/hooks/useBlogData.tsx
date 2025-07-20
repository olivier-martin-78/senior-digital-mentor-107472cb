
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
  selectedCategories: string[] = []
) => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  
  const { posts, loading: postsLoading } = useBlogPosts(
    searchTerm, 
    albumId, 
    startDate, 
    endDate,
    selectedCategories
  );
  const { albums, loading: albumsLoading } = useBlogAlbums();

  // Corriger la logique pour inclure le rôle "professionnel"
  const hasCreatePermission = user && (hasRole('admin') || hasRole('editor') || hasRole('professionnel'));

  // Récupérer seulement les catégories qui ont des posts visibles par l'utilisateur
  const fetchCategories = async () => {
    if (!user) {
      setCategories([]);
      setLoadingCategories(false);
      return;
    }

    try {
      setLoadingCategories(true);
      
      // Récupérer les catégories qui ont au moins un post visible par l'utilisateur
      const { data, error } = await supabase
        .from('blog_categories')
        .select(`
          *,
          post_categories!inner(
            blog_posts!inner(
              id
            )
          )
        `)
        .order('name');

      if (error) throw error;

      // Dédoublonner les catégories car il peut y avoir plusieurs posts par catégorie
      const uniqueCategories = data?.reduce((acc: BlogCategory[], category) => {
        if (!acc.find(c => c.id === category.id)) {
          acc.push({
            id: category.id,
            name: category.name,
            created_by: category.created_by,
            created_at: category.created_at
          });
        }
        return acc;
      }, []) || [];

      setCategories(uniqueCategories);
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
    // Pour le refetch des posts, on va forcer un re-render en mettant à jour une clé
    // Ceci est une solution temporaire - idéalement useBlogPosts devrait exposer refetch
    fetchCategories();
    window.location.reload(); // Solution simple pour forcer le rechargement
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
