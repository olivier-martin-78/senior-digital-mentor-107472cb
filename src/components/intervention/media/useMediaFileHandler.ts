import { useState, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { MediaFile } from './types';
import { MAX_FILE_SIZE } from '@/utils/videoCompressionUtils';

interface UseMediaFileHandlerProps {
  onMediaChange: (files: MediaFile[]) => void;
  existingMediaFiles?: MediaFile[];
}

export const useMediaFileHandler = ({ onMediaChange, existingMediaFiles = [] }: UseMediaFileHandlerProps) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  // Initialiser avec les médias existants au premier rendu
  useEffect(() => {
    if (existingMediaFiles.length > 0 && mediaFiles.length === 0) {
      console.log('📸 MediaUploader - Initialisation avec médias existants:', existingMediaFiles);
      
      // Traiter les médias existants pour générer les previews manquantes
      const processedMedia = existingMediaFiles.map(media => {
        // Si c'est une image et qu'elle n'a pas de preview, essayer de la générer
        if (media.type === 'image' && !media.preview && media.file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setMediaFiles(prev => prev.map(m => 
              m.id === media.id ? { ...m, preview: e.target?.result as string } : m
            ));
          };
          reader.readAsDataURL(media.file);
        }
        return media;
      });
      
      setMediaFiles(processedMedia);
    }
  }, [existingMediaFiles, mediaFiles.length]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: MediaFile[] = [];
    let pendingImageFiles: MediaFile[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > MAX_FILE_SIZE) { // Utiliser la constante partagée
        const maxSizeMB = Math.round(MAX_FILE_SIZE / (1024 * 1024));
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} dépasse la limite de ${maxSizeMB}MB`,
          variant: "destructive",
        });
        return;
      }

      const id = `${Date.now()}-${Math.random()}`;
      const type = file.type.startsWith('image/') ? 'image' : 'document';
      
      const mediaFile: MediaFile = {
        id,
        file,
        type,
        name: file.name
      };

      if (type === 'image') {
        pendingImageFiles.push(mediaFile);
      } else {
        newFiles.push(mediaFile);
      }
    });

    // Traiter d'abord les fichiers non-image
    if (newFiles.length > 0) {
      setMediaFiles(prev => {
        const updated = [...prev, ...newFiles];
        onMediaChange(updated);
        return updated;
      });
    }

    // Traiter les images avec preview
    pendingImageFiles.forEach((mediaFile) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        mediaFile.preview = e.target?.result as string;
        setMediaFiles(prev => {
          const updated = [...prev, mediaFile];
          onMediaChange(updated);
          return updated;
        });
      };
      reader.readAsDataURL(mediaFile.file);
    });
  }, [onMediaChange]);

  const removeFile = useCallback((id: string) => {
    setMediaFiles(prev => {
      const updated = prev.filter(file => file.id !== id);
      onMediaChange(updated);
      return updated;
    });
  }, [onMediaChange]);

  return {
    mediaFiles,
    handleFileSelect,
    removeFile
  };
};
