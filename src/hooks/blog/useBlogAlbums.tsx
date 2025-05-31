
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BlogAlbum } from '@/types/supabase';

export const useBlogAlbums = () => {
  const { user, getEffectiveUserId, profile } = useAuth();
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
        
        console.log('useBlogAlbums - Données utilisateur:', {
          originalUserId: user.id,
          effectiveUserId: effectiveUserId,
          originalUserEmail: user.email,
          effectiveUserProfile: profile,
          isImpersonating: effectiveUserId !== user.id
        });

        // Les nouvelles politiques RLS restrictives filtrent automatiquement l'accès
        const { data, error } = await supabase
          .from('blog_albums')
          .select(`
            *,
            profiles(id, display_name, email, avatar_url, created_at)
          `)
          .order('name');

        console.log('useBlogAlbums - Requête Supabase:', {
          query: 'blog_albums avec join profiles',
          effectiveUserId,
          currentAuthUid: (await supabase.auth.getUser()).data.user?.id,
        });

        if (error) {
          console.error('useBlogAlbums - Erreur Supabase:', error);
          throw error;
        }
        
        console.log('useBlogAlbums - Albums récupérés:', {
          count: data?.length || 0,
          albums: data?.map(album => ({
            id: album.id,
            name: album.name,
            author_id: album.author_id,
            author_email: album.profiles?.email
          })) || []
        });

        // Vérification supplémentaire côté client pour debug
        const filteredAlbums = data || [];
        console.log('useBlogAlbums - Albums après filtrage RLS:', {
          totalCount: filteredAlbums.length,
          albumsByAuthor: filteredAlbums.reduce((acc, album) => {
            const authorEmail = album.profiles?.email || 'unknown';
            acc[authorEmail] = (acc[authorEmail] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
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
  }, [user, getEffectiveUserId, profile]);

  return { albums, loading };
};
