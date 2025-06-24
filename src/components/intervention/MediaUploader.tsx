
import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image, File } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface MediaFile {
  id: string;
  file: File;
  preview?: string;
  type: 'image' | 'document';
}

interface MediaUploaderProps {
  onMediaChange: (files: MediaFile[]) => void;
  existingMediaFiles?: MediaFile[];
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({ 
  onMediaChange, 
  existingMediaFiles = [] 
}) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Initialiser avec les médias existants au premier rendu
  useEffect(() => {
    if (existingMediaFiles.length > 0 && mediaFiles.length === 0) {
      console.log('📸 MediaUploader - Initialisation avec médias existants:', existingMediaFiles);
      setMediaFiles(existingMediaFiles);
    }
  }, [existingMediaFiles]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: MediaFile[] = [];
    let pendingImageFiles: MediaFile[] = [];

    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "Fichier trop volumineux",
          description: `${file.name} dépasse la limite de 10MB`,
          variant: "destructive",
        });
        return;
      }

      const id = `${Date.now()}-${Math.random()}`;
      const type = file.type.startsWith('image/') ? 'image' : 'document';
      
      const mediaFile: MediaFile = {
        id,
        file,
        type
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeFile = useCallback((id: string) => {
    setMediaFiles(prev => {
      const updated = prev.filter(file => file.id !== id);
      onMediaChange(updated);
      return updated;
    });
  }, [onMediaChange]);

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium mb-2">Photos et documents</div>
      
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging 
            ? 'border-tranches-sage bg-tranches-sage/10' 
            : 'border-gray-300 hover:border-tranches-sage'
        }`}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFileSelect(e.dataTransfer.files);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
      >
        <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-2">
          Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
        </p>
        <p className="text-xs text-gray-500 mb-3">
          Images et documents acceptés (max 10MB par fichier)
        </p>
        <input
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.txt"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          id="media-upload"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => document.getElementById('media-upload')?.click()}
        >
          Sélectionner des fichiers
        </Button>
      </div>

      {/* File list */}
      {mediaFiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mediaFiles.map((mediaFile) => (
            <div key={mediaFile.id} className="relative bg-gray-50 rounded-lg p-3">
              <button
                type="button"
                onClick={() => removeFile(mediaFile.id)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 z-10"
              >
                <X className="w-3 h-3" />
              </button>
              
              {mediaFile.type === 'image' && mediaFile.preview ? (
                <div className="w-full mb-2">
                  <img
                    src={mediaFile.preview}
                    alt={mediaFile.file?.name || 'Media'}
                    className="w-full h-auto object-contain rounded max-h-48"
                    onError={(e) => {
                      console.error('❌ Erreur de chargement d\'image:', mediaFile.preview);
                      // Fallback vers une icône fichier
                      e.currentTarget.style.display = 'none';
                      const fallbackDiv = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallbackDiv) {
                        fallbackDiv.classList.remove('hidden');
                      }
                    }}
                  />
                  <div className="hidden w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
                    <File className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
              ) : null}
              
              {(mediaFile.type !== 'image' || !mediaFile.preview) && (
                <div className="w-full h-32 bg-gray-200 rounded mb-2 flex items-center justify-center">
                  <File className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              <p className="text-xs text-gray-600 truncate" title={mediaFile.file?.name || 'Media'}>
                {mediaFile.file?.name || 'Media'}
              </p>
              {mediaFile.file && (
                <p className="text-xs text-gray-400">
                  {(mediaFile.file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
