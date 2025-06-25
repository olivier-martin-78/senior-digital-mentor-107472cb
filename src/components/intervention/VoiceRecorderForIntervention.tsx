
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface VoiceRecorderForInterventionProps {
  onAudioChange: (blob: Blob | null) => void;
  onAudioUrlChange?: (url: string | null) => void;
  reportId?: string | null;
  existingAudioUrl?: string | null;
  disabled?: boolean;
}

const VoiceRecorderForIntervention: React.FC<VoiceRecorderForInterventionProps> = ({
  onAudioChange,
  onAudioUrlChange,
  reportId,
  existingAudioUrl,
  disabled = false
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  console.log('🎯 VOICE_RECORDER_INIT - Initialisation:', {
    reportId,
    existingAudioUrl,
    existingAudioUrlType: typeof existingAudioUrl,
    existingAudioUrlLength: existingAudioUrl?.length || 0,
    hasOnAudioUrlChange: !!onAudioUrlChange
  });

  useEffect(() => {
    if (existingAudioUrl) {
      console.log('🎯 VOICE_RECORDER_EXISTING - Audio existant détecté:', {
        url: existingAudioUrl,
        urlType: typeof existingAudioUrl,
        urlLength: existingAudioUrl.length
      });
      setAudioUrl(existingAudioUrl);
    }
  }, [existingAudioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        console.log('🎯 VOICE_RECORDER_STOP - Enregistrement terminé:', {
          blobSize: blob.size,
          blobType: blob.type
        });
        
        setAudioBlob(blob);
        onAudioChange(blob);
        
        // Créer une URL temporaire pour la lecture
        const tempUrl = URL.createObjectURL(blob);
        setAudioUrl(tempUrl);
        
        // Uploader immédiatement l'audio
        if (reportId) {
          await uploadAudio(blob, reportId);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      console.error('❌ VOICE_RECORDER_START - Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'accéder au microphone',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      console.log('🎯 VOICE_RECORDER_STOPPING - Arrêt de l\'enregistrement');
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const uploadAudio = async (blob: Blob, reportId: string) => {
    try {
      console.log('🎯 VOICE_RECORDER_UPLOAD - Début upload:', {
        reportId,
        blobSize: blob.size,
        blobType: blob.type
      });

      const fileName = `intervention-audio-${reportId}-${Date.now()}.webm`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('intervention-audio')
        .upload(fileName, blob, {
          contentType: 'audio/webm',
          upsert: true
        });

      if (uploadError) {
        console.error('❌ VOICE_RECORDER_UPLOAD - Erreur upload:', uploadError);
        throw uploadError;
      }

      console.log('✅ VOICE_RECORDER_UPLOAD - Upload réussi:', uploadData);

      // Obtenir l'URL publique
      const { data: urlData } = supabase.storage
        .from('intervention-audio')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log('🎯 VOICE_RECORDER_UPLOAD - URL publique générée:', {
        publicUrl,
        publicUrlType: typeof publicUrl,
        publicUrlLength: publicUrl.length
      });

      // Remplacer l'URL temporaire par l'URL permanente
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(publicUrl);
      
      // Notifier le parent du changement d'URL
      if (onAudioUrlChange) {
        console.log('🎯 VOICE_RECORDER_UPLOAD - Notification parent URL:', publicUrl);
        onAudioUrlChange(publicUrl);
      }

      toast({
        title: 'Succès',
        description: 'Enregistrement sauvegardé',
      });

    } catch (error) {
      console.error('❌ VOICE_RECORDER_UPLOAD - Erreur générale:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder l\'enregistrement',
        variant: 'destructive',
      });
    }
  };

  const playAudio = () => {
    if (audioUrl) {
      console.log('🎯 VOICE_RECORDER_PLAY - Lecture audio:', {
        audioUrl,
        audioUrlType: typeof audioUrl,
        audioUrlLength: audioUrl.length
      });
      
      const audio = new Audio(audioUrl);
      audio.play();
      setIsPlaying(true);
      setAudioElement(audio);

      audio.onended = () => {
        setIsPlaying(false);
        setAudioElement(null);
      };

      audio.onerror = (error) => {
        console.error('❌ VOICE_RECORDER_PLAY - Erreur lecture:', error);
        setIsPlaying(false);
        setAudioElement(null);
        toast({
          title: 'Erreur',
          description: 'Impossible de lire l\'enregistrement',
          variant: 'destructive',
        });
      };
    }
  };

  const pauseAudio = () => {
    if (audioElement) {
      audioElement.pause();
      setIsPlaying(false);
    }
  };

  const deleteAudio = () => {
    console.log('🎯 VOICE_RECORDER_DELETE - Suppression audio');
    
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
    }
    
    setAudioUrl(null);
    setAudioBlob(null);
    setIsPlaying(false);
    onAudioChange(null);
    
    if (onAudioUrlChange) {
      onAudioUrlChange(null);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center gap-2">
        {!isRecording && !audioUrl && (
          <Button
            type="button"
            onClick={startRecording}
            disabled={disabled}
            className="flex items-center gap-2"
          >
            <Mic className="h-4 w-4" />
            Enregistrer
          </Button>
        )}

        {isRecording && (
          <Button
            type="button"
            onClick={stopRecording}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            Arrêter
          </Button>
        )}

        {audioUrl && !isPlaying && (
          <Button
            type="button"
            onClick={playAudio}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Écouter
          </Button>
        )}

        {audioUrl && isPlaying && (
          <Button
            type="button"
            onClick={pauseAudio}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Pause className="h-4 w-4" />
            Pause
          </Button>
        )}

        {audioUrl && (
          <Button
            type="button"
            onClick={deleteAudio}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        )}
      </div>

      {isRecording && (
        <div className="text-sm text-red-600 flex items-center gap-2">
          <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
          Enregistrement en cours...
        </div>
      )}

      {audioUrl && (
        <div className="text-sm text-green-600">
          Enregistrement disponible
        </div>
      )}

      {!audioUrl && !isRecording && (
        <div className="text-sm text-gray-500">
          Aucun enregistrement
        </div>
      )}
    </div>
  );
};

export default VoiceRecorderForIntervention;
