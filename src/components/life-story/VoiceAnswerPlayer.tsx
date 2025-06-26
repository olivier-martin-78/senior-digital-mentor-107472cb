
import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Trash2, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
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

  const handleExportAudio = useCallback(() => {
    if (!audioUrl) {
      toast({
        title: "Erreur d'export",
        description: "Aucun enregistrement audio disponible pour l'export",
        variant: "destructive",
      });
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = audioUrl;
      
      // Générer un nom de fichier avec timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const fileName = `histoire-de-vie-audio-${timestamp}.webm`;
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export réussi",
        description: "L'enregistrement audio a été téléchargé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de l'export audio:", error);
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter l'enregistrement audio",
        variant: "destructive",
      });
    }
  }, [audioUrl]);

  return (
    <div className="space-y-3">
      {!readOnly && (onDelete || audioUrl) && (
        <div className="flex justify-end gap-2">
          {audioUrl && (
            <Button
              onClick={handleExportAudio}
              variant="outline"
              size="sm"
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={onDelete}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          )}
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
