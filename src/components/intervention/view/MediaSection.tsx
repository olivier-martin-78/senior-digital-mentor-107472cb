
import React from 'react';
import { FileText } from 'lucide-react';

interface MediaSectionProps {
  mediaFiles: any[];
}

export const MediaSection: React.FC<MediaSectionProps> = ({ mediaFiles }) => {
  if (!mediaFiles || mediaFiles.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">Photos et documents</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mediaFiles.map((media: any, index: number) => (
          <div key={index} className="bg-gray-50 rounded-lg p-3">
            {media.preview ? (
              <div className="w-full mb-2">
                <img
                  src={media.preview}
                  alt={media.name || `Media ${index + 1}`}
                  className="w-full h-auto object-contain rounded"
                  style={{ maxHeight: 'none' }}
                />
              </div>
            ) : (
              <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            )}
            <p className="text-xs text-gray-600 truncate">{media.name || `Media ${index + 1}`}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
