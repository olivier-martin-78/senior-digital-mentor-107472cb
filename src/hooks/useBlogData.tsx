
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
      console.log('useBlogData - Début fetchPosts pour user:', user?.id, 'selectedUserId:', selectedUserId);
      
      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          profiles(id, display_name, email, avatar_url, created_at)
        `)
        .order('created_at', { ascending: false });

      // Gestion des permissions pour les posts
      if (hasRole('admin')) {
        // Les admins voient tout (publié et non publié)
        console.log('useBlogData - Mode admin: voir tous les posts');
        if (selectedUserId) {
          query = query.eq('author_id', selectedUserId);
        }
      } else {
        console.log('useBlogData - Mode utilisateur normal');
        
        if (selectedUserId && selectedUserId !== user?.id) {
          // Vérifier les permissions life_story pour cet utilisateur
          const { data: permissions, error: permError } = await supabase
            .from('life_story_permissions')
            .select('story_owner_id')
            .eq('permitted_user_id', user?.id)
            .eq('story_owner_id', selectedUserId);

          if (permError || !permissions?.length) {
            console.log('useBlogData - Pas de permissions pour voir les articles de cet utilisateur');
            setPosts([]);
            return;
          }
          
          // Voir seulement les posts publiés de cet utilisateur
          query = query.eq('author_id', selectedUserId).eq('published', true);
        } else {
          // Récupérer ses propres posts (publiés ET non publiés) + posts autorisés des autres
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

          console.log('useBlogData - Utilisateurs autorisés:', authorizedUserIds);
          console.log('useBlogData - Albums autorisés:', authorizedAlbumIds);

          // Construire la requête avec les permissions
          let filterConditions = [];
          
          // Ses propres posts (publiés ET non publiés)
          filterConditions.push(`author_id.eq.${user?.id}`);
          
          // Posts publiés des autres utilisateurs autorisés
          const otherAuthorizedUsers = authorizedUserIds.filter(id => id !== user?.id);
          if (otherAuthorizedUsers.length > 0) {
            filterConditions.push(`and(author_id.in.(${otherAuthorizedUsers.join(',')}),published.eq.true)`);
          }
          
          // Posts dans des albums autorisés (seulement publiés)
          if (authorizedAlbumIds.length > 0) {
            filterConditions.push(`and(album_id.in.(${authorizedAlbumIds.join(',')}),published.eq.true)`);
          }

          if (filterConditions.length > 0) {
            query = query.or(filterConditions.join(','));
          } else {
            // Fallback: seulement ses propres posts
            query = query.eq('author_id', user?.id);
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
      console.log('useBlogData - Posts récupérés:', data?.length || 0);
      setPosts(data || []);
    } catch (error) {
      console.error('useBlogData - Erreur lors du chargement des articles:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      console.log('useBlogData - Début fetchAlbums');
      
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
        console.log('useBlogData - Admin: voir tous les albums');
        if (selectedUserId) {
          query = query.eq('author_id', selectedUserId);
        }
      } else {
        console.log('useBlogData - Utilisateur normal: filtrage par permissions');
        
        if (selectedUserId && selectedUserId !== user?.id) {
          // Vérifier les permissions life_story pour cet utilisateur
          const { data: permissions, error: permError } = await supabase
            .from('life_story_permissions')
            .select('story_owner_id')
            .eq('permitted_user_id', user?.id)
            .eq('story_owner_id', selectedUserId);

          if (permError || !permissions?.length) {
            console.log('useBlogData - Pas de permissions pour voir les albums de cet utilisateur');
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

          console.log('useBlogData - Albums - Utilisateurs autorisés:', authorizedUserIds);
          console.log('useBlogData - Albums - IDs d\'albums autorisés:', authorizedAlbumIds);

          // Construire la requête avec les permissions
          let filterConditions = [];
          
          // Albums de l'utilisateur et des utilisateurs autorisés
          filterConditions.push(`author_id.in.(${authorizedUserIds.join(',')})`);
          
          // Albums autorisés directement
          if (authorizedAlbumIds.length > 0) {
            filterConditions.push(`id.in.(${authorizedAlbumIds.join(',')})`);
          }

          if (filterConditions.length > 0) {
            query = query.or(filterConditions.join(','));
          } else {
            // Fallback: seulement ses propres albums
            query = query.eq('author_id', user?.id);
          }
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      console.log('useBlogData - Albums récupérés:', data?.length || 0);
      setAlbums(data || []);
    } catch (error) {
      console.error('useBlogData - Erreur lors du chargement des albums:', error);
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
