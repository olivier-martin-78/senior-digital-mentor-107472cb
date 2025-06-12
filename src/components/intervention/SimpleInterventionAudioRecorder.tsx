
import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Play, Pause } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { toast } from '@/hooks/use-toast';

interface SimpleInterventionAudioRecorderProps {
  onAudioChange: (audioBlob: Blob | null, audioUrl: string | null) => void;
  existingAudioUrl?: string | null;
  disabled?: boolean;
}

const SimpleInterventionAudioRecorder: React.FC<SimpleInterventionAudioRecorderProps> = ({
  onAudioChange,
  existingAudioUrl,
  disabled = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // États locaux pour éviter les re-renders du parent
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(existingAudioUrl || null);
  const [hasNotifiedParent, setHasNotifiedParent] = useState(false);

  console.log("🎯 SIMPLE_AUDIO - Render:", {
    hasExistingUrl: !!existingAudioUrl,
    hasLocalUrl: !!localAudioUrl,
    disabled,
    hasNotifiedParent
  });

  const {
    isRecording,
    audioBlob,
    audioUrl,
    recordingTime,
    startRecording,
    stopRecording,
    clearRecording
  } = useVoiceRecorder({
    onRecordingComplete: useCallback((blob: Blob, url: string) => {
      console.log("🎯 SIMPLE_AUDIO - Recording complete:", { blobSize: blob.size, url });
      
      if (blob.size > 0) {
        setLocalAudioUrl(url);
        
        // Notifier le parent une seule fois
        if (!hasNotifiedParent) {
          console.log("🎯 SIMPLE_AUDIO - Notifying parent with blob:", blob.size);
          onAudioChange(blob, url);
          setHasNotifiedParent(true);
        }
      } else {
        console.log("🎯 SIMPLE_AUDIO - Empty blob received");
        toast({
          title: "Erreur d'enregistrement",
          description: "L'enregistrement est vide. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    }, [onAudioChange, hasNotifiedParent])
  });

  // Reset du flag quand on démarre un nouvel enregistrement
  const handleStartRecording = useCallback(() => {
    console.log("🎯 SIMPLE_AUDIO - Starting new recording");
    setHasNotifiedParent(false);
    setLocalAudioUrl(null);
    startRecording();
  }, [startRecording]);

  const handleClearRecording = useCallback(() => {
    console.log("🎯 SIMPLE_AUDIO - Clearing recording");
    clearRecording();
    setLocalAudioUrl(null);
    setHasNotifiedParent(false);
    setIsPlaying(false);
    
    // Notifier le parent de la suppression
    onAudioChange(null, null);
  }, [clearRecording, onAudioChange]);

  const handlePlayPause = useCallback(() => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Utiliser l'URL locale ou l'URL existante
  const currentAudioUrl = localAudioUrl || existingAudioUrl;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border rounded-lg p-4 bg-white space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Enregistrement vocal</h3>
        
        {isRecording && (
          <div className="flex items-center text-red-500">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse mr-2"></div>
            <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
          </div>
        )}
      </div>

      {/* Contrôles d'enregistrement */}
      <div className="flex items-center gap-2">
        {!isRecording && !currentAudioUrl && (
          <Button
            onClick={handleStartRecording}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            Enregistrer
          </Button>
        )}

        {isRecording && (
          <Button
            onClick={stopRecording}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Arrêter
          </Button>
        )}

        {currentAudioUrl && !isRecording && (
          <>
            <Button
              onClick={handlePlayPause}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause' : 'Écouter'}
            </Button>
            
            <Button
              onClick={handleClearRecording}
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>

      {/* Lecteur audio caché */}
      {currentAudioUrl && (
        <audio
          ref={audioRef}
          src={currentAudioUrl}
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          className="hidden"
        />
      )}
    </div>
  );
};

export default SimpleInterventionAudioRecorder;
