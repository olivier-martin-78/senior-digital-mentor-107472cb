
import React from 'react';
import { X, Image, File } from 'lucide-react';
import { MediaFile } from './types';

interface MediaFileItemProps {
  mediaFile: MediaFile;
  onRemove: (id: string) => void;
}

export const MediaFileItem: React.FC<MediaFileItemProps> = ({ mediaFile, onRemove }) => {
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
          {mediaFile.preview ? (
            <img
              src={mediaFile.preview}
              alt={mediaFile.name || mediaFile.file?.name || 'Media'}
              className="w-full h-auto object-contain rounded max-h-48"
              onError={(e) => {
                console.error('❌ Erreur de chargement d\'image:', mediaFile.preview);
                // Afficher l'icône fichier en cas d'erreur
                e.currentTarget.style.display = 'none';
                const fallbackDiv = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallbackDiv) {
                  fallbackDiv.classList.remove('hidden');
                }
              }}
            />
          ) : (
            // Cas où l'image n'a pas de preview (médias existants)
            <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded mb-2 flex items-center justify-center border-2 border-dashed border-gray-300">
              <div className="text-center">
                <Image className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                <span className="text-xs text-gray-500">Image chargée</span>
              </div>
            </div>
          )}
          <div className="hidden w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
            <File className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      ) : (
        <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
          <File className="w-8 h-8 text-gray-400" />
        </div>
      )}
      
      <p className="text-xs text-gray-600 truncate" title={mediaFile.name || mediaFile.file?.name || 'Media'}>
        {mediaFile.name || mediaFile.file?.name || 'Media'}
      </p>
      {mediaFile.file && (
        <p className="text-xs text-gray-400">
          {(mediaFile.file.size / 1024 / 1024).toFixed(1)} MB
        </p>
      )}
    </div>
  );
};

export default MediaFileItem;
