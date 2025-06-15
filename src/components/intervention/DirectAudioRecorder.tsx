
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DirectAudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  onAudioUrlGenerated?: (url: string) => void;
  onRecordingStatusChange?: (isRecording: boolean) => void;
  reportId?: string;
}

const DirectAudioRecorder: React.FC<DirectAudioRecorderProps> = ({
  onAudioRecorded,
  onAudioUrlGenerated,
  onRecordingStatusChange,
  reportId
}) => {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  console.log('🎙️ DirectAudioRecorder - Rendu avec reportId:', reportId);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        console.log('🎙️ DirectAudioRecorder - Enregistrement terminé, taille:', blob.size);
        
        if (blob.size > 0) {
          setAudioBlob(blob);
          
          // Créer une URL temporaire pour la prévisualisation
          const tempUrl = URL.createObjectURL(blob);
          setAudioUrl(tempUrl);
          
          // Upload immédiat vers Supabase
          await uploadAudioToStorage(blob);
          
          onAudioRecorded(blob);
        }
        
        // Arrêter le stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000); // Collecte des données toutes les secondes
      setIsRecording(true);
      onRecordingStatusChange?.(true);
      
      console.log('🎙️ DirectAudioRecorder - Enregistrement commencé');
      
    } catch (error) {
      console.error('Erreur lors du démarrage de l\'enregistrement:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'accéder au microphone",
        variant: "destructive",
      });
    }
  }, [onAudioRecorded, onRecordingStatusChange]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      onRecordingStatusChange?.(false);
      console.log('🎙️ DirectAudioRecorder - Arrêt de l\'enregistrement');
    }
  }, [isRecording, onRecordingStatusChange]);

  const uploadAudioToStorage = async (blob: Blob) => {
    if (!user || !blob) return;

    try {
      setUploading(true);
      console.log('🎙️ DirectAudioRecorder - Upload vers storage, taille:', blob.size);

      // Créer un nom de fichier unique
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${user.id}/${reportId || 'temp'}_${timestamp}.webm`;

      console.log('🎙️ DirectAudioRecorder - Nom de fichier:', fileName);

      // Upload vers le bucket intervention-audios
      const { data, error } = await supabase.storage
        .from('intervention-audios')
        .upload(fileName, blob, {
          contentType: 'audio/webm',
          upsert: false
        });

      if (error) {
        console.error('🎙️ DirectAudioRecorder - Erreur upload:', error);
        throw error;
      }

      console.log('🎙️ DirectAudioRecorder - Upload réussi:', data);

      // Obtenir l'URL publique
      const { data: publicUrlData } = supabase.storage
        .from('intervention-audios')
        .getPublicUrl(fileName);

      const publicUrl = publicUrlData.publicUrl;
      console.log('🎙️ DirectAudioRecorder - URL publique générée:', publicUrl);

      // Nettoyer l'URL temporaire
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      // Mettre à jour avec l'URL publique
      setAudioUrl(publicUrl);
      onAudioUrlGenerated?.(publicUrl);

      toast({
        title: "Succès",
        description: "Enregistrement audio sauvegardé",
      });

    } catch (error) {
      console.error('🎙️ DirectAudioRecorder - Erreur lors de l\'upload:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'enregistrement audio",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const playPause = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((error) => {
          console.error('Erreur de lecture:', error);
          toast({
            title: "Erreur",
            description: "Impossible de lire l'enregistrement",
            variant: "destructive",
          });
        });
    }
  };

  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    onAudioUrlGenerated?.('');
  };

  if (audioUrl && audioBlob) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <Button
              onClick={playPause}
              variant="outline"
              size="sm"
              disabled={uploading}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <span className="text-sm text-gray-600">
              {uploading ? 'Sauvegarde...' : 'Enregistrement prêt'}
            </span>
          </div>
          <Button
            onClick={deleteRecording}
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700"
            disabled={uploading}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
        {isRecording ? (
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse mr-2"></div>
              <span className="text-red-500 font-medium">Enregistrement en cours...</span>
            </div>
            <Button onClick={stopRecording} variant="outline">
              <Square className="w-4 h-4 mr-2" />
              Arrêter
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <Button onClick={startRecording}>
              <Mic className="w-4 h-4 mr-2" />
              Commencer l'enregistrement
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectAudioRecorder;
