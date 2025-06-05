
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BlogAlbum } from '@/types/supabase';

export const useBlogAlbums = () => {
  const { user, getEffectiveUserId } = useAuth();
  const [albums, setAlbums] = useState<BlogAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      if (!user) {
        setAlbums([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const effectiveUserId = getEffectiveUserId();
        
        console.log('🔍 useBlogAlbums - Récupération des albums avec logique de permissions de groupe');
        
        // 1. Récupérer les appartenances de l'utilisateur courant aux groupes
        const { data: userGroupMemberships, error: userGroupsError } = await supabase
          .from('group_members')
          .select('group_id, role')
          .eq('user_id', effectiveUserId);

        if (userGroupsError) {
          console.error('❌ useBlogAlbums - Erreur récupération appartenances groupes:', userGroupsError);
          setAlbums([]);
          setLoading(false);
          return;
        }

        console.log('👥 useBlogAlbums - Appartenances aux groupes:', userGroupMemberships);

        // 2. Construire la liste des utilisateurs autorisés
        let authorizedUserIds = [effectiveUserId];

        if (userGroupMemberships && userGroupMemberships.length > 0) {
          const userGroupIds = userGroupMemberships.map(g => g.group_id);
          
          // Récupérer tous les membres des groupes partagés
          const { data: groupMembers, error: groupMembersError } = await supabase
            .from('group_members')
            .select('user_id')
            .in('group_id', userGroupIds);

          if (!groupMembersError && groupMembers) {
            const allMemberIds = groupMembers.map(gm => gm.user_id);
            authorizedUserIds = [...new Set([effectiveUserId, ...allMemberIds])];
          }
        }

        console.log('🎯 useBlogAlbums - Utilisateurs autorisés:', authorizedUserIds);

        // 3. Récupérer les albums UNIQUEMENT des utilisateurs autorisés
        const { data, error } = await supabase
          .from('blog_albums')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .in('author_id', authorizedUserIds)
          .order('name');

        if (error) {
          console.error('❌ useBlogAlbums - Erreur récupération albums:', error);
          throw error;
        }

        console.log('📁 useBlogAlbums - Albums récupérés:', {
          count: data?.length || 0,
          albums: data?.map(a => ({
            id: a.id,
            name: a.name,
            author_id: a.author_id
          }))
        });

        setAlbums(data || []);
      } catch (error) {
        console.error('💥 useBlogAlbums - Erreur lors du chargement des albums:', error);
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, [user, getEffectiveUserId]);

  return { albums, loading };
};
