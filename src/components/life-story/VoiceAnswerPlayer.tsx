
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Trash2 } from 'lucide-react';
import AudioPlayerCore from './audio/AudioPlayerCore';

interface VoiceAnswerPlayerProps {
  audioUrl: string;
  onDelete?: () => void;
  readOnly?: boolean;
  shouldLog?: boolean;
}

const VoiceAnswerPlayer: React.FC<VoiceAnswerPlayerProps> = ({
  audioUrl,
  onDelete,
  readOnly = false,
  shouldLog = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = useCallback(() => {
    if (shouldLog) {
      console.log("🎵 VOICE_ANSWER_PLAYER - Audio started playing");
    }
    setIsPlaying(true);
  }, [shouldLog]);

  const handlePause = useCallback(() => {
    if (shouldLog) {
      console.log("🎵 VOICE_ANSWER_PLAYER - Audio paused");
    }
    setIsPlaying(false);
  }, [shouldLog]);

  const handleEnded = useCallback(() => {
    if (shouldLog) {
      console.log("🎵 VOICE_ANSWER_PLAYER - Audio ended");
    }
    setIsPlaying(false);
  }, [shouldLog]);

  const handleError = useCallback((error: any) => {
    if (shouldLog) {
      console.error("🎵 VOICE_ANSWER_PLAYER - Audio error:", error);
    }
    setIsPlaying(false);
  }, [shouldLog]);

  return (
    <div className="space-y-3">
      {!readOnly && onDelete && (
        <div className="flex justify-end">
          <Button
            onClick={onDelete}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Supprimer
          </Button>
        </div>
      )}
      
      <AudioPlayerCore
        audioUrl={audioUrl}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        className="bg-white border rounded-lg"
      />
    </div>
  );
};

export default VoiceAnswerPlayer;
