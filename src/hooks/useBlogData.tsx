import { useState, useEffect } from 'react';
import { useBlogPosts } from '@/hooks/blog/useBlogPosts';
import { useBlogAlbums } from '@/hooks/blog/useBlogAlbums';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithAuthor } from '@/types/supabase';

export const useBlogData = (
  searchTerm: string,
  selectedAlbum: string,
  startDate?: string,
  endDate?: string,
  categoryId?: string | null
) => {
  const { hasRole } = useAuth();
  
  const { posts, loading: postsLoading } = useBlogPosts(
    searchTerm,
    selectedAlbum,
    startDate,
    endDate
  );
  
  const { albums, loading: albumsLoading } = useBlogAlbums();
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(postsLoading || albumsLoading);
  }, [postsLoading, albumsLoading]);

  const hasCreatePermission = hasRole('admin') || hasRole('editor');

  const refetch = () => {
    // This would trigger a refetch of both posts and albums
    // Implementation depends on the specific hooks
  };

  return {
    posts: posts as PostWithAuthor[],
    albums,
    loading,
    hasCreatePermission,
    refetch
  };
};
