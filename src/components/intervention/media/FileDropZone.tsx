
import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

interface FileDropZoneProps {
  onFileSelect: (files: FileList | null) => void;
  disabled?: boolean;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({ onFileSelect, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    onFileSelect(e.dataTransfer.files);
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
        isDragging 
          ? 'border-tranches-sage bg-tranches-sage/10' 
          : 'border-gray-300 hover:border-tranches-sage'
      } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
      <p className="text-sm text-gray-600 mb-2">
        Glissez-déposez vos fichiers ici ou cliquez pour sélectionner
      </p>
      <p className="text-xs text-gray-500 mb-3">
        Images et documents acceptés (max 500MB par fichier)
      </p>
      <input
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={(e) => onFileSelect(e.target.files)}
        className="hidden"
        id="media-upload"
        disabled={disabled}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => document.getElementById('media-upload')?.click()}
        disabled={disabled}
      >
        Sélectionner des fichiers
      </Button>
    </div>
  );
};

export default FileDropZone;
