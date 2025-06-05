
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
        
        // 1. Récupérer les groupes créés PAR l'utilisateur courant (il est inviteur)
        const { data: ownGroups, error: ownGroupsError } = await supabase
          .from('invitation_groups')
          .select('id')
          .eq('created_by', effectiveUserId);

        if (ownGroupsError) {
          console.error('❌ useBlogAlbums - Erreur récupération groupes créés:', ownGroupsError);
          setAlbums([]);
          setLoading(false);
          return;
        }

        console.log('👤 useBlogAlbums - Groupes créés par l\'utilisateur:', ownGroups);

        // 2. Construire la liste des utilisateurs autorisés
        // Commencer avec l'utilisateur courant (ses propres albums)
        let authorizedUserIds = [effectiveUserId];

        // Si l'utilisateur a créé des groupes, ajouter tous les membres de ces groupes
        if (ownGroups && ownGroups.length > 0) {
          const ownGroupIds = ownGroups.map(g => g.id);
          
          // Récupérer tous les membres des groupes créés par l'utilisateur
          const { data: groupMembers, error: groupMembersError } = await supabase
            .from('group_members')
            .select('user_id')
            .in('group_id', ownGroupIds)
            .neq('user_id', effectiveUserId); // Exclure l'utilisateur courant pour éviter les doublons

          if (!groupMembersError && groupMembers && groupMembers.length > 0) {
            const memberIds = groupMembers.map(gm => gm.user_id);
            authorizedUserIds = [effectiveUserId, ...memberIds];
          }
        }

        // 3. Récupérer aussi les groupes DONT l'utilisateur est membre (il est invité)
        const { data: memberGroups, error: memberGroupsError } = await supabase
          .from('group_members')
          .select('group_id, invitation_groups!inner(created_by)')
          .eq('user_id', effectiveUserId);

        if (!memberGroupsError && memberGroups && memberGroups.length > 0) {
          // Ajouter les créateurs des groupes dont on est membre
          const groupCreators = memberGroups.map(gm => gm.invitation_groups.created_by);
          authorizedUserIds = [...new Set([...authorizedUserIds, ...groupCreators])];
        }

        console.log('🎯 useBlogAlbums - Utilisateurs autorisés:', authorizedUserIds);

        // 4. Récupérer les albums créés par tous les utilisateurs autorisés
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
