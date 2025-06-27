
import React from 'react';
import { AlertCircle } from 'lucide-react';

interface AudioErrorMessageProps {
  hasError: boolean;
  errorMessage: string;
  audioUrl: string;
  className?: string;
}

const AudioErrorMessage: React.FC<AudioErrorMessageProps> = ({
  hasError,
  errorMessage,
  audioUrl,
  className = ""
}) => {
  if (!hasError) return null;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-3 ${className}`}>
      <div className="flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-red-700">{errorMessage}</p>
          <p className="text-xs text-red-600 mt-1">Vérifiez que le fichier audio est accessible</p>
          <p className="text-xs text-gray-500 mt-1">URL: {audioUrl}</p>
        </div>
      </div>
    </div>
  );
};

export default AudioErrorMessage;
