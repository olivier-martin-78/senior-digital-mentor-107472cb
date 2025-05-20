import React, { useState, useEffect } from 'react';
import { BlogAlbum } from '@/types/supabase';
import { getThumbnailUrlSync, ALBUM_THUMBNAILS_BUCKET, BLOG_MEDIA_BUCKET } from '@/utils/thumbnailtUtils';

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

    // Handle cover image (post's cover_image, stored in blog-media)
    if (coverImage) {
      if (coverImage.startsWith('blob:')) {
        console.log('Blob URL detected for coverImage, using placeholder:', coverImage);
        setThumbnailUrl('/placeholder.svg');
      } else {
        try {
          const normalizedUrl = getThumbnailUrlSync(coverImage, BLOG_MEDIA_BUCKET);
          console.log('Cover image URL normalized:', normalizedUrl);
          setThumbnailUrl(normalizedUrl);
        } catch (error) {
          console.error('Error processing coverImage URL:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            coverImage,
            bucket: BLOG_MEDIA_BUCKET,
          });
          setThumbnailUrl('/placeholder.svg');
        }
      }
      setIsLoading(false);
      return;
    }

    // Handle album thumbnail (stored in album-thumbnails)
    if (album?.thumbnail_url) {
      try {
        const normalizedUrl = getThumbnailUrlSync(album.thumbnail_url, ALBUM_THUMBNAILS_BUCKET);
        console.log('Album thumbnail URL normalized:', normalizedUrl);
        setThumbnailUrl(normalizedUrl);
      } catch (error) {
        console.error('Error processing album thumbnail URL:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          thumbnail_url: album.thumbnail_url,
          bucket: ALBUM_THUMBNAILS_BUCKET,
        });
        setThumbnailUrl('/placeholder.svg');
      }
    } else if (album) {
      console.warn('No thumbnail_url provided for album:', album.name);
      setThumbnailUrl('/placeholder.svg');
    }

    setIsLoading(false);
  }, [album, coverImage]);

  // Render thumbnail if cover image or album thumbnail is available
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
            console.error('Image failed to load:', {
              url: thumbnailUrl,
              title,
              album: album?.name,
              bucket: coverImage ? BLOG_MEDIA_BUCKET : ALBUM_THUMBNAILS_BUCKET,
            });
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

  // Fallback header if no image
  return (
    <div className="w-full h-24 bg-gray-100 flex items-center justify-center">
      <h1 className="text-2xl font-serif text-tranches-charcoal">{title}</h1>
    </div>
  );
};

export default AlbumThumbnail;
