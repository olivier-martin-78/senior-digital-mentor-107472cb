
import React from 'react';
import { Label } from '@/components/ui/label';
import MediaDisplayGrid from '../MediaDisplayGrid';
import MediaUploader from '../MediaUploader';

interface MediaSectionProps {
  mediaFiles: any[];
  onMediaChange: (mediaFiles: any[]) => void;
  onRemoveFile: (fileId: string) => void;
}

export const MediaSection: React.FC<MediaSectionProps> = ({
  mediaFiles,
  onMediaChange,
  onRemoveFile
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label className="text-base font-medium">Photos existantes</Label>
        {mediaFiles.length > 0 ? (
          <MediaDisplayGrid
            mediaFiles={mediaFiles}
            onRemoveFile={onRemoveFile}
          />
        ) : (
          <p className="text-sm text-gray-500">Aucune photo disponible</p>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-base font-medium">Ajouter des médias</Label>
        <MediaUploader
          onMediaChange={onMediaChange}
          existingMediaFiles={mediaFiles}
        />
      </div>
    </>
  );
};
