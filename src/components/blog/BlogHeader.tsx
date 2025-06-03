
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BlogAlbum } from '@/types/supabase';
import { Plus } from 'lucide-react';
import AlbumCreator from './AlbumCreator';

interface BlogHeaderProps {
  albums: BlogAlbum[];
  hasCreatePermission: boolean;
  onAlbumCreated?: () => void;
}

const BlogHeader: React.FC<BlogHeaderProps> = ({ albums, hasCreatePermission, onAlbumCreated }) => {
  console.log('🎯 BlogHeader - Rendu avec albums:', {
    albumsCount: albums.length,
    albumNames: albums.map(a => a.name),
    hasCreatePermission,
    albums: albums.map(a => ({ id: a.id, name: a.name, author_id: a.author_id }))
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-serif text-tranches-charcoal">Blog (Photos/Vidéos)</h1>
      </div>

      {hasCreatePermission && (
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/blog/new">
              <Plus className="w-4 h-4 mr-2" />
              Nouvel article
            </Link>
          </Button>
          <AlbumCreator onAlbumCreated={onAlbumCreated} />
        </div>
      )}
    </div>
  );
};

export default BlogHeader;
