
import { useAuth } from '@/contexts/AuthContext';
import { useBlogPermissions } from './blog/useBlogPermissions';
import { useBlogPosts } from './blog/useBlogPosts';
import { useBlogAlbums } from './blog/useBlogAlbums';

export const useBlogData = (searchTerm: string, selectedAlbum: string, startDate?: string, endDate?: string, selectedUserId?: string | null) => {
  const { hasRole, getEffectiveUserId } = useAuth();
  const effectiveUserId = getEffectiveUserId();

  const hasCreatePermission = hasRole('editor') || hasRole('admin');

  // Get permissions
  const { authorizedUserIds, loading: permissionsLoading } = useBlogPermissions(effectiveUserId || '');

  // Get posts
  const { posts, loading: postsLoading } = useBlogPosts(
    searchTerm,
    selectedAlbum,
    startDate,
    endDate,
    selectedUserId,
    effectiveUserId,
    authorizedUserIds
  );

  // Get albums
  const { albums, loading: albumsLoading } = useBlogAlbums(
    selectedUserId,
    effectiveUserId,
    authorizedUserIds
  );

  const loading = permissionsLoading || postsLoading || albumsLoading;

  return {
    posts,
    albums,
    loading,
    hasCreatePermission
  };
};
