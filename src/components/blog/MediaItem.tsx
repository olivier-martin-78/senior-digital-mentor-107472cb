
import React, { useState, useRef, useEffect } from 'react';
import { Play, X } from 'lucide-react';
import { BlogMedia } from '@/types/supabase';
import { Button } from '@/components/ui/button';

interface MediaItemProps {
  media: BlogMedia;
  onDelete?: (media: BlogMedia) => void;
  onClick?: () => void;
  showDeleteButton?: boolean;
}

const MediaItem: React.FC<MediaItemProps> = ({
  media,
  onDelete,
  onClick,
  showDeleteButton = false
}) => {
  const [thumbnailError, setThumbnailError] = useState(false);
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Générer une vignette pour les vidéos
  useEffect(() => {
    if (media.media_type.startsWith('video/') && !media.thumbnail_url && !videoThumbnail) {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        video.currentTime = 1; // Aller à 1 seconde
      };
      
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
          setVideoThumbnail(thumbnailUrl);
        }
      };
      
      video.onerror = () => {
        console.log('Erreur lors de la génération de la vignette vidéo');
        setThumbnailError(true);
      };
      
      video.src = media.media_url;
    }
  }, [media, videoThumbnail]);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(media);
    }
  };

  return (
    <div className="relative group bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow flex-1">
      {/* Utilisation d'un aspect-ratio fixe pour uniformiser les hauteurs */}
      <div className="aspect-square relative w-full" onClick={handleClick}>
        {media.media_type.startsWith('image/') ? (
          <img
            src={media.media_url}
            alt="Media"
            className="w-full h-full object-cover"
            onError={() => setThumbnailError(true)}
          />
        ) : media.media_type.startsWith('video/') ? (
          <div className="relative w-full h-full">
            {/* Utiliser la vignette générée ou celle stockée */}
            {(media.thumbnail_url || videoThumbnail) && !thumbnailError ? (
              <img
                src={media.thumbnail_url || videoThumbnail || ''}
                alt="Vignette vidéo"
                className="w-full h-full object-cover"
                onError={() => setThumbnailError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  src={media.media_url}
                  preload="metadata"
                  className="w-full h-full object-cover"
                  muted
                />
              </div>
            )}
            
            {/* Icône play réduite - encore plus petite */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white/90 rounded-full p-1.5 shadow-lg">
                <Play className="w-3 h-3 text-gray-800 fill-current" />
              </div>
            </div>
            
            {/* Indicateur vidéo permanent en bas à droite */}
            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded text-[10px]">
              Vidéo
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <p className="text-gray-500 text-sm text-center p-2">
              Fichier non prévisualisable
            </p>
          </div>
        )}
      </div>
      
      {showDeleteButton && onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export default MediaItem;
