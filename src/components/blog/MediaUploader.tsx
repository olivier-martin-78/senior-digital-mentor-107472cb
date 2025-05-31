
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Upload, X, AlertTriangle } from 'lucide-react';
import { 
  validateFileSize, 
  compressVideo, 
  isVideoFile, 
  formatFileSize,
  MAX_FILE_SIZE 
} from '@/utils/videoCompressionUtils';
import UploadProgress from './UploadProgress';

interface MediaUploaderProps {
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingFiles: boolean;
  uploadErrors: string[];
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'compressing' | 'uploading' | 'success' | 'error';
  error?: string;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({ 
  handleFileUpload, 
  uploadingFiles, 
  uploadErrors 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFilesList, setUploadingFilesList] = useState<UploadingFile[]>([]);
  
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
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Gérer les fichiers sélectionnés
  const handleFiles = async (files: File[]) => {
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
      // Afficher les erreurs de validation
      console.error('Erreurs de validation:', errors);
      return;
    }

    // Traiter les fichiers valides
    const processedFiles: File[] = [];
    
    for (const file of validFiles) {
      const uploadingFile: UploadingFile = {
        file,
        progress: 0,
        status: isVideoFile(file) ? 'compressing' : 'uploading'
      };
      
      setUploadingFilesList(prev => [...prev, uploadingFile]);

      try {
        let processedFile = file;
        
        // Compresser les vidéos si nécessaire
        if (isVideoFile(file) && file.size > 50 * 1024 * 1024) { // > 50MB
          uploadingFile.status = 'compressing';
          setUploadingFilesList(prev => 
            prev.map(f => f.file.name === file.name ? uploadingFile : f)
          );
          
          processedFile = await compressVideo(file, (progress) => {
            setUploadingFilesList(prev => 
              prev.map(f => 
                f.file.name === file.name 
                  ? { ...f, progress: progress * 0.5 } // 50% pour la compression
                  : f
              )
            );
          });
        }
        
        uploadingFile.status = 'uploading';
        uploadingFile.progress = isVideoFile(file) ? 50 : 0;
        setUploadingFilesList(prev => 
          prev.map(f => f.file.name === file.name ? uploadingFile : f)
        );
        
        processedFiles.push(processedFile);
        
        uploadingFile.status = 'success';
        uploadingFile.progress = 100;
        setUploadingFilesList(prev => 
          prev.map(f => f.file.name === file.name ? uploadingFile : f)
        );
        
      } catch (error) {
        uploadingFile.status = 'error';
        uploadingFile.error = error instanceof Error ? error.message : 'Erreur inconnue';
        setUploadingFilesList(prev => 
          prev.map(f => f.file.name === file.name ? uploadingFile : f)
        );
      }
    }

    // Simuler l'événement de changement pour le gestionnaire existant
    if (processedFiles.length > 0) {
      const dataTransfer = new DataTransfer();
      processedFiles.forEach(file => dataTransfer.items.add(file));
      
      const fileInput = document.getElementById('media-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.files = dataTransfer.files;
        const event = new Event('change', { bubbles: true }) as any;
        event.target = fileInput;
        handleFileUpload(event);
      }
    }

    // Nettoyer la liste après 3 secondes
    setTimeout(() => {
      setUploadingFilesList([]);
    }, 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
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

      {/* Affichage des fichiers en cours d'upload */}
      {uploadingFilesList.length > 0 && (
        <div className="space-y-2">
          {uploadingFilesList.map((uploadingFile, index) => (
            <UploadProgress
              key={`${uploadingFile.file.name}-${index}`}
              progress={uploadingFile.progress}
              status={uploadingFile.status}
              fileName={uploadingFile.file.name}
              error={uploadingFile.error}
            />
          ))}
        </div>
      )}

      {/* Avertissement pour les gros fichiers */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex">
          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-xs text-yellow-800">
            <strong>Conseils pour les vidéos :</strong>
            <ul className="mt-1 list-disc list-inside space-y-1">
              <li>Les vidéos de plus de 50 MB seront automatiquement compressées</li>
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
