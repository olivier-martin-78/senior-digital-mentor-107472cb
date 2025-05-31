
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BlogAlbum } from '@/types/supabase';

export const useAlbumPermissions = (allAlbums: BlogAlbum[]) => {
  const { user, getEffectiveUserId } = useAuth();
  const [accessibleAlbums, setAccessibleAlbums] = useState<BlogAlbum[]>([]);

  useEffect(() => {
    if (!user) {
      console.log('AlbumPermissions - Pas d\'utilisateur connecté');
      setAccessibleAlbums([]);
      return;
    }

    const effectiveUserId = getEffectiveUserId();

    console.log('AlbumPermissions - Filtrage côté client avec utilisateur effectif:', {
      effectiveUserId,
      originalUserId: user.id,
      isImpersonating: effectiveUserId !== user.id,
      totalAlbums: allAlbums.length
    });
    
    // Filtrage côté client basé sur l'utilisateur effectif
    // Les albums dans allAlbums sont déjà filtrés par les hooks parent selon l'impersonnation
    console.log('AlbumPermissions - Albums après filtrage RLS et impersonnation:', allAlbums.length);
    setAccessibleAlbums(allAlbums);
  }, [allAlbums, user, getEffectiveUserId]);

  return { accessibleAlbums, setAccessibleAlbums };
};
