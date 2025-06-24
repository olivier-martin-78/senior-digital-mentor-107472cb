
import React from 'react';
import FileDropZone from './media/FileDropZone';
import MediaFileList from './media/MediaFileList';
import { useMediaFileHandler } from './media/useMediaFileHandler';
import { MediaUploaderProps } from './media/types';

export const MediaUploader: React.FC<MediaUploaderProps> = ({ 
  onMediaChange, 
  existingMediaFiles = [] 
}) => {
  const { mediaFiles, handleFileSelect, removeFile } = useMediaFileHandler({
    onMediaChange,
    existingMediaFiles
  });

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium mb-2">Photos et documents</div>
      
      <FileDropZone onFileSelect={handleFileSelect} />

      <MediaFileList 
        mediaFiles={mediaFiles} 
        onRemoveFile={removeFile} 
      />
    </div>
  );
};

export default MediaUploader;
