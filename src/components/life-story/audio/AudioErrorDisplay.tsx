
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface AudioErrorDisplayProps {
  showBlobWarning: boolean;
  hasError: boolean;
  fullAudioUrl: string;
  readOnly: boolean;
  shouldLog: boolean;
  onDelete?: () => void;
}

const AudioErrorDisplay: React.FC<AudioErrorDisplayProps> = ({
  showBlobWarning,
  hasError,
  fullAudioUrl,
  readOnly,
  shouldLog,
  onDelete,
}) => {
  if (showBlobWarning) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 text-sm mb-2">Enregistrement temporaire expiré</p>
        <p className="text-xs text-gray-500">L'enregistrement était temporaire et n'est plus disponible. Veuillez créer un nouvel enregistrement.</p>
        {!readOnly && onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="mt-2 text-red-500 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Supprimer
          </Button>
        )}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 text-sm">Impossible de charger l'enregistrement</p>
        {shouldLog && (
          <p className="text-xs text-gray-500 mt-1">URL: {fullAudioUrl}</p>
        )}
      </div>
    );
  }

  return null;
};

export default AudioErrorDisplay;
