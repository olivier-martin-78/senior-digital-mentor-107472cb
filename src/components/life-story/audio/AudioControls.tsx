
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Download, Trash2 } from 'lucide-react';

interface AudioControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  readOnly: boolean;
  isBlobUrl: boolean;
  onPlayPause: () => void;
  onExport: () => void;
  onDelete?: () => void;
}

const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  isLoading,
  currentTime,
  duration,
  readOnly,
  isBlobUrl,
  onPlayPause,
  onExport,
  onDelete,
}) => {
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      {/* Contrôles de lecture */}
      <div className="flex items-center space-x-3 mb-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onPlayPause}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
        </Button>
        
        <div className="text-sm text-gray-600">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>
      
      {/* Boutons d'action */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          disabled={isBlobUrl}
        >
          <Download className="w-4 h-4 mr-1" />
          Exporter
        </Button>
        
        {!readOnly && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Supprimer
          </Button>
        )}
      </div>
    </>
  );
};

export default AudioControls;
