
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { toast } from '@/hooks/use-toast';

interface SimpleAudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  onAudioUrlGenerated?: (url: string) => void;
}

const SimpleAudioRecorder: React.FC<SimpleAudioRecorderProps> = ({
  onAudioRecorded,
  onAudioUrlGenerated
}) => {
  const {
    isRecording,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    clearRecording,
    recordingTime
  } = useAudioRecorder();

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handleStartRecording = async () => {
    try {
      await startRecording();
      console.log('🎙️ INTERVENTION - Enregistrement démarré');
    } catch (error) {
      console.error('❌ INTERVENTION - Erreur démarrage enregistrement:', error);
      toast({
        title: "Erreur d'enregistrement",
        description: "Impossible de démarrer l'enregistrement. Vérifiez les permissions du microphone.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    try {
      await stopRecording();
      console.log('🎙️ INTERVENTION - Enregistrement arrêté');
      
      // Attendre un peu que le blob soit disponible
      setTimeout(() => {
        if (audioBlob && audioBlob.size > 0) {
          console.log('✅ INTERVENTION - Audio capturé, taille:', audioBlob.size);
          onAudioRecorded(audioBlob);
          
          if (audioUrl && onAudioUrlGenerated) {
            onAudioUrlGenerated(audioUrl);
          }
          
          toast({
            title: "Enregistrement réussi",
            description: "Votre message vocal a été enregistré avec succès",
          });
        } else {
          console.warn('⚠️ INTERVENTION - Pas de données audio capturées');
          toast({
            title: "Erreur d'enregistrement",
            description: "Aucune donnée audio n'a été capturée. Veuillez réessayer.",
            variant: "destructive",
          });
        }
      }, 100);
    } catch (error) {
      console.error('❌ INTERVENTION - Erreur arrêt enregistrement:', error);
      toast({
        title: "Erreur d'enregistrement",
        description: "Erreur lors de l'arrêt de l'enregistrement",
        variant: "destructive",
      });
    }
  };

  const handlePlay = () => {
    if (!audioUrl) return;

    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(audioUrl);
    audio.onplay = () => setIsPlaying(true);
    audio.onpause = () => setIsPlaying(false);
    audio.onended = () => {
      setIsPlaying(false);
      setAudioElement(null);
    };
    
    audio.play().catch(error => {
      console.error('Erreur lecture audio:', error);
      toast({
        title: "Erreur de lecture",
        description: "Impossible de lire l'enregistrement",
        variant: "destructive",
      });
    });
    
    setAudioElement(audio);
  };

  const handleDelete = () => {
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
      setIsPlaying(false);
    }
    clearRecording();
    console.log('🗑️ INTERVENTION - Audio supprimé');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border rounded-md p-4 bg-white shadow-sm">
      <div className="text-sm font-medium mb-3 text-gray-700">Enregistrement vocal</div>
      
      {!audioBlob ? (
        <div className="space-y-3">
          {isRecording && (
            <div className="flex items-center justify-center py-2 bg-red-50 rounded-md">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-2"></div>
              <span className="text-red-600 font-medium">
                Enregistrement... {formatTime(recordingTime)}
              </span>
            </div>
          )}
          
          <div className="flex justify-center">
            {!isRecording ? (
              <Button onClick={handleStartRecording} className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Commencer l'enregistrement
              </Button>
            ) : (
              <Button onClick={handleStopRecording} variant="destructive" className="flex items-center gap-2">
                <Square className="w-4 h-4" />
                Arrêter l'enregistrement
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-center py-2 bg-green-50 rounded-md">
            <span className="text-green-600 font-medium">
              ✓ Enregistrement prêt ({Math.round(audioBlob.size / 1024)} KB)
            </span>
          </div>
          
          <div className="flex justify-center gap-2">
            <Button onClick={handlePlay} variant="outline" className="flex items-center gap-2">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause' : 'Écouter'}
            </Button>
            
            <Button onClick={handleDelete} variant="outline" className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-4 h-4" />
              Supprimer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleAudioRecorder;
