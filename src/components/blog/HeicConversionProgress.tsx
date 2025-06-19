
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Loader2, FileImage, CheckCircle, AlertTriangle } from 'lucide-react';

interface HeicConversionProgressProps {
  isOpen: boolean;
  onClose: () => void;
  totalFiles: number;
  processedFiles: number;
  currentFileName?: string;
  errors: string[];
  isComplete: boolean;
}

const HeicConversionProgress: React.FC<HeicConversionProgressProps> = ({
  isOpen,
  onClose,
  totalFiles,
  processedFiles,
  currentFileName,
  errors,
  isComplete
}) => {
  const progressPercentage = totalFiles > 0 ? (processedFiles / totalFiles) * 100 : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            )}
            Conversion des images HEIC
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Barre de progression */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Progression</span>
              <span>{processedFiles}/{totalFiles}</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
          </div>

          {/* Fichier en cours */}
          {currentFileName && !isComplete && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <FileImage className="h-4 w-4 text-blue-500" />
              <div className="text-sm">
                <div className="font-medium">Conversion en cours...</div>
                <div className="text-gray-600 truncate">{currentFileName}</div>
              </div>
            </div>
          )}

          {/* État final */}
          {isComplete && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div className="text-sm">
                <div className="font-medium text-green-800">Conversion terminée !</div>
                <div className="text-green-600">
                  {processedFiles} image{processedFiles > 1 ? 's' : ''} convertie{processedFiles > 1 ? 's' : ''} avec succès
                </div>
              </div>
            </div>
          )}

          {/* Erreurs */}
          {errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {errors.length} erreur{errors.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {errors.map((error, index) => (
                  <div key={index} className="text-xs text-gray-600 bg-orange-50 p-2 rounded">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conseils */}
          {!isComplete && (
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              💡 Les images HEIC sont automatiquement converties en JPEG pour une meilleure compatibilité. 
              Cette opération peut prendre quelques secondes par image.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HeicConversionProgress;
