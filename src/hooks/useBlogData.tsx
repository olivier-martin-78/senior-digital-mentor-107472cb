
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithAuthor, BlogAlbum } from '@/types/supabase';

export const useBlogData = (searchTerm: string, selectedAlbum: string, startDate?: string, endDate?: string, selectedUserId?: string | null) => {
  const { user, hasRole } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [albums, setAlbums] = useState<BlogAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  const hasCreatePermission = hasRole('editor') || hasRole('admin');

  useEffect(() => {
    Promise.all([fetchPosts(), fetchAlbums()]);
  }, [searchTerm, selectedAlbum, startDate, endDate, selectedUserId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          profiles(id, display_name, email, avatar_url, created_at)
        `)
        .eq('published', true)
        .order('created_at', { ascending: false });

      // Filtrer selon les permissions life-story si l'utilisateur n'est pas admin
      if (!hasRole('admin') && selectedUserId) {
        // Vérifier si l'utilisateur a les permissions pour voir les articles de cet utilisateur
        const { data: permissions, error: permError } = await supabase
          .from('life_story_permissions')
          .select('story_owner_id')
          .eq('permitted_user_id', user?.id)
          .eq('story_owner_id', selectedUserId);

        if (permError) {
          console.error('Erreur lors de la vérification des permissions:', permError);
        }

        // Si l'utilisateur n'a pas de permissions ET ce n'est pas son propre contenu, ne rien afficher
        if (!permissions?.length && selectedUserId !== user?.id) {
          setPosts([]);
          return;
        }
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      if (selectedAlbum) {
        query = query.eq('album_id', selectedAlbum);
      }

      if (selectedUserId) {
        query = query.eq('author_id', selectedUserId);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        const endDateTime = endDate + 'T23:59:59';
        query = query.lte('created_at', endDateTime);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      let query = supabase
        .from('blog_albums')
        .select(`
          *,
          profiles(id, display_name, email, avatar_url, created_at)
        `)
        .order('name');

      // Filtrer les albums par utilisateur si sélectionné ET selon les permissions
      if (selectedUserId) {
        // Vérifier les permissions si l'utilisateur n'est pas admin
        if (!hasRole('admin') && selectedUserId !== user?.id) {
          const { data: permissions, error: permError } = await supabase
            .from('life_story_permissions')
            .select('story_owner_id')
            .eq('permitted_user_id', user?.id)
            .eq('story_owner_id', selectedUserId);

          if (permError || !permissions?.length) {
            setAlbums([]);
            return;
          }
        }
        
        query = query.eq('author_id', selectedUserId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAlbums(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des albums:', error);
    }
  };

  return {
    posts,
    albums,
    loading,
    hasCreatePermission
  };
};
