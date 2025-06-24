
import React from 'react';
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
  shouldLog = false,
}) => {
  return (
    <div className="border rounded-md p-4 bg-gray-50">
      <div className="text-sm font-medium mb-3">Enregistrement vocal</div>
      
      <AudioPlayerCore
        audioUrl={audioUrl}
        onDelete={onDelete}
        readOnly={readOnly}
        shouldLog={shouldLog}
      />
    </div>
  );
};

export default VoiceAnswerPlayer;
