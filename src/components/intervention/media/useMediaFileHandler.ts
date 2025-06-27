
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
      console.log('📸 MEDIA_HANDLER - Initialisation avec médias existants:', existingMediaFiles);
      
      // Traiter les médias existants pour s'assurer qu'ils ont les bonnes propriétés
      const processedMedia = existingMediaFiles.map(media => {
        console.log('📸 MEDIA_HANDLER - Traitement média existant:', {
          id: media.id,
          name: media.name,
          type: media.type,
          hasPreview: !!media.preview,
          hasFile: !!media.file
        });

        // Pour les médias existants qui sont des images mais n'ont pas de preview
        if (media.type === 'image' && !media.preview) {
          // Si c'est un média existant (pas un nouveau fichier), utiliser l'URL comme preview
          const processedMedia = {
            ...media,
            preview: media.file ? undefined : (media as any).url || (media as any).media_url
          };
          
          console.log('📸 MEDIA_HANDLER - Média traité:', processedMedia);
          return processedMedia;
        }
        
        return media;
      });
      
      setMediaFiles(processedMedia);
    }
  }, [existingMediaFiles, mediaFiles.length]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    console.log('📸 MEDIA_HANDLER - Sélection de fichiers:', files.length);

    const newFiles: MediaFile[] = [];
    let pendingImageFiles: MediaFile[] = [];

    Array.from(files).forEach((file) => {
      console.log('📸 MEDIA_HANDLER - Traitement fichier:', {
        name: file.name,
        size: file.size,
        type: file.type
      });

      if (file.size > MAX_FILE_SIZE) {
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
        console.log('📸 MEDIA_HANDLER - Image ajoutée à la file:', file.name);
        pendingImageFiles.push(mediaFile);
      } else {
        console.log('📸 MEDIA_HANDLER - Document ajouté:', file.name);
        newFiles.push(mediaFile);
      }
    });

    // Traiter d'abord les fichiers non-image
    if (newFiles.length > 0) {
      console.log('📸 MEDIA_HANDLER - Ajout fichiers non-image:', newFiles.length);
      setMediaFiles(prev => {
        const updated = [...prev, ...newFiles];
        onMediaChange(updated);
        return updated;
      });
    }

    // Traiter les images avec preview
    pendingImageFiles.forEach((mediaFile) => {
      console.log('📸 MEDIA_HANDLER - Génération preview pour nouvelle image:', mediaFile.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        mediaFile.preview = preview;
        console.log('📸 MEDIA_HANDLER - Preview générée, ajout à la liste');
        setMediaFiles(prev => {
          const updated = [...prev, mediaFile];
          onMediaChange(updated);
          return updated;
        });
      };
      reader.onerror = (error) => {
        console.error('❌ MEDIA_HANDLER - Erreur lecture fichier:', error);
        // Ajouter quand même le fichier sans preview
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
    console.log('📸 MEDIA_HANDLER - Suppression fichier:', id);
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
