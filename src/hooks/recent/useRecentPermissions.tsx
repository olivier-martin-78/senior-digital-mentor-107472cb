
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useRecentPermissions = () => {
  const { hasRole, getEffectiveUserId } = useAuth();
  const [authorizedUserIds, setAuthorizedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      const effectiveUserId = getEffectiveUserId();
      if (!effectiveUserId) return;

      try {
        setLoading(true);
        let userIds = [effectiveUserId];

        if (!hasRole('admin')) {
          console.log('🔍 Utilisateur NON-ADMIN - Vérification des permissions');
          
          // Récupérer les permissions via life_story_permissions, groupes d'invitation ET album_permissions
          const [lifeStoryPermissionsResult, groupPermissionsResult, albumPermissionsResult] = await Promise.all([
            supabase
              .from('life_story_permissions')
              .select('story_owner_id')
              .eq('permitted_user_id', effectiveUserId),
            // Récupérer les créateurs de groupes dont l'utilisateur est membre
            supabase
              .from('group_members')
              .select(`
                group_id,
                invitation_groups!inner(created_by)
              `)
              .eq('user_id', effectiveUserId),
            // Récupérer les permissions d'albums
            supabase
              .from('album_permissions')
              .select(`
                album_id,
                blog_albums!inner(author_id)
              `)
              .eq('user_id', effectiveUserId)
          ]);

          const lifeStoryPermissions = lifeStoryPermissionsResult.data || [];
          const groupPermissions = groupPermissionsResult.data || [];
          const albumPermissions = albumPermissionsResult.data || [];

          console.log('🔍 Life story permissions brutes:', lifeStoryPermissionsResult);
          console.log('🔍 Group permissions brutes:', groupPermissionsResult);
          console.log('🔍 Album permissions brutes:', albumPermissionsResult);

          // Ajouter les utilisateurs autorisés via life_story_permissions
          lifeStoryPermissions.forEach(p => {
            if (p.story_owner_id && !userIds.includes(p.story_owner_id)) {
              userIds.push(p.story_owner_id);
              console.log('🔍 Ajout utilisateur autorisé via life_story:', p.story_owner_id);
            }
          });
          
          // Ajouter les créateurs de groupes
          groupPermissions.forEach(p => {
            if (p.invitation_groups?.created_by && !userIds.includes(p.invitation_groups.created_by)) {
              userIds.push(p.invitation_groups.created_by);
              console.log('🔍 Ajout utilisateur autorisé via groupe:', p.invitation_groups.created_by);
            }
          });

          // Ajouter les propriétaires d'albums autorisés
          albumPermissions.forEach(p => {
            if (p.blog_albums?.author_id && !userIds.includes(p.blog_albums.author_id)) {
              userIds.push(p.blog_albums.author_id);
              console.log('🔍 Ajout utilisateur autorisé via album:', p.blog_albums.author_id);
            }
          });

          console.log('🔍 Utilisateurs autorisés finaux:', userIds);
        }

        setAuthorizedUserIds(userIds);
      } catch (error) {
        console.error('🔍 ❌ Erreur lors de la récupération des permissions:', error);
        setAuthorizedUserIds([getEffectiveUserId() || '']);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [hasRole, getEffectiveUserId]);

  return { authorizedUserIds, loading };
};
