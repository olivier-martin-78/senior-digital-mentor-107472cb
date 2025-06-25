
import React from 'react';
import { Label } from '@/components/ui/label';
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
    <div className="space-y-2">
      <Label className="text-base font-medium">Ajouter des médias</Label>
      <MediaUploader
        onMediaChange={onMediaChange}
        existingMediaFiles={mediaFiles}
      />
    </div>
  );
};
