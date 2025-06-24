
import React from 'react';
import MediaFileItem from './MediaFileItem';
import { MediaFile } from './types';

interface MediaFileListProps {
  mediaFiles: MediaFile[];
  onRemoveFile: (id: string) => void;
}

export const MediaFileList: React.FC<MediaFileListProps> = ({ mediaFiles, onRemoveFile }) => {
  if (mediaFiles.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {mediaFiles.map((mediaFile) => (
        <MediaFileItem
          key={mediaFile.id}
          mediaFile={mediaFile}
          onRemove={onRemoveFile}
        />
      ))}
    </div>
  );
};

export default MediaFileList;
