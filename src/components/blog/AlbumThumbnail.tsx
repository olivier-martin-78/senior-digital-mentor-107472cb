
import React from 'react';
import { BlogAlbum } from '@/types/supabase';
import { getThumbnailUrl } from '@/utils/thumbnailtUtils';

interface AlbumThumbnailProps {
  album: BlogAlbum | null;
  title: string;
  coverImage?: string | null;
}

const AlbumThumbnail: React.FC<AlbumThumbnailProps> = ({ album, title, coverImage }) => {
  // Si une image de couverture est fournie, l'utiliser
  if (coverImage) {
    return (
      <div className="w-full h-64 relative">
        <img
          src={coverImage}
          alt={`Couverture de ${title}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-4">
          <div className="text-white">
            {album && (
              <div className="text-sm opacity-75 mb-1">
                Album: {album.name}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Si un album avec vignette est fourni, utiliser sa vignette
  if (album?.thumbnail_url) {
    return (
      <div className="w-full h-64 relative">
        <img
          src={getThumbnailUrl(album.thumbnail_url)}
          alt={`Vignette de ${album.name}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-4">
          <div className="text-white">
            <div className="text-sm opacity-75 mb-1">
              Album: {album.name}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si pas d'image, afficher un en-tête simple
  return (
    <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
      <h1 className="text-2xl font-serif text-tranches-charcoal">{title}</h1>
    </div>
  );
};

export default AlbumThumbnail;
