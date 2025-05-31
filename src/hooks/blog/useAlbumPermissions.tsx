
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
      hasRole_admin: hasRole('admin'),
      hasRole_editor: hasRole('editor'),
      hasRole_reader: hasRole('reader')
    });

    // Vérifier l'état d'impersonnation depuis le localStorage
    const impersonationState = localStorage.getItem('impersonation_state');
    if (impersonationState) {
      try {
        const parsedState = JSON.parse(impersonationState);
        console.log('🎭 AlbumPermissions - État impersonnation localStorage:', {
          isImpersonating: parsedState.isImpersonating,
          originalUser: parsedState.originalUser?.email,
          impersonatedUser: parsedState.impersonatedUser?.email,
          impersonatedRoles: parsedState.impersonatedRoles,
          hasAdminInImpersonatedRoles: parsedState.impersonatedRoles?.includes('admin')
        });
      } catch (e) {
        console.error('🚨 AlbumPermissions - Erreur parsing impersonation state:', e);
      }
    }
    
    // Si l'utilisateur a les permissions admin (y compris via impersonnation), 
    // il peut accéder à tous les albums
    if (isAdmin) {
      console.log('🔑 AlbumPermissions - PERMISSIONS ADMIN CONFIRMEES: accès à tous les albums');
      console.log('👑 AlbumPermissions - Détails admin:', {
        albumsToShow: allAlbums.length,
        albumsList: allAlbums.map(album => ({
          id: album.id,
          name: album.name,
          author_id: album.author_id
        }))
      });
      setAccessibleAlbums(allAlbums);
    } else {
      console.log('❌ AlbumPermissions - PAS DE PERMISSIONS ADMIN:', {
        reason: 'hasRole(admin) returned false',
        effectiveUserId,
        isImpersonating: effectiveUserId !== user.id,
        albumsReceived: allAlbums.length
      });
      // Sinon, filtrage normal basé sur l'utilisateur effectif
      console.log('📋 AlbumPermissions - Albums après filtrage RLS et impersonnation:', allAlbums.length);
      setAccessibleAlbums(allAlbums);
    }
  }, [allAlbums, user, getEffectiveUserId, hasRole]);

  console.log('📤 AlbumPermissions - Hook return:', {
    accessibleAlbumsCount: accessibleAlbums.length,
    inputAlbumsCount: allAlbums.length
  });

  return { accessibleAlbums, setAccessibleAlbums };
};
