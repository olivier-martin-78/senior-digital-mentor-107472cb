
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BlogAlbum } from '@/types/supabase';

export const useBlogAlbums = () => {
  const { user, getEffectiveUserId, profile, hasRole } = useAuth();
  const [albums, setAlbums] = useState<BlogAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      if (!user) {
        console.log('🚫 useBlogAlbums - Pas d\'utilisateur connecté');
        setAlbums([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const effectiveUserId = getEffectiveUserId();
        
        console.log('📊 useBlogAlbums - DÉBUT REQUÊTE avec nouvelles politiques RLS simplifiées:', {
          originalUserId: user.id,
          effectiveUserId: effectiveUserId,
          originalUserEmail: user.email,
          effectiveUserProfile: profile,
          isImpersonating: effectiveUserId !== user.id,
          isAdmin: hasRole('admin'),
          timestamp: new Date().toISOString()
        });

        // Vérifier l'état de la session avant la requête
        const { data: session } = await supabase.auth.getSession();
        console.log('🔐 useBlogAlbums - État session:', {
          hasSession: !!session.session,
          userId: session.session?.user?.id,
          userEmail: session.session?.user?.email
        });

        console.log('🎯 useBlogAlbums - STRATÉGIE: Récupérer tous les albums avec nouvelles politiques RLS, filtrer côté client selon impersonnation');
        
        // Avec les nouvelles politiques RLS simplifiées, tous les utilisateurs authentifiés peuvent voir tous les albums
        const albumsQuery = supabase
          .from('blog_albums')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .order('name');

        console.log('🚀 useBlogAlbums - EXÉCUTION REQUÊTE Supabase avec politiques RLS simplifiées');
        const startTime = Date.now();
        
        const { data, error } = await albumsQuery;
        
        const endTime = Date.now();
        console.log(`⏱️ useBlogAlbums - REQUÊTE TERMINÉE en ${endTime - startTime}ms`);

        if (error) {
          console.error('❌ useBlogAlbums - ERREUR SUPABASE:', {
            error: error,
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        
        console.log('✅ useBlogAlbums - DONNÉES BRUTES reçues:', {
          count: data?.length || 0,
          rawData: data?.map(album => ({
            id: album.id,
            name: album.name,
            author_id: album.author_id,
            author_email: album.profiles?.email
          }))
        });

        let filteredAlbums = data || [];

        // FILTRAGE CÔTÉ CLIENT pour l'impersonnation
        if (hasRole('admin') && effectiveUserId !== user.id) {
          console.log('🎭 useBlogAlbums - MODE IMPERSONNATION: filtrage côté client');
          const beforeFilterCount = filteredAlbums.length;
          
          filteredAlbums = filteredAlbums.filter(album => {
            const canSee = album.author_id === effectiveUserId;
            console.log('🔎 useBlogAlbums - Test visibilité album:', {
              albumId: album.id,
              albumName: album.name,
              albumAuthorId: album.author_id,
              effectiveUserId,
              canSee
            });
            return canSee;
          });

          console.log('📊 useBlogAlbums - Résultat filtrage impersonnation:', {
            avant: beforeFilterCount,
            après: filteredAlbums.length,
            supprimés: beforeFilterCount - filteredAlbums.length
          });
        } else {
          console.log('📋 useBlogAlbums - Pas de filtrage impersonnation nécessaire');
        }

        console.log('🎉 useBlogAlbums - RÉSULTAT FINAL:', {
          count: filteredAlbums.length,
          albums: filteredAlbums.map(album => ({
            id: album.id,
            name: album.name,
            author_id: album.author_id,
            author_email: album.profiles?.email
          })),
          timestamp: new Date().toISOString()
        });

        setAlbums(filteredAlbums);
        
      } catch (error) {
        console.error('💥 useBlogAlbums - ERREUR CRITIQUE:', {
          error: error,
          message: error instanceof Error ? error.message : 'Erreur inconnue',
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        setAlbums([]);
      } finally {
        setLoading(false);
        console.log('🏁 useBlogAlbums - FIN fetchAlbums, loading: false');
      }
    };

    console.log('🔄 useBlogAlbums - useEffect déclenché, démarrage fetchAlbums');
    fetchAlbums();
  }, [user, getEffectiveUserId, profile, hasRole]);

  console.log('📤 useBlogAlbums - RETOUR hook:', {
    albumsCount: albums.length,
    loading
  });

  return { albums, loading };
};
