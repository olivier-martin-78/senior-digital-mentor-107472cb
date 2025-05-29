
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

      // Gestion des permissions pour les non-administrateurs
      if (!hasRole('admin')) {
        if (selectedUserId) {
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
            console.log('Pas de permissions pour voir les articles de cet utilisateur');
            setPosts([]);
            return;
          }
          
          query = query.eq('author_id', selectedUserId);
        } else {
          // Si aucun utilisateur n'est sélectionné, récupérer les permissions
          const { data: permissions, error: permError } = await supabase
            .from('life_story_permissions')
            .select('story_owner_id')
            .eq('permitted_user_id', user?.id);

          if (permError) {
            console.error('Erreur lors de la vérification des permissions:', permError);
          }

          // Créer une liste des IDs d'utilisateurs autorisés
          const authorizedUserIds = [user?.id]; // Toujours inclure l'utilisateur actuel
          if (permissions?.length) {
            permissions.forEach(p => {
              if (p.story_owner_id && !authorizedUserIds.includes(p.story_owner_id)) {
                authorizedUserIds.push(p.story_owner_id);
              }
            });
          }

          // Filtrer par les utilisateurs autorisés
          query = query.in('author_id', authorizedUserIds);
        }
      } else {
        // Pour les admins, appliquer le filtre utilisateur s'il est sélectionné
        if (selectedUserId) {
          query = query.eq('author_id', selectedUserId);
        }
      }

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }

      if (selectedAlbum) {
        query = query.eq('album_id', selectedAlbum);
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
      console.log('Posts récupérés:', data?.length || 0);
      setPosts(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error);
      setPosts([]);
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

      // Gestion des permissions pour les albums
      if (!hasRole('admin')) {
        if (selectedUserId) {
          // Vérifier les permissions si l'utilisateur n'est pas admin
          if (selectedUserId !== user?.id) {
            const { data: permissions, error: permError } = await supabase
              .from('life_story_permissions')
              .select('story_owner_id')
              .eq('permitted_user_id', user?.id)
              .eq('story_owner_id', selectedUserId);

            if (permError || !permissions?.length) {
              console.log('Pas de permissions pour voir les albums de cet utilisateur');
              setAlbums([]);
              return;
            }
          }
          
          query = query.eq('author_id', selectedUserId);
        } else {
          // Récupérer les permissions pour tous les utilisateurs autorisés
          const { data: permissions, error: permError } = await supabase
            .from('life_story_permissions')
            .select('story_owner_id')
            .eq('permitted_user_id', user?.id);

          if (permError) {
            console.error('Erreur lors de la vérification des permissions:', permError);
          }

          // Créer une liste des IDs d'utilisateurs autorisés
          const authorizedUserIds = [user?.id]; // Toujours inclure l'utilisateur actuel
          if (permissions?.length) {
            permissions.forEach(p => {
              if (p.story_owner_id && !authorizedUserIds.includes(p.story_owner_id)) {
                authorizedUserIds.push(p.story_owner_id);
              }
            });
          }

          // Filtrer par les utilisateurs autorisés
          query = query.in('author_id', authorizedUserIds);
        }
      } else {
        // Pour les admins, appliquer le filtre utilisateur s'il est sélectionné
        if (selectedUserId) {
          query = query.eq('author_id', selectedUserId);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      console.log('Albums récupérés:', data?.length || 0);
      setAlbums(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des albums:', error);
      setAlbums([]);
    }
  };

  return {
    posts,
    albums,
    loading,
    hasCreatePermission
  };
};
