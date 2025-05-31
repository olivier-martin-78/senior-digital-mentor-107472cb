
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BlogAlbum } from '@/types/supabase';

export const useBlogAlbums = () => {
  const { user, getEffectiveUserId, hasRole } = useAuth();
  const [albums, setAlbums] = useState<BlogAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      if (!user) {
        console.log('🚫 useBlogAlbums - No user connected');
        setAlbums([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const effectiveUserId = getEffectiveUserId();
        const isAdmin = hasRole('admin');
        
        console.log('📊 useBlogAlbums - DETAILED START REQUEST:', {
          originalUserId: user.id,
          originalUserEmail: user.email,
          effectiveUserId: effectiveUserId,
          isImpersonating: effectiveUserId !== user.id,
          isAdmin: isAdmin,
          hasRole_admin_result: hasRole('admin'),
          hasRole_editor_result: hasRole('editor'),
          hasRole_reader_result: hasRole('reader')
        });

        // Vérifier l'état d'impersonnation depuis le localStorage
        const impersonationState = localStorage.getItem('impersonation_state');
        if (impersonationState) {
          try {
            const parsedState = JSON.parse(impersonationState);
            console.log('🎭 useBlogAlbums - État impersonnation détaillé:', {
              isImpersonating: parsedState.isImpersonating,
              originalUser: parsedState.originalUser?.email,
              impersonatedUser: parsedState.impersonatedUser?.email,
              impersonatedRoles: parsedState.impersonatedRoles,
              hasAdminInRoles: parsedState.impersonatedRoles?.includes('admin')
            });
          } catch (e) {
            console.error('🚨 useBlogAlbums - Erreur parsing impersonation state:', e);
          }
        } else {
          console.log('❌ useBlogAlbums - Aucun état d\'impersonnation trouvé');
        }

        console.log('🚀 useBlogAlbums - Executing Supabase query with new RLS policies');
        const startTime = Date.now();
        
        const { data, error } = await supabase
          .from('blog_albums')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .order('name');
        
        const endTime = Date.now();
        console.log(`⏱️ useBlogAlbums - Query completed in ${endTime - startTime}ms`);

        if (error) {
          console.error('❌ useBlogAlbums - Supabase error:', error);
          throw error;
        }
        
        console.log('✅ useBlogAlbums - Raw data received:', {
          count: data?.length || 0,
          albums: data?.map(album => ({
            id: album.id,
            name: album.name,
            author_id: album.author_id,
            author_email: album.profiles?.email
          }))
        });

        let filteredAlbums = data || [];

        console.log('🔍 useBlogAlbums - Début du filtrage côté client:', {
          isAdmin,
          effectiveUserId,
          originalUserId: user.id,
          isImpersonating: effectiveUserId !== user.id,
          shouldFilter: !isAdmin && effectiveUserId !== user.id
        });

        // Filtrage côté client SEULEMENT si on n'est pas admin ET qu'on est en mode impersonnation
        if (!isAdmin && effectiveUserId !== user.id) {
          console.log('🎭 useBlogAlbums - MODE IMPERSONNATION SANS ADMIN: Filtrage côté client');
          const beforeFilterCount = filteredAlbums.length;
          
          filteredAlbums = filteredAlbums.filter(album => {
            const shouldInclude = album.author_id === effectiveUserId;
            console.log(`📋 useBlogAlbums - Album "${album.name}":`, {
              albumId: album.id,
              authorId: album.author_id,
              effectiveUserId,
              shouldInclude
            });
            return shouldInclude;
          });

          console.log('📊 useBlogAlbums - Résultat filtrage impersonnation:', {
            before: beforeFilterCount,
            after: filteredAlbums.length,
            effectiveUserId
          });
        } else if (isAdmin) {
          console.log('🔑 useBlogAlbums - PERMISSIONS ADMIN DETECTEES: showing all albums');
          console.log('👑 useBlogAlbums - Admin context:', {
            hasAdminRole: hasRole('admin'),
            totalAlbumsVisible: filteredAlbums.length,
            adminCanSeeAll: true
          });
        } else {
          console.log('👤 useBlogAlbums - Mode utilisateur normal (pas d\'impersonnation)');
        }

        console.log('🎉 useBlogAlbums - RESULTAT FINAL:', {
          count: filteredAlbums.length,
          albums: filteredAlbums.map(album => ({
            id: album.id,
            name: album.name,
            author_id: album.author_id
          }))
        });

        setAlbums(filteredAlbums);
        
      } catch (error) {
        console.error('💥 useBlogAlbums - Critical error:', error);
        setAlbums([]);
      } finally {
        setLoading(false);
        console.log('🏁 useBlogAlbums - End fetchAlbums, loading: false');
      }
    };

    console.log('🔄 useBlogAlbums - useEffect triggered, starting fetchAlbums');
    fetchAlbums();
  }, [user, getEffectiveUserId, hasRole]);

  console.log('📤 useBlogAlbums - Hook return:', {
    albumsCount: albums.length,
    loading
  });

  return { albums, loading };
};
