
import React, { useEffect, useState } from 'react';
import { BlogMedia } from '@/types/supabase';

interface MediaItemProps {
  item: BlogMedia;
  imageUrl: string;
  onClick: () => void;
  isConverting: boolean;
  isConversionFailed: boolean;
  shouldAttemptConversion: boolean;
  onConvert: (url: string, mediaId: string) => void;
  onImageError: (mediaId: string) => void;
}

const MediaItem: React.FC<MediaItemProps> = ({
  item,
  imageUrl,
  onClick,
  isConverting,
  isConversionFailed,
  shouldAttemptConversion,
  onConvert,
  onImageError
}) => {
  const [hasTriedConversion, setHasTriedConversion] = useState(false);

  // Tenter la conversion si nécessaire
  useEffect(() => {
    if (shouldAttemptConversion && imageUrl !== '/placeholder.svg' && !hasTriedConversion) {
      console.log('🎯 Tentative de conversion pour:', item.id);
      setHasTriedConversion(true);
      onConvert(imageUrl, item.id);
    }
  }, [shouldAttemptConversion, imageUrl, item.id, onConvert, hasTriedConversion]);

  if (item.media_type.startsWith('image/')) {
    return (
      <div 
        className="flex-1 border-2 border-white cursor-pointer hover:opacity-90 transition-opacity relative"
        onClick={onClick}
      >
        {isConversionFailed ? (
          <div className="flex items-center justify-center bg-gray-100 aspect-square">
            <div className="text-center text-gray-500">
              <p className="text-sm font-medium">Format non supporté</p>
              <p className="text-xs">Impossible de convertir ce fichier HEIC</p>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setHasTriedConversion(false);
                  onConvert(imageUrl, item.id);
                }}
                className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
              >
                Réessayer
              </button>
            </div>
          </div>
        ) : isConverting ? (
          <div className="flex items-center justify-center bg-gray-100 aspect-square">
            <div className="text-center text-gray-500">
              <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm font-medium">Conversion en cours...</p>
              <p className="text-xs">Adaptation du format HEIC</p>
            </div>
          </div>
        ) : (
          <img
            src={imageUrl}
            alt="Media du post"
            className="w-full aspect-square object-cover"
            onError={() => {
              console.log('❌ Erreur chargement image:', item.id, imageUrl);
              onImageError(item.id);
            }}
            onLoad={() => {
              console.log('✅ Image chargée:', { id: item.id, url: imageUrl });
            }}
          />
        )}
      </div>
    );
  }

  if (item.media_type.startsWith('video/')) {
    return (
      <div 
        className="flex-1 border-2 border-white cursor-pointer hover:opacity-90 transition-opacity relative"
        onClick={onClick}
      >
        <div className="relative bg-gray-900">
          <video
            src={imageUrl}
            className="w-full aspect-square object-cover"
            muted
            playsInline
            preload="metadata"
            onError={() => onImageError(item.id)}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <div className="w-16 h-16 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-l-[12px] border-l-black border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
            </div>
          </div>
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
            📹 Vidéo
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 border-2 border-white cursor-pointer hover:opacity-90 transition-opacity relative"
      onClick={onClick}
    >
      <div className="flex items-center justify-center bg-gray-100 aspect-square">
        <p className="text-gray-500">Fichier non prévisualisable</p>
      </div>
    </div>
  );
};

export default MediaItem;
