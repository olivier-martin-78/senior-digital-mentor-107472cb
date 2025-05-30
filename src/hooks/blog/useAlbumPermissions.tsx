
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BlogAlbum } from '@/types/supabase';
import { useToast } from '@/hooks/use-toast';

export const useAlbumPermissions = (allAlbums: BlogAlbum[]) => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [accessibleAlbums, setAccessibleAlbums] = useState<BlogAlbum[]>([]);

  useEffect(() => {
    const getAccessibleAlbums = async () => {
      if (!user) {
        console.log('AlbumPermissions - Pas d\'utilisateur connecté');
        setAccessibleAlbums([]);
        return;
      }

      try {
        console.log('AlbumPermissions - Chargement des albums accessibles pour user:', user.id);
        console.log('AlbumPermissions - Email utilisateur:', user.email);
        console.log('AlbumPermissions - Rôles:', { hasAdmin: hasRole('admin'), hasEditor: hasRole('editor') });
        console.log('AlbumPermissions - Tous les albums disponibles:', allAlbums.map(a => ({ id: a.id, name: a.name, author_id: a.author_id })));

        if (hasRole('admin')) {
          // Seuls les administrateurs voient automatiquement tous les albums
          console.log('AlbumPermissions - Administrateur: tous les albums visibles');
          setAccessibleAlbums(allAlbums);
        } else {
          // Pour les éditeurs et utilisateurs normaux, vérification stricte des permissions
          console.log('AlbumPermissions - Éditeur/Utilisateur: vérification stricte des permissions');
          
          // Récupérer les permissions d'albums pour cet utilisateur
          const { data: albumPermissions, error: permissionsError } = await supabase
            .from('album_permissions')
            .select('*')
            .eq('user_id', user.id);

          if (permissionsError) {
            console.error('AlbumPermissions - Erreur lors de la récupération des permissions:', permissionsError);
            throw permissionsError;
          }

          console.log('AlbumPermissions - Permissions trouvées dans la DB:', albumPermissions);
          const permittedAlbumIds = albumPermissions?.map(p => p.album_id) || [];
          console.log('AlbumPermissions - IDs albums autorisés via permissions:', permittedAlbumIds);

          // Filtrer les albums accessibles
          const userAccessibleAlbums = allAlbums.filter(album => {
            const isOwned = album.author_id === user.id;
            const hasDirectPermission = permittedAlbumIds.includes(album.id);
            
            console.log(`AlbumPermissions - Album "${album.name}" (ID: ${album.id}):`, {
              author_id: album.author_id,
              user_id: user.id,
              isOwned,
              hasDirectPermission,
              accessible: isOwned || hasDirectPermission
            });
            
            return isOwned || hasDirectPermission;
          });

          console.log('AlbumPermissions - Albums finaux accessibles:', userAccessibleAlbums.map(a => ({ name: a.name, id: a.id })));
          setAccessibleAlbums(userAccessibleAlbums);
        }
      } catch (error: any) {
        console.error('AlbumPermissions - Erreur lors de la récupération des albums accessibles:', error);
        // En cas d'erreur, montrer seulement les albums de l'utilisateur
        const userOwnedAlbums = allAlbums.filter(album => album.author_id === user.id);
        console.log('AlbumPermissions - Fallback: albums possédés par l\'utilisateur:', userOwnedAlbums.length);
        setAccessibleAlbums(userOwnedAlbums);
        
        toast({
          title: "Erreur",
          description: "Impossible de charger toutes les permissions. Seuls vos albums sont affichés.",
          variant: "destructive"
        });
      }
    };

    getAccessibleAlbums();
  }, [allAlbums, user, hasRole, toast]);

  return { accessibleAlbums, setAccessibleAlbums };
};
