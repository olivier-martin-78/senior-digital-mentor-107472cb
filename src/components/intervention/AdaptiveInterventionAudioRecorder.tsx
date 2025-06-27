
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAdaptiveVoiceRecorder } from '@/hooks/use-adaptive-voice-recorder';

interface AdaptiveInterventionAudioRecorderProps {
  onAudioChange: (blob: Blob | null) => void;
  onAudioUrlChange?: (url: string | null) => void;
  reportId?: string | null;
  existingAudioUrl?: string | null;
  disabled?: boolean;
}

const AdaptiveInterventionAudioRecorder: React.FC<AdaptiveInterventionAudioRecorderProps> = ({
  onAudioChange,
  onAudioUrlChange,
  reportId,
  existingAudioUrl,
  disabled = false
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [permanentAudioUrl, setPermanentAudioUrl] = useState<string | null>(existingAudioUrl || null);

  const {
    isRecording,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    clearRecording,
    recordingTime,
    recordingFormat
  } = useAdaptiveVoiceRecorder();

  console.log('🎯 ADAPTIVE_INTERVENTION_RECORDER - Initialisation:', {
    reportId,
    existingAudioUrl,
    recordingFormat,
    hasAudioBlob: !!audioBlob,
    permanentAudioUrl
  });

  useEffect(() => {
    if (existingAudioUrl) {
      console.log('🎯 ADAPTIVE_INTERVENTION_RECORDER - Audio existant détecté:', {
        url: existingAudioUrl,
        urlType: typeof existingAudioUrl,
        urlLength: existingAudioUrl.length
      });
      setPermanentAudioUrl(existingAudioUrl);
    }
  }, [existingAudioUrl]);

  // Gérer l'upload automatique après enregistrement
  useEffect(() => {
    if (audioBlob && !isRecording && reportId) {
      uploadAudioToSupabase(audioBlob, reportId);
    }
  }, [audioBlob, isRecording, reportId]);

  const uploadAudioToSupabase = async (blob: Blob, reportId: string) => {
    try {
      setIsUploading(true);
      console.log('🎯 ADAPTIVE_INTERVENTION_RECORDER - Début upload vers Supabase:', {
        reportId,
        blobSize: blob.size,
        blobType: blob.type,
        recordingFormat
      });

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Détecter l'extension en fonction du type MIME
      let fileExtension = recordingFormat || 'webm';
      if (blob.type.includes('mp4')) {
        fileExtension = 'mp4';
      } else if (blob.type.includes('mpeg') || blob.type.includes('mp3')) {
        fileExtension = 'mp3';
      } else if (blob.type.includes('webm')) {
        fileExtension = 'webm';
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `intervention_${reportId}_${timestamp}.${fileExtension}`;
      const filePath = `interventions/${user.id}/${fileName}`;

      console.log('🎯 ADAPTIVE_INTERVENTION_RECORDER - Chemin d\'upload:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('intervention-audios')
        .upload(filePath, blob, {
          contentType: blob.type,
          upsert: true
        });

      if (uploadError) {
        console.error('❌ ADAPTIVE_INTERVENTION_RECORDER - Erreur upload:', uploadError);
        throw uploadError;
      }

      console.log('✅ ADAPTIVE_INTERVENTION_RECORDER - Upload réussi:', uploadData);

      const { data: urlData } = supabase.storage
        .from('intervention-audios')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('🎯 ADAPTIVE_INTERVENTION_RECORDER - URL publique générée:', {
        publicUrl,
        publicUrlType: typeof publicUrl,
        publicUrlLength: publicUrl.length
      });

      // Mettre à jour le rapport avec l'URL permanente
      const { data: updateData, error: updateError } = await supabase
        .from('intervention_reports')
        .update({ audio_url: publicUrl })
        .eq('id', reportId)
        .select('audio_url');

      if (updateError) {
        console.error('❌ ADAPTIVE_INTERVENTION_RECORDER - Erreur mise à jour rapport:', updateError);
        throw updateError;
      }

      console.log('✅ ADAPTIVE_INTERVENTION_RECORDER - Rapport mis à jour avec succès:', updateData);

      // Remplacer l'URL temporaire par l'URL permanente
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
      
      setPermanentAudioUrl(publicUrl);
      
      if (onAudioUrlChange) {
        console.log('🎯 ADAPTIVE_INTERVENTION_RECORDER - Notification parent URL permanente:', publicUrl);
        onAudioUrlChange(publicUrl);
      }

      toast({
        title: 'Succès',
        description: `Enregistrement ${recordingFormat.toUpperCase()} sauvegardé avec succès`,
      });

    } catch (error) {
      console.error('❌ ADAPTIVE_INTERVENTION_RECORDER - Erreur générale:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder l\'enregistrement',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const playAudio = () => {
    const urlToPlay = permanentAudioUrl || audioUrl;
    if (urlToPlay) {
      console.log('🎯 ADAPTIVE_INTERVENTION_RECORDER - Lecture audio:', {
        audioUrl: urlToPlay,
        audioUrlType: typeof urlToPlay,
        audioUrlLength: urlToPlay.length
      });
      
      const audio = new Audio(urlToPlay);
      audio.play();
      setIsPlaying(true);
      setAudioElement(audio);

      audio.onended = () => {
        setIsPlaying(false);
        setAudioElement(null);
      };

      audio.onerror = (error) => {
        console.error('❌ ADAPTIVE_INTERVENTION_RECORDER - Erreur lecture:', error);
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

  const deleteAudio = async () => {
    console.log('🎯 ADAPTIVE_INTERVENTION_RECORDER - Suppression audio');
    
    if (reportId) {
      try {
        const { error } = await supabase
          .from('intervention_reports')
          .update({ audio_url: null })
          .eq('id', reportId);

        if (error) {
          console.error('❌ ADAPTIVE_INTERVENTION_RECORDER - Erreur suppression DB:', error);
        } else {
          console.log('✅ ADAPTIVE_INTERVENTION_RECORDER - Audio supprimé de la DB');
        }
      } catch (error) {
        console.error('❌ ADAPTIVE_INTERVENTION_RECORDER - Erreur:', error);
      }
    }
    
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    
    if (audioElement) {
      audioElement.pause();
      setAudioElement(null);
    }
    
    clearRecording();
    setPermanentAudioUrl(null);
    setIsPlaying(false);
    onAudioChange(null);
    
    if (onAudioUrlChange) {
      onAudioUrlChange(null);
    }
  };

  const currentAudioUrl = permanentAudioUrl || audioUrl;
  const showRecordingControls = !currentAudioUrl && !isRecording;
  const showStopButton = isRecording;
  const showPlaybackControls = currentAudioUrl && !isRecording;

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">
          Enregistrement vocal
          {recordingFormat && (
            <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              Format: {recordingFormat.toUpperCase()}
            </span>
          )}
        </div>
        
        {isRecording && (
          <div className="text-sm text-red-600 flex items-center gap-2">
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            {formatTime(recordingTime)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {showRecordingControls && (
          <Button
            type="button"
            onClick={startRecording}
            disabled={disabled || isUploading}
            className="flex items-center gap-2"
          >
            <Mic className="h-4 w-4" />
            Enregistrer
          </Button>
        )}

        {showStopButton && (
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

        {showPlaybackControls && !isPlaying && (
          <Button
            type="button"
            onClick={playAudio}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isUploading}
          >
            <Play className="h-4 w-4" />
            Écouter
          </Button>
        )}

        {showPlaybackControls && isPlaying && (
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

        {showPlaybackControls && (
          <Button
            type="button"
            onClick={deleteAudio}
            variant="destructive"
            size="sm"
            className="flex items-center gap-2"
            disabled={isUploading}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
        )}
      </div>

      {isUploading && (
        <div className="text-sm text-blue-600 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
          Sauvegarde en cours...
        </div>
      )}

      {currentAudioUrl && !isUploading && (
        <div className="text-sm text-green-600">
          {currentAudioUrl.startsWith('blob:') ? 
            `Enregistrement temporaire (${recordingFormat.toUpperCase()})` : 
            `Enregistrement sauvegardé (${recordingFormat.toUpperCase()})`}
        </div>
      )}

      {!currentAudioUrl && !isRecording && !isUploading && (
        <div className="text-sm text-gray-500">
          Aucun enregistrement
        </div>
      )}
    </div>
  );
};

export default AdaptiveInterventionAudioRecorder;
