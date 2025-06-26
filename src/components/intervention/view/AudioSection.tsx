
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Edit, AlertCircle } from 'lucide-react';
import VoiceAnswerPlayer from '@/components/life-story/VoiceAnswerPlayer';

interface AudioSectionProps {
  audioStatus: 'loading' | 'valid' | 'expired' | 'none';
  audioUrl?: string;
  onExportAudio: () => void;
  onEdit: () => void;
}

export const AudioSection: React.FC<AudioSectionProps> = ({
  audioStatus,
  audioUrl,
  onExportAudio,
  onEdit
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Enregistrement audio</h3>
        {audioStatus === 'valid' && audioUrl && (
          <Button
            onClick={onExportAudio}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter
          </Button>
        )}
      </div>
      <div className="bg-gray-50 p-3 rounded-md">
        {audioStatus === 'loading' && (
          <div className="flex items-center justify-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm">Vérification de l'enregistrement audio...</span>
          </div>
        )}
        
        {audioStatus === 'valid' && audioUrl && (
          <div>
            <p className="text-sm text-green-600 mb-2">✅ Enregistrement audio disponible</p>
            <VoiceAnswerPlayer
              audioUrl={audioUrl}
              readOnly={true}
              shouldLog={true}
            />
          </div>
        )}
        
        {audioStatus === 'expired' && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-orange-800 mb-1">
                  Enregistrement audio expiré
                </h4>
                <p className="text-sm text-orange-700">
                  L'enregistrement audio de ce rapport était temporaire et n'est plus disponible. 
                  Vous pouvez modifier le rapport pour créer un nouvel enregistrement.
                </p>
                <Button
                  onClick={onEdit}
                  size="sm"
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100 mt-2"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier le rapport
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {audioStatus === 'none' && (
          <p className="text-gray-500 text-sm">Aucun enregistrement audio</p>
        )}
      </div>
    </div>
  );
};
