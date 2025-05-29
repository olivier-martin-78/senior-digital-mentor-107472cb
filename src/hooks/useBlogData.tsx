
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

      // Gestion des permissions pour les posts
      if (hasRole('admin')) {
        // Les admins voient tout
        if (selectedUserId) {
          query = query.eq('author_id', selectedUserId);
        }
      } else {
        // Pour les non-admins
        if (selectedUserId && selectedUserId !== user?.id) {
          // Vérifier les permissions life_story pour cet utilisateur
          const { data: permissions, error: permError } = await supabase
            .from('life_story_permissions')
            .select('story_owner_id')
            .eq('permitted_user_id', user?.id)
            .eq('story_owner_id', selectedUserId);

          if (permError || !permissions?.length) {
            console.log('Pas de permissions pour voir les articles de cet utilisateur');
            setPosts([]);
            return;
          }
          
          query = query.eq('author_id', selectedUserId);
        } else {
          // Récupérer les permissions album ET life_story
          const [albumPermissionsResult, lifeStoryPermissionsResult] = await Promise.all([
            supabase
              .from('album_permissions')
              .select('album_id')
              .eq('user_id', user?.id),
            supabase
              .from('life_story_permissions')
              .select('story_owner_id')
              .eq('permitted_user_id', user?.id)
          ]);

          const albumPermissions = albumPermissionsResult.data || [];
          const lifeStoryPermissions = lifeStoryPermissionsResult.data || [];

          // Créer une liste des IDs d'utilisateurs autorisés
          const authorizedUserIds = [user?.id];
          lifeStoryPermissions.forEach(p => {
            if (p.story_owner_id && !authorizedUserIds.includes(p.story_owner_id)) {
              authorizedUserIds.push(p.story_owner_id);
            }
          });

          // Récupérer les albums autorisés
          const authorizedAlbumIds = albumPermissions.map(p => p.album_id).filter(Boolean);

          console.log('Utilisateurs autorisés:', authorizedUserIds);
          console.log('Albums autorisés:', authorizedAlbumIds);

          // Construire la requête avec les permissions
          if (authorizedAlbumIds.length > 0) {
            // Posts de l'utilisateur OU posts dans des albums autorisés OU posts des utilisateurs autorisés
            const userFilter = `author_id.in.(${authorizedUserIds.join(',')})`;
            const albumFilter = `album_id.in.(${authorizedAlbumIds.join(',')})`;
            query = query.or(`${userFilter},${albumFilter}`);
          } else {
            // Seulement les posts des utilisateurs autorisés
            query = query.in('author_id', authorizedUserIds);
          }
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
      if (hasRole('admin')) {
        // Les admins voient tous les albums
        if (selectedUserId) {
          query = query.eq('author_id', selectedUserId);
        }
      } else {
        // Pour les non-admins
        if (selectedUserId && selectedUserId !== user?.id) {
          // Vérifier les permissions life_story pour cet utilisateur
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
          
          query = query.eq('author_id', selectedUserId);
        } else {
          // Récupérer les permissions album ET life_story
          const [albumPermissionsResult, lifeStoryPermissionsResult] = await Promise.all([
            supabase
              .from('album_permissions')
              .select('album_id, blog_albums!inner(author_id)')
              .eq('user_id', user?.id),
            supabase
              .from('life_story_permissions')
              .select('story_owner_id')
              .eq('permitted_user_id', user?.id)
          ]);

          const albumPermissions = albumPermissionsResult.data || [];
          const lifeStoryPermissions = lifeStoryPermissionsResult.data || [];

          // Créer une liste des IDs d'utilisateurs autorisés
          const authorizedUserIds = [user?.id];
          lifeStoryPermissions.forEach(p => {
            if (p.story_owner_id && !authorizedUserIds.includes(p.story_owner_id)) {
              authorizedUserIds.push(p.story_owner_id);
            }
          });

          // Récupérer les albums autorisés directement
          const authorizedAlbumIds = albumPermissions.map(p => p.album_id).filter(Boolean);

          // Récupérer les auteurs d'albums autorisés via permissions
          const albumAuthorIds = albumPermissions
            .map(p => p.blog_albums?.author_id)
            .filter(Boolean);
          
          albumAuthorIds.forEach(authorId => {
            if (!authorizedUserIds.includes(authorId)) {
              authorizedUserIds.push(authorId);
            }
          });

          console.log('Albums - Utilisateurs autorisés:', authorizedUserIds);
          console.log('Albums - IDs d\'albums autorisés:', authorizedAlbumIds);

          // Construire la requête avec les permissions
          if (authorizedAlbumIds.length > 0) {
            // Albums de l'utilisateur OU albums autorisés OU albums des utilisateurs autorisés
            const userFilter = `author_id.in.(${authorizedUserIds.join(',')})`;
            const albumFilter = `id.in.(${authorizedAlbumIds.join(',')})`;
            query = query.or(`${userFilter},${albumFilter}`);
          } else {
            // Seulement les albums des utilisateurs autorisés
            query = query.in('author_id', authorizedUserIds);
          }
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
