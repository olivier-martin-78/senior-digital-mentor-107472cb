
import React, { useState, useEffect } from 'react';
import { getThumbnailUrl, DIARY_MEDIA_BUCKET, ALBUM_THUMBNAILS_BUCKET } from '@/utils/thumbnailtUtils';
import CommentBubbleIcon from './CommentBubbleIcon';

interface RecentItemImageProps {
  type: 'blog' | 'wish' | 'diary' | 'comment';
  id: string;
  title: string;
  coverImage?: string;
  mediaUrl?: string;
  className?: string;
}

const RecentItemImage: React.FC<RecentItemImageProps> = ({ 
  type, 
  id, 
  title, 
  coverImage, 
  mediaUrl,
  className = "w-48 h-32 flex-shrink-0 overflow-hidden rounded-l-lg"
}) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('/placeholder.svg');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadThumbnail = async () => {
      console.log('🖼️ RecentItemImage - Processing image for:', {
        type,
        id,
        cover_image: coverImage,
        media_url: mediaUrl
      });

      // Pour les commentaires, pas besoin de charger d'image
      if (type === 'comment') {
        console.log('🖼️ Comment detected, using bubble icon:', id);
        setIsLoading(false);
        return;
      }

      let imagePath = '';
      let bucket = ALBUM_THUMBNAILS_BUCKET;

      // Pour les entrées de journal, utiliser media_url avec le bucket diary_media
      if (type === 'diary' && mediaUrl) {
        imagePath = mediaUrl;
        bucket = DIARY_MEDIA_BUCKET;
        console.log('🖼️ Diary entry - using media_url:', mediaUrl, 'with bucket:', bucket);
      }
      // Pour les souhaits et blogs, utiliser cover_image avec le bucket album-thumbnails
      else if ((type === 'wish' || type === 'blog') && coverImage) {
        imagePath = coverImage;
        bucket = ALBUM_THUMBNAILS_BUCKET;
        console.log('🖼️ Wish/Blog - using cover_image:', coverImage, 'with bucket:', bucket);
      }
      
      if (!imagePath) {
        console.log('🖼️ No image path available for:', type, id);
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('🖼️ Generating URL for:', {
          type,
          id,
          bucket,
          imagePath
        });
        
        const url = await getThumbnailUrl(imagePath, bucket);
        console.log('🖼️ Generated URL:', url);
        setThumbnailUrl(url);
      } catch (error) {
        console.error('🖼️ Error generating URL:', {
          type,
          id,
          error
        });
        setThumbnailUrl('/placeholder.svg');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadThumbnail();
  }, [type, id, coverImage, mediaUrl]);

  // Pour les commentaires, afficher l'icône de bulle
  if (type === 'comment') {
    return <CommentBubbleIcon className={className} />;
  }

  // Si pas d'image disponible, ne pas afficher le conteneur
  if (!coverImage && !mediaUrl) {
    return null;
  }

  return (
    <div className={className}>
      {isLoading && (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
        </div>
      )}
      <img
        src={thumbnailUrl}
        alt={title}
        className="w-full h-full object-cover"
        style={{ display: isLoading ? 'none' : 'block' }}
        onError={(e) => {
          console.error('🖼️ ERROR loading image:');
          console.error('- Type:', type);
          console.error('- ID:', id);
          console.error('- Original path:', coverImage || mediaUrl);
          console.error('- Final URL:', thumbnailUrl);
          console.error('- Error:', e);
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          setIsLoading(false);
        }}
        onLoad={() => {
          console.log('🖼️ SUCCESS image loaded for:', {
            type,
            id,
            url: thumbnailUrl
          });
          setIsLoading(false);
        }}
      />
    </div>
  );
};

export default RecentItemImage;
