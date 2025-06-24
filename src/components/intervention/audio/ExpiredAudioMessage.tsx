
import React from 'react';
import { AlertCircle, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExpiredAudioMessageProps {
  onRecordNew: () => void;
  isRecording?: boolean;
}

const ExpiredAudioMessage: React.FC<ExpiredAudioMessageProps> = ({ 
  onRecordNew, 
  isRecording = false 
}) => {
  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-orange-800 mb-1">
            Enregistrement temporaire expiré
          </h4>
          <p className="text-sm text-orange-700 mb-3">
            L'enregistrement précédent était temporaire et n'est plus disponible. 
            Veuillez créer un nouvel enregistrement.
          </p>
          <Button
            onClick={onRecordNew}
            size="sm"
            variant="outline"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
            disabled={isRecording}
          >
            <Mic className="w-4 h-4 mr-2" />
            {isRecording ? 'Enregistrement...' : 'Créer un nouvel enregistrement'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExpiredAudioMessage;
