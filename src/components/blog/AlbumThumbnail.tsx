
import React, { useState, useEffect } from 'react';
import { BlogAlbum } from '@/types/supabase';
import { getThumbnailUrlSync } from '@/utils/thumbnailtUtils';

interface AlbumThumbnailProps {
  album: BlogAlbum | null;
  title: string;
  coverImage?: string | null;
}

const AlbumThumbnail: React.FC<AlbumThumbnailProps> = ({ album, title, coverImage }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('/placeholder.svg');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    setIsLoading(true);
    
    // Si une image de couverture est fournie, l'utiliser directement
    if (coverImage) {
      // Handle blob URLs from mobile devices
      if (coverImage.startsWith('blob:')) {
        console.log('Blob URL detected, using placeholder instead:', coverImage);
        setThumbnailUrl('/placeholder.svg');
      } else {
        setThumbnailUrl(coverImage);
      }
      setIsLoading(false);
      return;
    }
    
    // Si un album avec vignette est fourni, utiliser sa vignette
    if (album?.thumbnail_url) {
      try {
        const normalizedUrl = getThumbnailUrlSync(album.thumbnail_url);
        console.log('Thumbnail URL normalized:', normalizedUrl);
        setThumbnailUrl(normalizedUrl);
      } catch (error) {
        console.error('Error processing thumbnail URL:', error);
        setThumbnailUrl('/placeholder.svg');
      }
    }
    
    setIsLoading(false);
  }, [album, coverImage]);
  
  // Si une image de couverture ou une vignette d'album est disponible
  if (coverImage || album?.thumbnail_url) {
    return (
      <div className="w-full h-64 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        )}
        <img
          src={thumbnailUrl}
          alt={`Couverture de ${title}`}
          className="w-full h-full object-cover"
          onLoad={() => setIsLoading(false)}
          onError={(e) => {
            console.error('Image failed to load:', thumbnailUrl);
            (e.target as HTMLImageElement).src = '/placeholder.svg';
            setIsLoading(false);
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

  // Si pas d'image, afficher un en-tête simple
  return (
    <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
      <h1 className="text-2xl font-serif text-tranches-charcoal">{title}</h1>
    </div>
  );
};

export default AlbumThumbnail;
