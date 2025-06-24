
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square } from 'lucide-react';

interface RecordingControlsProps {
  isRecording: boolean;
  recordingTime: number;
  disabled?: boolean;
  onStartRecording: (e: React.MouseEvent) => void;
  onStopRecording: (e: React.MouseEvent) => void;
}

const RecordingControls: React.FC<RecordingControlsProps> = ({
  isRecording,
  recordingTime,
  disabled = false,
  onStartRecording,
  onStopRecording
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {isRecording && (
        <div className="flex items-center text-red-500">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
          <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {!isRecording ? (
          <Button
            type="button"
            onClick={onStartRecording}
            disabled={disabled}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvel enregistrement</span>
            <span className="sm:hidden">Enregistrer</span>
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onStopRecording}
            variant="destructive"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Square className="w-4 h-4" />
            <span className="hidden sm:inline">Arrêter l'enregistrement</span>
            <span className="sm:hidden">Arrêter</span>
          </Button>
        )}
      </div>
    </>
  );
};

export default RecordingControls;
