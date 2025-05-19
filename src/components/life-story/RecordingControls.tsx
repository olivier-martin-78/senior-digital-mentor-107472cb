
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';
import { formatTime } from './utils/audioUtils';

interface RecordingControlsProps {
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

export const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording
}) => {
  if (isRecording) {
    return (
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-2"></div>
          <span className="text-red-500 font-medium">
            Enregistrement en cours ({formatTime(recordingTime)})
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onStopRecording}
          className="ml-2"
        >
          <Square className="w-4 h-4 mr-1" /> Arrêter
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-between mb-2">
      <span className="text-gray-500">
        Prêt à enregistrer
      </span>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onStartRecording}
      >
        <Mic className="w-4 h-4 mr-1" /> Enregistrer
      </Button>
    </div>
  );
};

export default RecordingControls;
