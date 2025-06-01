
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
        console.log('🚫 useBlogAlbums - Pas d\'utilisateur connecté');
        setAlbums([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const effectiveUserId = getEffectiveUserId();
        const isAdmin = hasRole('admin');
        
        console.log('📊 useBlogAlbums - Récupération albums pour:', {
          userEmail: user.email,
          effectiveUserId,
          isAdmin
        });

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
            console.error('❌ useBlogAlbums - Erreur admin:', error);
            throw error;
          }

          console.log('✅ useBlogAlbums - Albums admin récupérés:', data?.length || 0);
          setAlbums(data || []);
        } else {
          // Pour les utilisateurs non-admin, récupérer albums créés + albums avec permissions
          
          // Albums créés par l'utilisateur
          const { data: ownedAlbums, error: ownedError } = await supabase
            .from('blog_albums')
            .select(`
              *,
              profiles(id, display_name, email, avatar_url, created_at)
            `)
            .eq('author_id', effectiveUserId);

          if (ownedError) {
            console.error('❌ useBlogAlbums - Erreur albums possédés:', ownedError);
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
            console.error('❌ useBlogAlbums - Erreur permissions:', permissionsError);
          }

          // Combiner les albums
          const allAccessibleAlbums: BlogAlbum[] = [];
          
          // Ajouter les albums possédés
          if (ownedAlbums) {
            allAccessibleAlbums.push(...ownedAlbums);
          }

          // Ajouter les albums avec permissions (éviter doublons)
          if (permittedAlbums) {
            permittedAlbums.forEach(permission => {
              if (permission.blog_albums && !allAccessibleAlbums.find(album => album.id === permission.blog_albums.id)) {
                allAccessibleAlbums.push(permission.blog_albums as BlogAlbum);
              }
            });
          }

          // Trier par nom
          allAccessibleAlbums.sort((a, b) => a.name.localeCompare(b.name));

          console.log('✅ useBlogAlbums - Albums accessibles récupérés:', {
            count: allAccessibleAlbums.length,
            albumNames: allAccessibleAlbums.map(a => a.name)
          });

          setAlbums(allAccessibleAlbums);
        }
        
      } catch (error) {
        console.error('💥 useBlogAlbums - Erreur critique:', error);
        setAlbums([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, [user, getEffectiveUserId, hasRole]);

  return { albums, loading };
};
