
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BlogAlbum } from '@/types/supabase';

export const useAlbumPermissions = (allAlbums: BlogAlbum[]) => {
  const { user, getEffectiveUserId, hasRole } = useAuth();
  const [accessibleAlbums, setAccessibleAlbums] = useState<BlogAlbum[]>([]);

  useEffect(() => {
    if (!user) {
      console.log('🚫 AlbumPermissions - Pas d\'utilisateur connecté');
      setAccessibleAlbums([]);
      return;
    }

    const effectiveUserId = getEffectiveUserId();
    const isAdmin = hasRole('admin');

    console.log('🔍 AlbumPermissions - ANALYSE DETAILLEE des permissions:', {
      effectiveUserId,
      originalUserId: user.id,
      originalUserEmail: user.email,
      isImpersonating: effectiveUserId !== user.id,
      isAdmin: isAdmin,
      totalAlbums: allAlbums.length,
      albumNames: allAlbums.map(a => a.name)
    });

    // Les albums passés en paramètre ont déjà été filtrés par useBlogAlbums
    // qui inclut maintenant les permissions, donc on peut les afficher tous
    if (isAdmin) {
      console.log('🔑 AlbumPermissions - PERMISSIONS ADMIN CONFIRMEES: accès à tous les albums');
      setAccessibleAlbums(allAlbums);
    } else {
      console.log('👤 AlbumPermissions - Utilisateur normal: albums déjà filtrés par useBlogAlbums');
      // Les albums reçus ont déjà été filtrés pour inclure les permissions
      setAccessibleAlbums(allAlbums);
      
      // Vérification spécifique pour "Tiago" et "Nana"
      const tiaoAlbum = allAlbums.find(album => album.name.toLowerCase().includes('tiago'));
      const nanaAlbum = allAlbums.find(album => album.name.toLowerCase().includes('nana'));
      
      console.log('🎯 AlbumPermissions - Vérification albums spécifiques dans le résultat final:', {
        tiaoFound: !!tiaoAlbum,
        tiaoAlbum: tiaoAlbum ? { id: tiaoAlbum.id, name: tiaoAlbum.name } : null,
        nanaFound: !!nanaAlbum,
        nanaAlbum: nanaAlbum ? { id: nanaAlbum.id, name: nanaAlbum.name } : null,
        userEmail: user.email
      });
    }
  }, [allAlbums, user, getEffectiveUserId, hasRole]);

  console.log('📤 AlbumPermissions - Hook return:', {
    accessibleAlbumsCount: accessibleAlbums.length,
    inputAlbumsCount: allAlbums.length,
    accessibleAlbumNames: accessibleAlbums.map(a => a.name)
  });

  return { accessibleAlbums, setAccessibleAlbums };
};
