
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BlogAlbum } from '@/types/supabase';
import { Plus } from 'lucide-react';
import AlbumCreator from './AlbumCreator';
import InviteUserDialog from '@/components/InviteUserDialog';
import { useGroupPermissions } from '@/hooks/useGroupPermissions';

interface BlogHeaderProps {
  albums: BlogAlbum[];
  hasCreatePermission: boolean;
  onAlbumCreated?: () => void;
}

const BlogHeader: React.FC<BlogHeaderProps> = ({ albums, hasCreatePermission, onAlbumCreated }) => {
  const { isInvitedUser } = useGroupPermissions();

  console.log('🎯 BlogHeader - Rendu avec albums:', {
    albumsCount: albums.length,
    albumNames: albums.map(a => a.name),
    hasCreatePermission,
    isInvitedUser,
    albums: albums.map(a => ({ id: a.id, name: a.name, author_id: a.author_id }))
  });

  console.log('🔍 BlogHeader - hasCreatePermission:', hasCreatePermission);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-serif text-tranches-charcoal">Blog (Photos/Vidéos)</h1>
      </div>

      <div className="flex items-center gap-2">
        {hasCreatePermission && (
          <>
            <Button asChild className="bg-black hover:bg-black/90 text-white">
              <Link to="/blog/new">
                <Plus className="w-4 h-4 mr-2" />
                Nouvel article
              </Link>
            </Button>
            <AlbumCreator onAlbumCreated={onAlbumCreated} />
          </>
        )}
        
        {!isInvitedUser && <InviteUserDialog />}
      </div>
    </div>
  );
};

export default BlogHeader;
