
import React from 'react';
import { X, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaItem {
  id: string;
  name?: string;
  preview?: string;
  type?: 'image' | 'document';
  file?: File;
}

interface MediaDisplayGridProps {
  mediaFiles: MediaItem[];
  onRemoveFile: (id: string) => void;
  readOnly?: boolean;
}

export const MediaDisplayGrid: React.FC<MediaDisplayGridProps> = ({
  mediaFiles,
  onRemoveFile,
  readOnly = false
}) => {
  if (mediaFiles.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {mediaFiles.map((media) => (
        <div key={media.id} className="relative bg-gray-50 rounded-lg overflow-hidden">
          {!readOnly && (
            <Button
              type="button"
              onClick={() => onRemoveFile(media.id)}
              className="absolute top-2 right-2 z-10 h-6 w-6 p-0 bg-red-500 text-white rounded-full hover:bg-red-600"
              size="sm"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
          
          {media.preview && media.type === 'image' ? (
            <div className="w-full">
              <img
                src={media.preview}
                alt={media.name || 'Media'}
                className="w-full h-auto object-contain rounded"
                style={{ 
                  maxHeight: 'none',
                  display: 'block'
                }}
                onError={(e) => {
                  console.error('❌ Erreur de chargement d\'image:', media.preview);
                  e.currentTarget.style.display = 'none';
                  const fallbackDiv = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallbackDiv) {
                    fallbackDiv.classList.remove('hidden');
                  }
                }}
              />
              <div className="hidden w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            </div>
          ) : (
            <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          )}
          
          {media.name && (
            <div className="p-3">
              <p className="text-xs text-gray-600 truncate" title={media.name}>
                {media.name}
              </p>
              {media.file && (
                <p className="text-xs text-gray-400 mt-1">
                  {(media.file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MediaDisplayGrid;
