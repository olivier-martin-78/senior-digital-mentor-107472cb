
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useGroupPermissions } from '../useGroupPermissions';

export interface WishPost {
  id: string;
  title: string;
  content: string;
  first_name?: string;
  age?: string;
  location?: string;
  request_type?: string;
  importance?: string;
  published?: boolean;
  created_at: string;
  cover_image?: string;
  album_id?: string;
  author_id: string;
  profiles?: {
    display_name?: string | null;
    email?: string;
  };
}

export const useWishPosts = (searchTerm: string = '', albumId: string = '', startDate: string = '', endDate: string = '', wishId?: string) => {
  const [posts, setPosts] = useState<WishPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const { authorizedUserIds, loading: permissionsLoading } = useGroupPermissions();

  const fetchPosts = async () => {
    // Si nous cherchons un souhait spécifique avec l'ID "new", ne pas faire de requête
    if (wishId === 'new') {
      setLoading(false);
      return;
    }

    if (!user || permissionsLoading) {
      setPosts([]);
      setLoading(false);
      return;
    }

    if (authorizedUserIds.length === 0) {
      console.log('⚠️ useWishPosts - Aucun utilisateur autorisé');
      setPosts([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔍 useWishPosts - Récupération avec permissions de groupe');
      console.log('✅ useWishPosts - Utilisateurs autorisés:', authorizedUserIds);

      let query = supabase
        .from('wish_posts')
        .select(`
          *,
          profiles:author_id(display_name, email)
        `)
        .in('author_id', authorizedUserIds)
        .order('created_at', { ascending: false });

      // Si nous cherchons un souhait spécifique
      if (wishId && wishId !== 'new') {
        query = query.eq('id', wishId);
      }

      // Filtrer par terme de recherche
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,first_name.ilike.%${searchTerm}%`);
      }

      // Filtrer par album
      if (albumId && albumId !== 'none') {
        query = query.eq('album_id', albumId);
      }

      // Filtrer par plage de dates
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate + 'T23:59:59.999Z');
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      console.log('✅ useWishPosts - Posts récupérés:', data?.length || 0);
      setPosts(data as WishPost[]);
    } catch (error: any) {
      console.error('❌ useWishPosts - Erreur lors du chargement des souhaits:', error);
      
      // Si nous cherchons un souhait spécifique, afficher un message d'erreur spécifique
      if (wishId) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le souhait',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les souhaits',
          variant: 'destructive',
        });
      }
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!permissionsLoading) {
      fetchPosts();
    }
  }, [searchTerm, albumId, startDate, endDate, wishId, authorizedUserIds, permissionsLoading]);

  return { posts, loading, refetch: fetchPosts };
};
