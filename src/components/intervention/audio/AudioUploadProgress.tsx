
import React from 'react';
import { Spinner } from '@/components/ui/spinner';

interface AudioUploadProgressProps {
  isUploading: boolean;
}

const AudioUploadProgress: React.FC<AudioUploadProgressProps> = ({ isUploading }) => {
  if (!isUploading) return null;

  return (
    <div className="flex items-center justify-center py-2 mt-2 bg-gray-100 rounded-md">
      <Spinner className="h-5 w-5 border-gray-500 mr-2" />
      <span className="text-sm text-gray-700">Sauvegarde en cours...</span>
    </div>
  );
};

export default AudioUploadProgress;
