
import { useState, useEffect } from 'react';
import { MediaFile, MediaUploaderProps } from './types';

interface UseMediaFileHandlerProps {
  onMediaChange: MediaUploaderProps['onMediaChange'];
  existingMediaFiles: MediaFile[];
}

export const useMediaFileHandler = ({ onMediaChange, existingMediaFiles }: UseMediaFileHandlerProps) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  useEffect(() => {
    // Remove duplicates from existing media files based on unique identifiers
    const uniqueExistingFiles = existingMediaFiles.filter((media, index, self) => {
      const identifier = media.id || media.name || media.preview || JSON.stringify(media);
      return index === self.findIndex(m => {
        const mIdentifier = m.id || m.name || m.preview || JSON.stringify(m);
        return mIdentifier === identifier;
      });
    });

    console.log('📸 MEDIA_HANDLER - Deduplicating existing files:', {
      original: existingMediaFiles.length,
      unique: uniqueExistingFiles.length,
      duplicatesRemoved: existingMediaFiles.length - uniqueExistingFiles.length
    });

    setMediaFiles(uniqueExistingFiles);
  }, [existingMediaFiles]);

  const handleFileSelect = (files: File[]) => {
    const newMediaFiles: MediaFile[] = files.map(file => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        id,
        name: file.name,
        file,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      };
    });

    // Check for duplicates before adding
    const filteredNewFiles = newMediaFiles.filter(newFile => {
      return !mediaFiles.some(existingFile => 
        existingFile.name === newFile.name && 
        existingFile.file?.size === newFile.file?.size
      );
    });

    if (filteredNewFiles.length !== newMediaFiles.length) {
      console.log('📸 MEDIA_HANDLER - Prevented duplicate file uploads:', {
        attempted: newMediaFiles.length,
        added: filteredNewFiles.length,
        duplicatesBlocked: newMediaFiles.length - filteredNewFiles.length
      });
    }

    const updatedFiles = [...mediaFiles, ...filteredNewFiles];
    setMediaFiles(updatedFiles);
    onMediaChange(updatedFiles);
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = mediaFiles.filter(file => file.id !== fileId);
    setMediaFiles(updatedFiles);
    onMediaChange(updatedFiles);
  };

  return {
    mediaFiles,
    handleFileSelect,
    removeFile
  };
};
