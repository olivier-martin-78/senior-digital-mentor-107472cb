
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
          isAdmin: isAdmin
        });

        console.log('🚀 useBlogAlbums - Executing Supabase query with permissions logic');
        
        if (isAdmin) {
          // Admin peut voir tous les albums
          const { data, error } = await supabase
            .from('blog_albums')
            .select(`
              *,
              profiles(id, display_name, email, avatar_url, created_at)
            `)
            .order('name');

          if (error) {
            console.error('❌ useBlogAlbums - Supabase error:', error);
            throw error;
          }

          console.log('✅ useBlogAlbums - Admin data received:', {
            count: data?.length || 0
          });

          setAlbums(data || []);
        } else {
          // Pour les utilisateurs non-admin, récupérer :
          // 1. Les albums qu'ils ont créés
          // 2. Les albums auxquels ils ont accès via album_permissions
          
          // Albums créés par l'utilisateur
          const { data: ownedAlbums, error: ownedError } = await supabase
            .from('blog_albums')
            .select(`
              *,
              profiles(id, display_name, email, avatar_url, created_at)
            `)
            .eq('author_id', effectiveUserId);

          if (ownedError) {
            console.error('❌ useBlogAlbums - Error fetching owned albums:', ownedError);
            throw ownedError;
          }

          // Albums avec permissions
          const { data: permittedAlbums, error: permissionsError } = await supabase
            .from('album_permissions')
            .select(`
              album_id,
              blog_albums(
                *,
                profiles(id, display_name, email, avatar_url, created_at)
              )
            `)
            .eq('user_id', effectiveUserId);

          if (permissionsError) {
            console.error('❌ useBlogAlbums - Error fetching permitted albums:', permissionsError);
            // Continue sans les permissions plutôt que de tout faire échouer
          }

          console.log('📋 useBlogAlbums - Raw data:', {
            ownedAlbums: ownedAlbums?.length || 0,
            permittedAlbums: permittedAlbums?.length || 0
          });

          // Combiner les albums possédés et les albums avec permissions
          const allAccessibleAlbums: BlogAlbum[] = [];
          
          // Ajouter les albums possédés
          if (ownedAlbums) {
            allAccessibleAlbums.push(...ownedAlbums);
          }

          // Ajouter les albums avec permissions (en évitant les doublons)
          if (permittedAlbums) {
            permittedAlbums.forEach(permission => {
              if (permission.blog_albums && !allAccessibleAlbums.find(album => album.id === permission.blog_albums.id)) {
                allAccessibleAlbums.push(permission.blog_albums as BlogAlbum);
              }
            });
          }

          // Trier par nom
          allAccessibleAlbums.sort((a, b) => a.name.localeCompare(b.name));

          console.log('🎉 useBlogAlbums - RESULTAT FINAL avec permissions:', {
            count: allAccessibleAlbums.length,
            albums: allAccessibleAlbums.map(album => ({
              id: album.id,
              name: album.name,
              author_id: album.author_id
            }))
          });

          setAlbums(allAccessibleAlbums);
        }
        
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
