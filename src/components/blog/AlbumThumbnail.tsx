import React, { useState, useEffect } from 'react';
import { BlogAlbum } from '@/types/supabase';
import { getThumbnailUrl, ALBUM_THUMBNAILS_BUCKET, BLOG_MEDIA_BUCKET } from '@/utils/thumbnailtUtils';
import { ImageIcon } from 'lucide-react';

interface AlbumThumbnailProps {
  album: BlogAlbum | null;
  title: string;
  coverImage?: string | null;
}

const AlbumThumbnail: React.FC<AlbumThumbnailProps> = ({ album, title, coverImage }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('/placeholder.svg');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchThumbnail = async () => {
      setIsLoading(true);
      console.log('fetchThumbnail called:', { coverImage, albumId: album?.id, albumThumbnail: album?.thumbnail_url });

      // Handle cover image (post's cover_image, stored in blog-media)
      if (coverImage) {
        try {
          const normalizedUrl = await getThumbnailUrl(coverImage, BLOG_MEDIA_BUCKET);
          console.log('Cover image URL normalized:', { coverImage, normalizedUrl });
          setThumbnailUrl(normalizedUrl || '/placeholder.svg');
        } catch (error) {
          console.error('Error processing coverImage URL:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            coverImage,
            bucket: BLOG_MEDIA_BUCKET,
          });
          setThumbnailUrl('/placeholder.svg');
        }
        setIsLoading(false);
        return;
      }

      // Handle album thumbnail (stored in album-thumbnails)
      if (album?.thumbnail_url) {
        try {
          const normalizedUrl = await getThumbnailUrl(album.thumbnail_url, ALBUM_THUMBNAILS_BUCKET);
          console.log('Album thumbnail URL normalized:', { thumbnail_url: album.thumbnail_url, normalizedUrl });
          setThumbnailUrl(normalizedUrl || '/placeholder.svg');
        } catch (error) {
          console.error('Error processing album thumbnail URL:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            thumbnail_url: album.thumbnail_url,
            bucket: ALBUM_THUMBNAILS_BUCKET,
          });
          setThumbnailUrl('/placeholder.svg');
        }
      } else {
        console.warn('No thumbnail available:', { albumId: album?.id, albumName: album?.name, coverImage });
        setThumbnailUrl('/placeholder.svg');
      }

      setIsLoading(false);
    };

    fetchThumbnail();
  }, [album, coverImage]);

  // Toujours afficher l'image si thumbnailUrl est défini
  if (thumbnailUrl) {
    return (
      <div className="w-full h-40 relative">
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
        {album && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent p-2">
            <div className="text-white text-sm opacity-75">
              Album: {album.name}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
      <div className="text-gray-400 text-center">
        <ImageIcon className="h-12 w-12 mx-auto mb-2" />
        <span className="text-sm">Aucune image</span>
      </div>
    </div>
  );
};

export default AlbumThumbnail;
