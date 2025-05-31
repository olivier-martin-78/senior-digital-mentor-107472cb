
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
        console.log('useBlogAlbums - Pas d\'utilisateur connecté');
        setAlbums([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const effectiveUserId = getEffectiveUserId();
        
        console.log('useBlogAlbums - Données utilisateur (CORRIGÉES):', {
          originalUserId: user.id,
          effectiveUserId: effectiveUserId,
          originalUserEmail: user.email,
          effectiveUserProfile: profile,
          isImpersonating: effectiveUserId !== user.id,
          isAdmin: hasRole('admin')
        });

        // APPROCHE CORRIGÉE : Récupérer tous les albums si admin réel, 
        // puis filtrer côté client selon l'impersonnation
        let albumsQuery = supabase
          .from('blog_albums')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .order('name');

        // Si l'utilisateur réel n'est pas admin, appliquer des filtres côté requête
        if (!hasRole('admin')) {
          albumsQuery = albumsQuery.eq('author_id', effectiveUserId);
        }

        console.log('useBlogAlbums - Requête Supabase (CORRIGÉE):', {
          query: 'blog_albums avec join profiles',
          effectiveUserId,
          currentAuthUid: (await supabase.auth.getUser()).data.user?.id,
          isAdminRealUser: hasRole('admin'),
          willFilterClientSide: hasRole('admin') && effectiveUserId !== user.id
        });

        const { data, error } = await albumsQuery;

        if (error) {
          console.error('useBlogAlbums - Erreur Supabase:', error);
          throw error;
        }
        
        let filteredAlbums = data || [];

        // FILTRAGE CÔTÉ CLIENT pour l'impersonnation
        if (hasRole('admin') && effectiveUserId !== user.id) {
          // En mode impersonnation : montrer seulement les albums de l'utilisateur impersonné
          console.log('useBlogAlbums - Mode impersonnation : filtrage côté client');
          filteredAlbums = filteredAlbums.filter(album => {
            const canSee = album.author_id === effectiveUserId;
            console.log('useBlogAlbums - Album filtrage:', {
              albumId: album.id,
              albumName: album.name,
              albumAuthorId: album.author_id,
              effectiveUserId,
              canSee
            });
            return canSee;
          });
        }

        console.log('useBlogAlbums - Albums récupérés (APRÈS FILTRAGE):', {
          count: filteredAlbums.length,
          albums: filteredAlbums.map(album => ({
            id: album.id,
            name: album.name,
            author_id: album.author_id,
            author_email: album.profiles?.email
          }))
        });

        setAlbums(filteredAlbums);
        
      } catch (error) {
        console.error('useBlogAlbums - Erreur lors du chargement des albums:', error);
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, [user, getEffectiveUserId, profile, hasRole]);

  return { albums, loading };
};
