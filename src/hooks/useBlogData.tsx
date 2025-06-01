
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
  
  // Utilisation simplifiée avec les nouvelles politiques RLS simplifiées
  const { albums, loading: albumsLoading } = useBlogAlbums();
  const { posts, loading: postsLoading } = useBlogPosts(
    searchTerm,
    selectedAlbum,
    startDate,
    endDate
  );

  console.log('🎯 useBlogData - HOOK PRINCIPAL avec données:', {
    albumsCount: albums.length,
    albumNames: albums.map(a => a.name),
    postsCount: posts.length,
    postTitles: posts.map(p => p.title),
    albumsLoading,
    postsLoading,
    totalLoading: albumsLoading || postsLoading,
    albums: albums.map(a => ({ id: a.id, name: a.name, author_id: a.author_id }))
  });

  // Les nouvelles politiques RLS simplifient l'accès basé sur les rôles
  const hasCreatePermission = hasRole('admin') || hasRole('editor');

  return {
    posts,
    albums,
    loading: albumsLoading || postsLoading,
    hasCreatePermission
  };
};
