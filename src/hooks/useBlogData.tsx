
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithAuthor, BlogAlbum } from '@/types/supabase';
import { useBlogPosts } from '@/hooks/blog/useBlogPosts';
import { useBlogAlbums } from '@/hooks/blog/useBlogAlbums';

export const useBlogData = (
  searchTerm: string,
  selectedAlbum: string,
  startDate?: string,
  endDate?: string,
  authorId?: string | null
) => {
  const { user, hasRole } = useAuth();
  
  // Un utilisateur peut créer du contenu s'il a les rôles admin, editor ou professional
  const hasCreatePermission = hasRole('admin') || hasRole('editor') || hasRole('professional');
  
  const { posts, loading: postsLoading } = useBlogPosts(searchTerm, selectedAlbum, startDate, endDate);
  const { albums, loading: albumsLoading, refetch: refetchAlbums } = useBlogAlbums();

  const loading = postsLoading || albumsLoading;

  console.log('🎯 useBlogData - Permissions:', {
    userId: user?.id,
    hasAdmin: hasRole('admin'),
    hasEditor: hasRole('editor'),
    hasProfessional: hasRole('professional'),
    hasCreatePermission
  });

  const refetch = async () => {
    await refetchAlbums();
  };

  return {
    posts,
    albums,
    loading,
    hasCreatePermission,
    refetch
  };
};
