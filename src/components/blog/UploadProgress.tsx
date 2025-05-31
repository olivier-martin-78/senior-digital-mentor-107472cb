
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
  status: 'uploading' | 'compressing' | 'success' | 'error';
  fileName: string;
  error?: string;
}

const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  status,
  fileName,
  error
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
      case 'compressing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'compressing':
        return 'Compression en cours...';
      case 'uploading':
        return 'Téléchargement en cours...';
      case 'success':
        return 'Téléchargement terminé !';
      case 'error':
        return 'Erreur de téléchargement';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-tranches-sage';
    }
  };

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center mb-2">
        {getStatusIcon()}
        <span className="ml-2 text-sm font-medium truncate">{fileName}</span>
      </div>
      
      <div className="mb-2">
        <Progress 
          value={progress} 
          className="h-2"
          indicatorClassName={getStatusColor()}
        />
      </div>
      
      <div className="flex justify-between items-center text-xs text-gray-600">
        <span>{getStatusText()}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      
      {error && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default UploadProgress;
