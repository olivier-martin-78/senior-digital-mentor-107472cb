
import { useBlogAlbums } from './blog/useBlogAlbums';
import { useBlogPosts } from './blog/useBlogPosts';
import { useAuth } from '@/contexts/AuthContext';

export const useBlogData = (
  searchTerm: string,
  selectedAlbum: string,
  startDate?: string,
  endDate?: string,
  selectedUserId?: string | null
) => {
  const { hasRole } = useAuth();
  
  // Utilisation simplifiée avec les nouvelles politiques RLS finales
  const { albums, loading: albumsLoading } = useBlogAlbums();
  const { posts, loading: postsLoading } = useBlogPosts(
    searchTerm,
    selectedAlbum,
    startDate,
    endDate
  );

  // Les politiques RLS gèrent maintenant les permissions automatiquement
  const hasCreatePermission = hasRole('admin') || hasRole('editor');

  return {
    posts,
    albums,
    loading: albumsLoading || postsLoading,
    hasCreatePermission
  };
};
