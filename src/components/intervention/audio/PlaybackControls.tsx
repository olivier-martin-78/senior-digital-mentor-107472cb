
import React from 'react';
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
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        onClick={onPlayPause}
        variant="outline"
        className="flex items-center gap-2"
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
