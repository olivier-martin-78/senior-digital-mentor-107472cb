
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BlogAlbum } from '@/types/supabase';
import { Plus } from 'lucide-react';

interface BlogHeaderProps {
  albums: BlogAlbum[];
  hasCreatePermission: boolean;
}

const BlogHeader: React.FC<BlogHeaderProps> = ({ albums, hasCreatePermission }) => {
  console.log('🎯 BlogHeader - Rendu avec albums:', {
    albumsCount: albums.length,
    albumNames: albums.map(a => a.name),
    hasCreatePermission,
    albums: albums.map(a => ({ id: a.id, name: a.name, author_id: a.author_id }))
  });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="flex flex-wrap gap-2">
        <Link to="/blog" className="px-4 py-2 bg-tranches-sage text-white rounded-lg hover:bg-tranches-sage/90 transition-colors">
          Tous les articles
        </Link>
        
        {albums.map((album) => {
          console.log('🎯 BlogHeader - Rendu album individuel:', {
            id: album.id,
            name: album.name,
            author_id: album.author_id
          });
          
          return (
            <Link
              key={album.id}
              to={`/blog?album=${album.id}`}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {album.name}
            </Link>
          );
        })}
      </div>

      {hasCreatePermission && (
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/blog/new">
              <Plus className="w-4 h-4 mr-2" />
              Nouvel article
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/albums">
              <Plus className="w-4 h-4 mr-2" />
              Créer un album
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default BlogHeader;
