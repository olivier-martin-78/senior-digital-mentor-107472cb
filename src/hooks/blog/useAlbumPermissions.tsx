
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BlogAlbum } from '@/types/supabase';

export const useAlbumPermissions = (allAlbums: BlogAlbum[]) => {
  const { user, getEffectiveUserId, hasRole } = useAuth();
  const [accessibleAlbums, setAccessibleAlbums] = useState<BlogAlbum[]>([]);

  useEffect(() => {
    if (!user) {
      console.log('AlbumPermissions - Pas d\'utilisateur connecté');
      setAccessibleAlbums([]);
      return;
    }

    const effectiveUserId = getEffectiveUserId();
    const isAdmin = hasRole('admin'); // Ceci prend en compte l'impersonnation

    console.log('AlbumPermissions - Filtrage côté client avec utilisateur effectif:', {
      effectiveUserId,
      originalUserId: user.id,
      isImpersonating: effectiveUserId !== user.id,
      isAdmin: isAdmin,
      totalAlbums: allAlbums.length
    });
    
    // Si l'utilisateur a les permissions admin (y compris via impersonnation), 
    // il peut accéder à tous les albums
    if (isAdmin) {
      console.log('AlbumPermissions - Permissions admin: accès à tous les albums');
      setAccessibleAlbums(allAlbums);
    } else {
      // Sinon, filtrage normal basé sur l'utilisateur effectif
      console.log('AlbumPermissions - Albums après filtrage RLS et impersonnation:', allAlbums.length);
      setAccessibleAlbums(allAlbums);
    }
  }, [allAlbums, user, getEffectiveUserId, hasRole]);

  return { accessibleAlbums, setAccessibleAlbums };
};
