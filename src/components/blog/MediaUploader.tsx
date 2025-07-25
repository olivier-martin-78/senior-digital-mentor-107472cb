
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X, AlertTriangle } from 'lucide-react';
import { 
  validateFileSize, 
  isVideoFile, 
  formatFileSize,
  MAX_FILE_SIZE 
} from '@/utils/videoCompressionUtils';

interface MediaUploaderProps {
  handleFileUpload: (files: File[]) => Promise<void>;
  uploadingFiles: boolean;
  uploadErrors: string[];
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ 
  handleFileUpload, 
  uploadingFiles, 
  uploadErrors 
}) => {
  const [dragActive, setDragActive] = useState(false);
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };
  
  // Handle drop event
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      await processFiles(files);
    }
  };

  // Traiter les fichiers directement
  const processFiles = async (files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Valider chaque fichier
    for (const file of files) {
      const sizeValidation = validateFileSize(file);
      if (!sizeValidation.isValid) {
        errors.push(`${file.name}: ${sizeValidation.error}`);
        continue;
      }
      validFiles.push(file);
    }

    if (errors.length > 0) {
      console.error('Erreurs de validation:', errors);
      return;
    }

    // Appeler directement la fonction d'upload avec les fichiers valides
    if (validFiles.length > 0) {
      await handleFileUpload(validFiles);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await processFiles(files);
      // Clear input après traitement
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className="relative"
      >
        <Label htmlFor="media-upload" className="cursor-pointer">
          <div className={`flex items-center justify-center border-2 ${
            dragActive ? 'border-tranches-sage bg-tranches-sage/10' : 'border-dashed border-gray-300'
          } rounded-lg p-6 hover:border-tranches-sage transition-colors`}>
            <div className="text-center">
              <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                Cliquez ou glissez-déposez pour ajouter des images ou vidéos
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Formats supportés: JPG, PNG, GIF, MP4, etc.
              </p>
              <p className="text-xs text-gray-500">
                Taille maximale: {formatFileSize(MAX_FILE_SIZE)}
              </p>
            </div>
          </div>
          <Input
            id="media-upload"
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={handleInputChange}
            disabled={uploadingFiles}
          />
        </Label>
      </div>

      {/* Avertissement pour les gros fichiers */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-xs text-yellow-800">
            <strong>Conseils pour les vidéos :</strong>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Les vidéos seront automatiquement optimisées lors de l'upload</li>
              <li>Pour de meilleurs résultats, utilisez des vidéos de moins de {formatFileSize(MAX_FILE_SIZE)}</li>
              <li>Formats recommandés : MP4, WebM</li>
            </ul>
          </div>
        </div>
      </div>

      {uploadErrors.length > 0 && (
        <div className="bg-red-50 text-red-800 p-3 rounded-md">
          <h3 className="font-medium mb-1">Erreurs d'upload:</h3>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {uploadErrors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MediaUploader;
