
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
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(existingMediaFiles);
  const [isDragging, setIsDragging] = useState(false);

  // Initialiser avec les médias existants
  useEffect(() => {
    if (existingMediaFiles.length > 0) {
      setMediaFiles(existingMediaFiles);
    }
  }, [existingMediaFiles]);

  // Notifier le parent quand les médias changent
  useEffect(() => {
    onMediaChange(mediaFiles);
  }, [mediaFiles, onMediaChange]);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const newFiles: MediaFile[] = [];

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
        const reader = new FileReader();
        reader.onload = (e) => {
          mediaFile.preview = e.target?.result as string;
          setMediaFiles(prev => {
            const updated = [...prev, mediaFile];
            return updated;
          });
        };
        reader.readAsDataURL(file);
      } else {
        newFiles.push(mediaFile);
      }
    });

    if (newFiles.length > 0) {
      setMediaFiles(prev => [...prev, ...newFiles]);
    }
  }, []);

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

  const removeFile = (id: string) => {
    setMediaFiles(prev => prev.filter(file => file.id !== id));
  };

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
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {mediaFiles.map((mediaFile) => (
            <div key={mediaFile.id} className="relative bg-gray-50 rounded-lg p-3">
              <button
                type="button"
                onClick={() => removeFile(mediaFile.id)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
              
              {mediaFile.type === 'image' && mediaFile.preview ? (
                <img
                  src={mediaFile.preview}
                  alt={mediaFile.file.name}
                  className="w-full h-20 object-cover rounded mb-2"
                />
              ) : (
                <div className="w-full h-20 bg-gray-200 rounded mb-2 flex items-center justify-center">
                  <File className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              <p className="text-xs text-gray-600 truncate" title={mediaFile.file.name}>
                {mediaFile.file.name}
              </p>
              <p className="text-xs text-gray-400">
                {(mediaFile.file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
