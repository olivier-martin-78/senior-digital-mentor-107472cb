
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
  
  // Un utilisateur peut créer du contenu s'il a les rôles admin, editor ou professionnel
  const hasCreatePermission = hasRole('admin') || hasRole('editor') || hasRole('professionnel');
  
  const { posts, loading: postsLoading } = useBlogPosts(searchTerm, selectedAlbum, startDate, endDate);
  const { albums, loading: albumsLoading } = useBlogAlbums();

  const loading = postsLoading || albumsLoading;

  console.log('🎯 useBlogData - Permissions:', {
    userId: user?.id,
    hasAdmin: hasRole('admin'),
    hasEditor: hasRole('editor'),
    hasProfessionnel: hasRole('professionnel'),
    hasCreatePermission
  });

  const refetch = async () => {
    // Pour le moment, on peut refetch manuellement en rechargeant la page
    // ou implémenter une logique de refetch spécifique si nécessaire
    window.location.reload();
  };

  return {
    posts,
    albums,
    loading,
    hasCreatePermission,
    refetch
  };
};
