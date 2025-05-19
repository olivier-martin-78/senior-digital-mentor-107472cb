
import React from 'react';
import { BlogAlbum } from '@/types/supabase';
import { getThumbnailUrl } from '@/utils/thumbnailtUtils';

interface AlbumThumbnailProps {
  album: BlogAlbum | null;
  title: string;
}

const AlbumThumbnail: React.FC<AlbumThumbnailProps> = ({ album, title }) => {
  if (!album || !album.thumbnail_url) return null;
  
  // Get the thumbnail URL from the utility function
  const thumbnailUrl = getThumbnailUrl(album.thumbnail_url);
  
  return (
    <div className="w-full h-64 relative">
      <img 
        src={thumbnailUrl} 
        alt={title}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/placeholder.svg';
        }}
      />
    </div>
  );
};

export default AlbumThumbnail;
