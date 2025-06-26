
import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { CheckCircle, Clock } from 'lucide-react';

interface AudioUploadStatusProps {
  isUploading: boolean;
  isSaving: boolean;
  isSaved: boolean;
  uploadedAudioUrl: string | null;
}

const AudioUploadStatus: React.FC<AudioUploadStatusProps> = ({
  isUploading,
  isSaving,
  isSaved,
  uploadedAudioUrl
}) => {
  if (isUploading) {
    return (
      <div className="flex items-center justify-center py-2 mt-2 bg-blue-50 border border-blue-200 rounded-md">
        <Spinner className="h-5 w-5 border-blue-500 mr-2" />
        <span className="text-sm text-blue-700">Téléchargement en cours...</span>
      </div>
    );
  }

  if (isSaving && !isUploading) {
    return (
      <div className="flex items-center justify-center py-2 mt-2 bg-orange-50 border border-orange-200 rounded-md">
        <Clock className="h-5 w-5 text-orange-500 mr-2" />
        <span className="text-sm text-orange-700">Sauvegarde automatique en cours...</span>
      </div>
    );
  }

  if (isSaved && !isSaving && !isUploading) {
    return (
      <div className="flex items-center justify-center py-2 mt-2 bg-green-50 border border-green-200 rounded-md">
        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
        <span className="text-sm text-green-700">✓ Enregistrement sauvegardé automatiquement</span>
      </div>
    );
  }

  if (uploadedAudioUrl && !isUploading && !isSaving && !isSaved && uploadedAudioUrl !== 'local-audio') {
    return (
      <div className="py-2 mt-2 bg-gray-100 rounded-md text-center">
        <span className="text-sm text-gray-600">Audio disponible</span>
      </div>
    );
  }

  if (uploadedAudioUrl === 'local-audio' && !isUploading && !isSaving) {
    return (
      <div className="py-2 mt-2 bg-yellow-100 rounded-md text-center">
        <span className="text-sm text-yellow-700">⚠ Audio local uniquement</span>
      </div>
    );
  }

  return null;
};

export default AudioUploadStatus;
