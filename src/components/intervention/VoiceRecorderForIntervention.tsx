
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Play, Pause } from 'lucide-react';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface VoiceRecorderForInterventionProps {
  onAudioChange: (audioBlob: Blob | null) => void;
  reportId?: string;
  existingAudioUrl?: string | null;
  disabled?: boolean;
}

const VoiceRecorderForIntervention: React.FC<VoiceRecorderForInterventionProps> = ({
  onAudioChange,
  reportId,
  existingAudioUrl,
  disabled = false
}) => {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);

  console.log("🎯 VOICE_RECORDER - Render:", {
    hasExistingUrl: !!existingAudioUrl,
    existingAudioUrl,
    hasLocalUrl: !!localAudioUrl,
    localAudioUrl,
    disabled,
    reportId
  });

  // CORRECTION: Initialiser l'URL locale avec l'URL existante dès le montage
  useEffect(() => {
    if (existingAudioUrl && existingAudioUrl.trim() !== '') {
      console.log("🎯 VOICE_RECORDER - Initializing with existing audio URL:", existingAudioUrl);
      setLocalAudioUrl(existingAudioUrl.trim());
    }
  }, [existingAudioUrl]);

  const {
    isRecording,
    audioBlob,
    audioUrl,
    recordingTime,
    startRecording,
    stopRecording,
    clearRecording
  } = useVoiceRecorder({
    onRecordingComplete: useCallback(async (blob: Blob, url: string) => {
      console.log("🎯 VOICE_RECORDER - Recording complete:", { blobSize: blob.size, url, reportId });
      
      if (blob.size > 0) {
        setLocalAudioUrl(url);
        
        // Si on a un reportId, uploader immédiatement
        if (reportId && user) {
          setIsUploading(true);
          try {
            const fileName = `intervention_${reportId}_${Date.now()}.webm`;
            const filePath = `interventions/${user.id}/${fileName}`;
            
            console.log("🎯 VOICE_RECORDER - Uploading to:", filePath);
            
            const { data, error } = await supabase.storage
              .from('intervention-audios')
              .upload(filePath, blob, {
                contentType: 'audio/webm',
                upsert: false
              });

            if (error) {
              console.error("🎯 VOICE_RECORDER - Upload error:", error);
              throw error;
            }

            console.log("🎯 VOICE_RECORDER - Upload successful:", data);

            const { data: urlData } = supabase.storage
              .from('intervention-audios')
              .getPublicUrl(filePath);

            const publicUrl = urlData.publicUrl;
            console.log("🎯 VOICE_RECORDER - Public URL:", publicUrl);

            // Mettre à jour le rapport avec l'URL audio
            const { error: updateError } = await supabase
              .from('intervention_reports')
              .update({ audio_url: publicUrl })
              .eq('id', reportId);

            if (updateError) {
              console.error("🎯 VOICE_RECORDER - Update error:", updateError);
              throw updateError;
            }

            console.log("🎯 VOICE_RECORDER - Report updated with audio URL");
            setLocalAudioUrl(publicUrl);
            onAudioChange(blob);

            toast({
              title: "Succès",
              description: "Enregistrement sauvegardé",
            });

          } catch (error) {
            console.error("🎯 VOICE_RECORDER - Error during upload:", error);
            toast({
              title: "Erreur",
              description: "Impossible de sauvegarder l'enregistrement",
              variant: "destructive",
            });
          } finally {
            setIsUploading(false);
          }
        } else {
          // Pas de reportId, juste notifier le parent
          console.log("🎯 VOICE_RECORDER - No reportId, notifying parent");
          onAudioChange(blob);
        }
      } else {
        console.log("🎯 VOICE_RECORDER - Empty blob received");
        toast({
          title: "Erreur d'enregistrement",
          description: "L'enregistrement est vide. Veuillez réessayer.",
          variant: "destructive",
        });
      }
    }, [onAudioChange, reportId, user])
  });

  const handleStartRecording = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🎯 VOICE_RECORDER - Starting new recording");
    setLocalAudioUrl(null);
    startRecording();
  }, [startRecording]);

  const handleStopRecording = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🎯 VOICE_RECORDER - Stopping recording");
    stopRecording();
  }, [stopRecording]);

  const handleClearRecording = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🎯 VOICE_RECORDER - Clearing recording");
    
    // Si on a un reportId et une URL audio, supprimer de Supabase
    if (reportId && localAudioUrl && user) {
      try {
        // Mettre à jour le rapport pour enlever l'URL audio
        const { error: updateError } = await supabase
          .from('intervention_reports')
          .update({ audio_url: null })
          .eq('id', reportId);

        if (updateError) {
          console.error("🎯 VOICE_RECORDER - Error clearing audio URL:", updateError);
        } else {
          console.log("🎯 VOICE_RECORDER - Audio URL cleared from report");
        }

        // Optionnel: supprimer le fichier du storage
        if (localAudioUrl.includes('intervention-audios')) {
          const urlParts = localAudioUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const filePath = `interventions/${user.id}/${fileName}`;
          
          const { error: deleteError } = await supabase.storage
            .from('intervention-audios')
            .remove([filePath]);

          if (deleteError) {
            console.error("🎯 VOICE_RECORDER - Error deleting file:", deleteError);
          } else {
            console.log("🎯 VOICE_RECORDER - File deleted from storage");
          }
        }
      } catch (error) {
        console.error("🎯 VOICE_RECORDER - Error during cleanup:", error);
      }
    }
    
    clearRecording();
    setLocalAudioUrl(null);
    setIsPlaying(false);
    
    onAudioChange(null);
  }, [clearRecording, onAudioChange, reportId, localAudioUrl, user]);

  const handlePlayPause = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!audioRef.current) return;

    // Marquer que l'utilisateur a interagi
    setHasUserInteracted(true);

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(error => {
        console.error("🎯 VOICE_RECORDER - Play error:", error);
        
        // Ne pas afficher de toast d'erreur sur iPhone sauf en cas d'erreur critique
        if (hasUserInteracted && audioRef.current?.error) {
          const audioError = audioRef.current.error;
          if (audioError.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED || 
              audioError.code === MediaError.MEDIA_ERR_NETWORK ||
              audioError.code === MediaError.MEDIA_ERR_DECODE) {
            toast({
              title: "Erreur de lecture",
              description: "Impossible de lire l'enregistrement audio",
              variant: "destructive",
            });
          }
        }
      });
      setIsPlaying(true);
    }
  }, [isPlaying, hasUserInteracted]);

  // CORRECTION: Utiliser l'URL locale d'abord, puis l'URL d'enregistrement, puis l'URL existante
  const currentAudioUrl = localAudioUrl || audioUrl || existingAudioUrl;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  console.log("🎯 VOICE_RECORDER - Current audio URL:", currentAudioUrl);

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

      {isUploading && (
        <div className="flex items-center justify-center text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-sm">Sauvegarde en cours...</span>
        </div>
      )}

      {/* Contrôles d'enregistrement */}
      <div className="flex items-center gap-2">
        {!isRecording && !currentAudioUrl && (
          <Button
            type="button"
            onClick={handleStartRecording}
            disabled={disabled || isUploading}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Nouvel enregistrement</span>
            <span className="sm:hidden">Enregistrer</span>
          </Button>
        )}

        {isRecording && (
          <Button
            type="button"
            onClick={handleStopRecording}
            variant="destructive"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Square className="w-4 h-4" />
            <span className="hidden sm:inline">Arrêter l'enregistrement</span>
            <span className="sm:hidden">Arrêter</span>
          </Button>
        )}

        {currentAudioUrl && !isRecording && (
          <>
            <Button
              type="button"
              onClick={handlePlayPause}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Écouter'}</span>
            </Button>
            
            <Button
              type="button"
              onClick={handleClearRecording}
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-700"
              disabled={isUploading}
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline ml-1">Supprimer</span>
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
          onError={(e) => {
            // Gestion d'erreur améliorée pour iPhone - ne pas afficher de toast
            console.log("🎯 VOICE_RECORDER - Audio error event (silent):", e);
          }}
          className="hidden"
        />
      )}
    </div>
  );
};

export default VoiceRecorderForIntervention;
