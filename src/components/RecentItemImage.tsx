
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

  useEffect(() => {
    const loadThumbnail = async () => {
      console.log('RecentItemImage - renderItemImage pour:', {
        type,
        id,
        cover_image: coverImage,
        media_url: mediaUrl
      });

      // Pour les commentaires, pas besoin de charger d'image
      if (type === 'comment') {
        console.log('RecentItemImage - Commentaire détecté, utilisation de l\'icône bulle:', id);
        return;
      }

      let imagePath = '';

      // Pour les entrées de journal, utiliser media_url avec le bucket diary_media
      if (type === 'diary' && mediaUrl) {
        imagePath = mediaUrl;
        console.log('RecentItemImage - Traitement image journal - ID:', id, 'media_url:', mediaUrl);
      }
      // Pour les souhaits et blogs, utiliser cover_image avec le bucket album-thumbnails
      else if ((type === 'wish' || type === 'blog') && coverImage) {
        imagePath = coverImage;
        console.log('RecentItemImage - Traitement image', type, '- ID:', id, 'cover_image:', coverImage);
      }
      
      if (!imagePath) {
        console.log('RecentItemImage - Pas d\'image pour:', type, id);
        return;
      }
      
      try {
        let bucket = ALBUM_THUMBNAILS_BUCKET;
        if (type === 'diary') {
          bucket = DIARY_MEDIA_BUCKET;
        }
        
        console.log('RecentItemImage - Génération URL pour:', {
          type,
          id,
          bucket,
          imagePath
        });
        
        const url = await getThumbnailUrl(imagePath, bucket);
        console.log('RecentItemImage - URL générée:', url);
        setThumbnailUrl(url);
      } catch (error) {
        console.error('RecentItemImage - Erreur génération URL:', {
          type,
          id,
          error
        });
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
      <img
        src={thumbnailUrl}
        alt={title}
        className="w-full h-full object-cover"
        onError={(e) => {
          console.error('RecentItemImage - ERREUR chargement image:');
          console.error('- Type:', type);
          console.error('- ID:', id);
          console.error('- Path original:', coverImage || mediaUrl);
          console.error('- URL finale:', thumbnailUrl);
          console.error('- Erreur:', e);
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
        onLoad={() => {
          console.log('RecentItemImage - SUCCESS image chargée pour:', {
            type,
            id,
            url: thumbnailUrl
          });
        }}
      />
    </div>
  );
};

export default RecentItemImage;
