
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Trash2 } from 'lucide-react';

interface PlaybackControlsProps {
  isPlaying: boolean;
  disabled?: boolean;
  onPlayPause: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  disabled = false,
  onPlayPause,
  onDelete
}) => {
  console.log("🎵 PLAYBACK_CONTROLS - Rendering, isPlaying:", isPlaying);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("🎵 PLAYBACK_CONTROLS - Play/Pause clicked, current state:", isPlaying);
    
    // Trouver l'élément audio dans le DOM et le contrôler directement
    const audioElements = document.querySelectorAll('audio');
    const audioElement = Array.from(audioElements).find(audio => audio.src && !audio.src.startsWith('blob:'));
    
    if (audioElement) {
      console.log("🎵 PLAYBACK_CONTROLS - Found audio element:", audioElement.src);
      
      if (isPlaying) {
        console.log("🎵 PLAYBACK_CONTROLS - Pausing audio");
        audioElement.pause();
      } else {
        console.log("🎵 PLAYBACK_CONTROLS - Playing audio");
        audioElement.play().catch(error => {
          console.error("🎵 PLAYBACK_CONTROLS - Play error:", error);
        });
      }
    } else {
      console.error("🎵 PLAYBACK_CONTROLS - No audio element found");
    }
    
    onPlayPause(e);
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        onClick={handlePlayPause}
        variant="outline"
        className="flex items-center gap-2"
        disabled={disabled}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Écouter'}</span>
      </Button>
      
      <Button
        type="button"
        onClick={onDelete}
        variant="ghost"
        size="sm"
        className="text-red-500 hover:text-red-700"
        disabled={disabled}
      >
        <Trash2 className="w-4 h-4" />
        <span className="hidden sm:inline ml-1">Supprimer</span>
      </Button>
    </div>
  );
};

export default PlaybackControls;
