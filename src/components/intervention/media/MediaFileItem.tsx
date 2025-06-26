
import React, { useState } from 'react';
import { X, Image, File, RefreshCw } from 'lucide-react';
import { MediaFile } from './types';

interface MediaFileItemProps {
  mediaFile: MediaFile;
  onRemove: (id: string) => void;
}

export const MediaFileItem: React.FC<MediaFileItemProps> = ({ mediaFile, onRemove }) => {
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  console.log('📸 MEDIA_ITEM - Rendu:', {
    id: mediaFile.id,
    name: mediaFile.name,
    type: mediaFile.type,
    hasPreview: !!mediaFile.preview,
    hasFile: !!mediaFile.file,
    fileSize: mediaFile.file?.size,
    imageError,
    retryCount
  });

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('❌ MEDIA_ITEM - Erreur de chargement d\'image:', mediaFile.preview);
    setImageError(true);
  };

  const handleRetry = () => {
    console.log('🔄 MEDIA_ITEM - Tentative de rechargement');
    setImageError(false);
    setRetryCount(prev => prev + 1);
  };

  const getFileSize = () => {
    if (!mediaFile.file) return 'Taille inconnue';
    const sizeInMB = mediaFile.file.size / 1024 / 1024;
    return sizeInMB > 0.1 ? `${sizeInMB.toFixed(1)} MB` : `${Math.round(mediaFile.file.size / 1024)} KB`;
  };

  const fileName = mediaFile.name || mediaFile.file?.name || 'Media';

  return (
    <div className="relative bg-gray-50 rounded-lg p-3">
      <button
        type="button"
        onClick={() => onRemove(mediaFile.id)}
        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 z-10"
      >
        <X className="w-3 h-3" />
      </button>
      
      {mediaFile.type === 'image' ? (
        <div className="w-full mb-2">
          {mediaFile.preview && !imageError ? (
            <img
              key={retryCount} // Force re-render on retry
              src={mediaFile.preview}
              alt={fileName}
              className="w-full h-auto object-contain rounded max-h-48"
              onError={handleImageError}
              onLoad={() => {
                console.log('✅ MEDIA_ITEM - Image chargée avec succès');
                setImageError(false);
              }}
            />
          ) : (
            <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded mb-2 flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <Image className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500 mb-2">
                  {imageError ? 'Erreur de chargement' : 'Preview en cours...'}
                </span>
                {imageError && (
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Réessayer
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
          <File className="w-8 h-8 text-gray-400" />
        </div>
      )}
      
      <p className="text-xs text-gray-600 truncate" title={fileName}>
        {fileName}
      </p>
      <p className="text-xs text-gray-400">
        {getFileSize()}
      </p>
    </div>
  );
};

export default MediaFileItem;
