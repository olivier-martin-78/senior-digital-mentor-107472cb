
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
      
      if (hasRole('admin')) {
        // Les admins voient tout (publié et non publié)
        console.log('useBlogData - Mode admin: voir tous les posts');
        let query = supabase
          .from('blog_posts')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .order('created_at', { ascending: false });

        if (selectedUserId) {
          query = query.eq('author_id', selectedUserId);
        }

        // Appliquer les filtres pour admin
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
        console.log('useBlogData - Posts récupérés (admin):', data?.length || 0);
        setPosts(data || []);
        return;
      }

      // Pour les utilisateurs non-admin
      if (selectedUserId && selectedUserId !== user?.id) {
        // Vérifier les permissions pour voir les posts de cet utilisateur
        const { data: groupPermissions, error: groupError } = await supabase
          .from('group_members')
          .select(`
            group_id,
            invitation_groups!inner(created_by)
          `)
          .eq('user_id', user?.id);

        if (groupError) {
          console.error('useBlogData - Erreur groupes:', groupError);
          setPosts([]);
          return;
        }

        const groupCreators = groupPermissions?.map(p => p.invitation_groups.created_by) || [];
        const hasGroupPermission = groupCreators.includes(selectedUserId);

        if (hasGroupPermission) {
          console.log('useBlogData - Permissions trouvées pour utilisateur sélectionné');
          let query = supabase
            .from('blog_posts')
            .select(`
              *,
              profiles(id, display_name, email, avatar_url, created_at)
            `)
            .eq('author_id', selectedUserId)
            .eq('published', true)
            .order('created_at', { ascending: false });

          // Appliquer les filtres
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
          console.log('useBlogData - Posts utilisateur autorisé récupérés:', data?.length || 0);
          setPosts(data || []);
        } else {
          console.log('useBlogData - Pas de permissions pour voir les articles de cet utilisateur');
          setPosts([]);
        }
        return;
      }

      // Récupération avec permissions des groupes d'invitation
      console.log('useBlogData - Récupération des posts avec permissions groupes');
      
      // 1. Récupérer ses propres posts (TOUS, publiés ET brouillons)
      let userPostsQuery = supabase
        .from('blog_posts')
        .select(`
          *,
          profiles(id, display_name, email, avatar_url, created_at)
        `)
        .eq('author_id', user?.id)
        .order('created_at', { ascending: false });

      // Appliquer les filtres aux posts utilisateur
      if (searchTerm) {
        userPostsQuery = userPostsQuery.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
      }
      if (selectedAlbum) {
        userPostsQuery = userPostsQuery.eq('album_id', selectedAlbum);
      }
      if (startDate) {
        userPostsQuery = userPostsQuery.gte('created_at', startDate);
      }
      if (endDate) {
        const endDateTime = endDate + 'T23:59:59';
        userPostsQuery = userPostsQuery.lte('created_at', endDateTime);
      }

      const { data: userPosts, error: userPostsError } = await userPostsQuery;
      
      if (userPostsError) {
        console.error('useBlogData - Erreur lors de la récupération des posts utilisateur:', userPostsError);
        setPosts([]);
        return;
      }

      console.log('useBlogData - Posts utilisateur récupérés:', userPosts?.length || 0);

      // 2. Récupérer les utilisateurs autorisés via les groupes d'invitation
      const { data: groupPermissions, error: groupError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          invitation_groups!inner(created_by)
        `)
        .eq('user_id', user?.id);

      if (groupError) {
        console.error('useBlogData - Erreur groupes:', groupError);
        setPosts(userPosts || []);
        return;
      }

      // IDs des utilisateurs autorisés via les groupes d'invitation (créateurs des groupes)
      const groupCreatorIds = groupPermissions?.map(p => p.invitation_groups.created_by).filter(id => id !== user?.id) || [];
      
      console.log('useBlogData - Utilisateurs autorisés via groupes:', groupCreatorIds);

      let otherPosts: PostWithAuthor[] = [];

      // 3. Récupérer les posts des autres utilisateurs autorisés
      if (groupCreatorIds.length > 0) {
        let otherPostsQuery = supabase
          .from('blog_posts')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .eq('published', true) // SEULEMENT les posts publiés des autres
          .in('author_id', groupCreatorIds)
          .order('created_at', { ascending: false });

        // Appliquer les filtres aux autres posts
        if (searchTerm) {
          otherPostsQuery = otherPostsQuery.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`);
        }
        if (selectedAlbum) {
          otherPostsQuery = otherPostsQuery.eq('album_id', selectedAlbum);
        }
        if (startDate) {
          otherPostsQuery = otherPostsQuery.gte('created_at', startDate);
        }
        if (endDate) {
          const endDateTime = endDate + 'T23:59:59';
          otherPostsQuery = otherPostsQuery.lte('created_at', endDateTime);
        }

        const { data: otherPostsData, error: otherPostsError } = await otherPostsQuery;
        
        if (otherPostsError) {
          console.error('useBlogData - Erreur lors de la récupération des autres posts:', otherPostsError);
        } else {
          otherPosts = otherPostsData || [];
          console.log('useBlogData - Autres posts autorisés récupérés:', otherPosts.length);
        }
      }

      // Combiner ses posts avec les posts autorisés des autres
      const allPosts = [...(userPosts || []), ...otherPosts];
      
      // Trier par date de création (plus récent en premier)
      allPosts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log('useBlogData - Total posts finaux:', allPosts.length);
      setPosts(allPosts);
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
      
      if (hasRole('admin')) {
        // Les admins voient tous les albums
        console.log('useBlogData - Admin: voir tous les albums');
        let query = supabase
          .from('blog_albums')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .order('name');

        if (selectedUserId) {
          query = query.eq('author_id', selectedUserId);
        }

        const { data, error } = await query;
        if (error) throw error;
        console.log('useBlogData - Albums récupérés (admin):', data?.length || 0);
        setAlbums(data || []);
        return;
      }

      // Pour les utilisateurs non-admin
      if (selectedUserId && selectedUserId !== user?.id) {
        // Vérifier les permissions groupes pour cet utilisateur
        const { data: groupPermissions, error: groupError } = await supabase
          .from('group_members')
          .select(`
            group_id,
            invitation_groups!inner(created_by)
          `)
          .eq('user_id', user?.id);

        if (groupError) {
          console.error('useBlogData - Erreur groupes albums:', groupError);
          setAlbums([]);
          return;
        }

        const groupCreators = groupPermissions?.map(p => p.invitation_groups.created_by) || [];
        const hasGroupPermission = groupCreators.includes(selectedUserId);

        if (hasGroupPermission) {
          const { data, error } = await supabase
            .from('blog_albums')
            .select(`
              *,
              profiles(id, display_name, email, avatar_url, created_at)
            `)
            .eq('author_id', selectedUserId)
            .order('name');

          if (error) throw error;
          console.log('useBlogData - Albums utilisateur autorisé récupérés:', data?.length || 0);
          setAlbums(data || []);
        } else {
          console.log('useBlogData - Pas de permissions pour voir les albums de cet utilisateur');
          setAlbums([]);
        }
        return;
      }

      // Récupérer les albums avec permissions groupes
      // 1. Ses propres albums
      const { data: userAlbums, error: userAlbumsError } = await supabase
        .from('blog_albums')
        .select(`
          *,
          profiles(id, display_name, email, avatar_url, created_at)
        `)
        .eq('author_id', user?.id)
        .order('name');

      if (userAlbumsError) {
        console.error('useBlogData - Erreur albums utilisateur:', userAlbumsError);
        setAlbums([]);
        return;
      }

      // 2. Récupérer les créateurs de groupes dont l'utilisateur est membre
      const { data: groupPermissions, error: groupError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          invitation_groups!inner(created_by)
        `)
        .eq('user_id', user?.id);

      if (groupError) {
        console.error('useBlogData - Erreur groupes albums:', groupError);
        setAlbums(userAlbums || []);
        return;
      }

      // IDs des utilisateurs autorisés via les groupes d'invitation (créateurs des groupes)
      const groupCreatorIds = groupPermissions?.map(p => p.invitation_groups.created_by).filter(id => id !== user?.id) || [];

      console.log('useBlogData - Albums - Utilisateurs autorisés via groupes:', groupCreatorIds);

      let otherAlbums: BlogAlbum[] = [];

      // 3. Récupérer les albums des autres utilisateurs autorisés
      if (groupCreatorIds.length > 0) {
        const { data: otherAlbumsData, error: otherAlbumsError } = await supabase
          .from('blog_albums')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .in('author_id', groupCreatorIds)
          .order('name');

        if (otherAlbumsError) {
          console.error('useBlogData - Erreur autres albums:', otherAlbumsError);
        } else {
          otherAlbums = otherAlbumsData || [];
          console.log('useBlogData - Autres albums autorisés récupérés:', otherAlbums.length);
        }
      }

      // Combiner ses albums avec les albums autorisés des autres
      const allAlbums = [...(userAlbums || []), ...otherAlbums];
      
      console.log('useBlogData - Total albums finaux:', allAlbums.length);
      setAlbums(allAlbums);
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
