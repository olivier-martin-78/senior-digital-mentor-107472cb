
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
        
        console.log('🔍 useBlogAlbums - Récupération avec logique de groupe CORRIGÉE');
        
        // 1. Récupérer les groupes où l'utilisateur est membre
        const { data: userGroupMemberships, error: userGroupsError } = await supabase
          .from('group_members')
          .select(`
            group_id, 
            role,
            invitation_groups!inner(
              id,
              name,
              created_by
            )
          `)
          .eq('user_id', effectiveUserId);

        if (userGroupsError) {
          console.error('❌ useBlogAlbums - Erreur récupération groupes:', userGroupsError);
          setAlbums([]);
          setLoading(false);
          return;
        }

        console.log('👥 useBlogAlbums - Groupes de l\'utilisateur:', userGroupMemberships);

        // 2. Construire la liste des utilisateurs autorisés
        let authorizedUserIds = [effectiveUserId]; // Toujours inclure l'utilisateur courant

        if (userGroupMemberships && userGroupMemberships.length > 0) {
          // Pour chaque groupe, ajouter le créateur du groupe ET tous les membres
          for (const membership of userGroupMemberships) {
            const groupCreator = membership.invitation_groups?.created_by;
            if (groupCreator && !authorizedUserIds.includes(groupCreator)) {
              authorizedUserIds.push(groupCreator);
              console.log('✅ useBlogAlbums - Ajout du créateur du groupe:', groupCreator);
            }
          }

          // Récupérer tous les membres des groupes où l'utilisateur est présent
          const groupIds = userGroupMemberships.map(g => g.group_id);
          const { data: allGroupMembers } = await supabase
            .from('group_members')
            .select('user_id')
            .in('group_id', groupIds);

          if (allGroupMembers) {
            for (const member of allGroupMembers) {
              if (!authorizedUserIds.includes(member.user_id)) {
                authorizedUserIds.push(member.user_id);
              }
            }
          }
        }

        console.log('🎯 useBlogAlbums - Utilisateurs autorisés:', authorizedUserIds);

        // 3. Récupérer les albums créés par tous les utilisateurs autorisés
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
