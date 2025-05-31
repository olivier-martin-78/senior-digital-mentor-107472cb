
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
        
        console.log('📊 useBlogAlbums - START REQUEST:', {
          originalUserId: user.id,
          effectiveUserId: effectiveUserId,
          originalUserEmail: user.email,
          isImpersonating: effectiveUserId !== user.id,
          isAdmin: hasRole('admin')
        });

        // Simple query - les nouvelles politiques RLS permettent à tous les utilisateurs authentifiés de voir tous les albums
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

        // Filtrage côté client pour l'impersonnation
        if (hasRole('admin') && effectiveUserId !== user.id) {
          console.log('🎭 useBlogAlbums - Impersonation mode: client-side filtering');
          const beforeFilterCount = filteredAlbums.length;
          
          filteredAlbums = filteredAlbums.filter(album => album.author_id === effectiveUserId);

          console.log('📊 useBlogAlbums - Impersonation filtering result:', {
            before: beforeFilterCount,
            after: filteredAlbums.length,
            effectiveUserId
          });
        }

        console.log('🎉 useBlogAlbums - Final result:', {
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
