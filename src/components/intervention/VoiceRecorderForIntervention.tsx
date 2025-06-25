
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
  const [isUploading, setIsUploading] = useState(false);

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
        
        // Créer une URL temporaire pour la lecture locale immédiate
        const tempUrl = URL.createObjectURL(blob);
        setAudioUrl(tempUrl);
        
        // Uploader immédiatement l'audio vers Supabase si on a un reportId
        if (reportId) {
          await uploadAudioToSupabase(blob, reportId);
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

  const uploadAudioToSupabase = async (blob: Blob, reportId: string) => {
    try {
      setIsUploading(true);
      console.log('🎯 VOICE_RECORDER_UPLOAD - Début upload vers Supabase:', {
        reportId,
        blobSize: blob.size,
        blobType: blob.type
      });

      // Obtenir l'ID utilisateur actuel
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Utilisateur non authentifié');
      }

      // Créer un nom de fichier unique avec l'ID du rapport
      const timestamp = Date.now();
      const fileName = `intervention_${reportId}_${timestamp}.webm`;
      const filePath = `interventions/${user.id}/${fileName}`;

      console.log('🎯 VOICE_RECORDER_UPLOAD - Chemin d\'upload:', filePath);

      // Upload vers Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('intervention-audios')
        .upload(filePath, blob, {
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
        .from('intervention-audios')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('🎯 VOICE_RECORDER_UPLOAD - URL publique générée:', {
        publicUrl,
        publicUrlType: typeof publicUrl,
        publicUrlLength: publicUrl.length
      });

      // CRUCIAL : Mettre à jour le rapport avec l'URL permanente
      const { data: updateData, error: updateError } = await supabase
        .from('intervention_reports')
        .update({ audio_url: publicUrl })
        .eq('id', reportId)
        .select('audio_url');

      if (updateError) {
        console.error('❌ VOICE_RECORDER_UPLOAD - Erreur mise à jour rapport:', updateError);
        throw updateError;
      }

      console.log('✅ VOICE_RECORDER_UPLOAD - Rapport mis à jour avec succès:', updateData);

      // Remplacer l'URL temporaire par l'URL permanente
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(publicUrl);
      
      // Notifier le parent du changement d'URL permanente
      if (onAudioUrlChange) {
        console.log('🎯 VOICE_RECORDER_UPLOAD - Notification parent URL permanente:', publicUrl);
        onAudioUrlChange(publicUrl);
      }

      toast({
        title: 'Succès',
        description: 'Enregistrement sauvegardé avec succès',
      });

    } catch (error) {
      console.error('❌ VOICE_RECORDER_UPLOAD - Erreur générale:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder l\'enregistrement',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
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

  const deleteAudio = async () => {
    console.log('🎯 VOICE_RECORDER_DELETE - Suppression audio');
    
    // Si on a un reportId, supprimer l'audio_url du rapport
    if (reportId) {
      try {
        const { error } = await supabase
          .from('intervention_reports')
          .update({ audio_url: null })
          .eq('id', reportId);

        if (error) {
          console.error('❌ VOICE_RECORDER_DELETE - Erreur suppression DB:', error);
        } else {
          console.log('✅ VOICE_RECORDER_DELETE - Audio supprimé de la DB');
        }
      } catch (error) {
        console.error('❌ VOICE_RECORDER_DELETE - Erreur:', error);
      }
    }
    
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
            disabled={disabled || isUploading}
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
            disabled={isUploading}
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
            disabled={isUploading}
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

      {isUploading && (
        <div className="text-sm text-blue-600 flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
          Sauvegarde en cours...
        </div>
      )}

      {audioUrl && !isUploading && (
        <div className="text-sm text-green-600">
          {audioUrl.startsWith('blob:') ? 
            'Enregistrement temporaire (non sauvegardé)' : 
            'Enregistrement sauvegardé'}
        </div>
      )}

      {!audioUrl && !isRecording && !isUploading && (
        <div className="text-sm text-gray-500">
          Aucun enregistrement
        </div>
      )}
    </div>
  );
};

export default VoiceRecorderForIntervention;
