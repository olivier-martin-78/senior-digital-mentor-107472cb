
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Trash, Download } from 'lucide-react';
import { handleExportAudio } from './utils/audioUtils';

interface VoiceAnswerPlayerProps {
  audioUrl: string;
  onDelete: () => void;
}

export const VoiceAnswerPlayer: React.FC<VoiceAnswerPlayerProps> = ({
  audioUrl,
  onDelete
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const handleAudioPlay = () => {
    setIsPlaying(true);
  };
  
  const handleAudioPause = () => {
    setIsPlaying(false);
  };
  
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };
  
  const handleDelete = () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    onDelete();
  };
  
  const handleExport = () => {
    handleExportAudio(audioUrl);
  };
  
  return (
    <div>
      <div className="mb-2">
        <audio 
          ref={audioRef}
          src={audioUrl} 
          controls 
          className="w-full"
          onPlay={handleAudioPlay}
          onPause={handleAudioPause}
          onEnded={handleAudioEnded}
        />
      </div>
      
      <div className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleExport}
          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
          disabled={isPlaying}
        >
          <Download className="w-4 h-4 mr-1" /> Exporter l'audio
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDelete}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          disabled={isPlaying}
        >
          <Trash className="w-4 h-4 mr-1" /> Supprimer
        </Button>
      </div>
    </div>
  );
};

export default VoiceAnswerPlayer;
