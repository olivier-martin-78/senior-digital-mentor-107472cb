
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadInterventionAudio } from '@/utils/interventionAudioUtils';
import { toast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Play, Pause } from 'lucide-react';
import { useSimpleAudioRecorder } from '@/hooks/use-simple-audio-recorder';

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [hasProcessedCurrentBlob, setHasProcessedCurrentBlob] = useState(false);
  const { user } = useAuth();

  // NOUVEAU: Refs stables pour éviter les re-créations
  const stableCallbacksRef = useRef({
    onAudioRecorded,
    onAudioUrlGenerated,
    onRecordingStatusChange
  });

  // NOUVEAU: Mettre à jour les refs sans déclencher de re-render
  useEffect(() => {
    stableCallbacksRef.current = {
      onAudioRecorded,
      onAudioUrlGenerated,
      onRecordingStatusChange
    };
  });

  const {
    isRecording,
    audioBlob,
    audioUrl,
    recordingTime,
    startRecording,
    stopRecording,
    clearRecording
  } = useSimpleAudioRecorder();

  console.log("🔧 DIRECT - DirectAudioRecorder rendu", {
    hasUser: !!user,
    userId: user?.id,
    reportId,
    isRecording,
    hasAudioBlob: !!audioBlob,
    blobSize: audioBlob?.size,
    hasAudioUrl: !!audioUrl,
    isUploading,
    uploadedAudioUrl,
    recordingTime,
    hasProcessedCurrentBlob
  });

  // NOUVEAU: Callback stable pour le changement de statut
  const stableOnRecordingStatusChange = useCallback((isRecording: boolean) => {
    console.log('🎙️ DIRECT - Changement statut (stable):', isRecording);
    if (stableCallbacksRef.current.onRecordingStatusChange) {
      stableCallbacksRef.current.onRecordingStatusChange(isRecording);
    }
  }, []);

  // NOUVEAU: Notifier les changements de statut de manière stable
  useEffect(() => {
    stableOnRecordingStatusChange(isRecording);
  }, [isRecording, stableOnRecordingStatusChange]);

  // NOUVEAU: Callback stable pour traiter l'audio
  const stableHandleAudio = useCallback((blob: Blob, url?: string) => {
    console.log('🎙️ DIRECT - Traitement audio stable:', { blobSize: blob.size, url });
    
    // Notifier immédiatement le parent avec le blob
    if (stableCallbacksRef.current.onAudioRecorded) {
      stableCallbacksRef.current.onAudioRecorded(blob);
    }

    // Si on a une URL, la notifier aussi
    if (url && stableCallbacksRef.current.onAudioUrlGenerated) {
      stableCallbacksRef.current.onAudioUrlGenerated(url);
    }
  }, []);

  // NOUVEAU: Traitement unique et stable du blob audio
  useEffect(() => {
    console.log("🎙️ DIRECT - useEffect audioBlob (stable):", {
      hasBlob: !!audioBlob,
      blobSize: audioBlob?.size,
      isUploading,
      userConnected: !!user?.id,
      hasReportId: !!reportId,
      hasProcessedCurrentBlob,
      audioUrl
    });

    // NOUVEAU: Traiter seulement si c'est un nouveau blob non traité
    if (audioBlob && audioBlob.size > 0 && !hasProcessedCurrentBlob && !isUploading) {
      console.log("🎙️ DIRECT - Traitement du nouveau blob audio (stable)");
      
      // Marquer comme traité AVANT de faire quoi que ce soit
      setHasProcessedCurrentBlob(true);
      
      // Traiter l'audio de manière stable
      stableHandleAudio(audioBlob, audioUrl);
      
      // Si on a un reportId et un utilisateur, faire l'upload
      if (reportId && user?.id) {
        console.log("🎙️ DIRECT - Conditions remplies pour upload (stable)");
        handleUpload(audioBlob);
      } else {
        console.log("🎙️ DIRECT - Upload différé (stable):", { hasReportId: !!reportId, hasUser: !!user?.id });
      }
    }
  }, [audioBlob, hasProcessedCurrentBlob, isUploading, user?.id, reportId, audioUrl, stableHandleAudio]);

  // NOUVEAU: Reset du flag de traitement quand un nouvel enregistrement commence
  useEffect(() => {
    if (isRecording && hasProcessedCurrentBlob) {
      console.log("🔄 DIRECT - Reset du flag de traitement pour nouvel enregistrement (stable)");
      setHasProcessedCurrentBlob(false);
      setUploadedAudioUrl(null);
    }
  }, [isRecording, hasProcessedCurrentBlob]);

  const handleUpload = async (blob: Blob) => {
    if (!user?.id || !reportId || isUploading) {
      console.log("🎙️ DIRECT - Upload annulé (stable):", { 
        hasUser: !!user?.id, 
        hasReportId: !!reportId,
        isUploading 
      });
      return;
    }

    console.log(`🎙️ DIRECT - === DÉBUT UPLOAD (stable) ===`);
    console.log(`🎙️ DIRECT - Taille blob: ${blob.size} octets`);
    console.log(`🎙️ DIRECT - User ID: ${user.id}`);
    console.log(`🎙️ DIRECT - Report ID: ${reportId}`);
    
    try {
      await uploadInterventionAudio(
        blob,
        user.id,
        reportId,
        // Callback succès
        (publicUrl) => {
          console.log(`🎙️ DIRECT - ✅ Upload réussi (stable):`, publicUrl);
          setUploadedAudioUrl(publicUrl);
          
          console.log(`🎙️ DIRECT - Notification parent avec URL (stable):`, publicUrl);
          if (stableCallbacksRef.current.onAudioUrlGenerated) {
            stableCallbacksRef.current.onAudioUrlGenerated(publicUrl);
          }
          
          toast({
            title: "Enregistrement sauvegardé",
            description: "L'audio a été sauvegardé avec succès",
            duration: 2000
          });
        },
        // Callback erreur
        (errorMessage) => {
          console.error(`🎙️ DIRECT - ❌ Erreur upload (stable):`, errorMessage);
          toast({
            title: "Erreur de sauvegarde",
            description: errorMessage,
            variant: "destructive",
            duration: 3000
          });
        },
        // Callback début upload
        () => {
          console.log(`🎙️ DIRECT - 📤 Début upload (stable)`);
          setIsUploading(true);
        },
        // Callback fin upload
        () => {
          console.log(`🎙️ DIRECT - 📥 Fin upload (stable)`);
          setIsUploading(false);
        }
      );
    } catch (error) {
      console.error(`🎙️ DIRECT - 💥 Erreur non gérée (stable):`, error);
      setIsUploading(false);
      
      toast({
        title: "Erreur inattendue",
        description: "Erreur lors du téléchargement de l'audio",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const handleStartRecording = useCallback(async () => {
    console.log("🎙️ DIRECT - Début enregistrement demandé (stable)");
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour enregistrer",
        variant: "destructive",
        duration: 2000
      });
      return;
    }
    
    // Réinitialiser l'état
    setUploadedAudioUrl(null);
    setHasProcessedCurrentBlob(false);
    
    try {
      await startRecording();
      console.log("🎙️ DIRECT - Enregistrement démarré (stable)");
    } catch (error) {
      console.error("🎙️ DIRECT - Erreur démarrage (stable):", error);
    }
  }, [user?.id, startRecording]);

  const handleStopRecording = useCallback(async () => {
    console.log("🎙️ DIRECT - Arrêt enregistrement demandé (stable)");
    try {
      await stopRecording();
      console.log("🎙️ DIRECT - Enregistrement arrêté (stable)");
    } catch (error) {
      console.error("🎙️ DIRECT - Erreur arrêt (stable):", error);
    }
  }, [stopRecording]);

  const handleClearRecording = useCallback(() => {
    console.log("🎙️ DIRECT - Suppression enregistrement (stable)");
    clearRecording();
    setUploadedAudioUrl(null);
    setHasProcessedCurrentBlob(false);
    
    // Notifier le parent avec un blob vide de manière stable
    if (stableCallbacksRef.current.onAudioRecorded) {
      const emptyBlob = new Blob([], { type: 'audio/webm' });
      stableCallbacksRef.current.onAudioRecorded(emptyBlob);
    }
    
    if (stableCallbacksRef.current.onAudioUrlGenerated) {
      stableCallbacksRef.current.onAudioUrlGenerated('');
    }
  }, [clearRecording]);

  const handlePlayPause = useCallback(() => {
    const urlToPlay = uploadedAudioUrl || audioUrl;
    if (!urlToPlay) return;

    if (isPlaying) {
      audioElement?.pause();
    } else {
      if (!audioElement) {
        const audio = new Audio(urlToPlay);
        audio.onended = () => setIsPlaying(false);
        audio.onpause = () => setIsPlaying(false);
        setAudioElement(audio);
        audio.play();
      } else {
        audioElement.play();
      }
    }
    setIsPlaying(!isPlaying);
  }, [uploadedAudioUrl, audioUrl, isPlaying, audioElement]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const hasAudio = !!(audioUrl || uploadedAudioUrl);

  return (
    <div className="border rounded-md p-4 bg-white shadow-sm">
      <div className="text-sm font-medium mb-3 text-gray-700">Enregistrement vocal</div>
      
      <div className={`transition-all ${isUploading ? "opacity-60 pointer-events-none" : ""}`}>
        
        {/* Interface d'enregistrement */}
        {!hasAudio && (
          <div className="space-y-4">
            {!isRecording ? (
              <Button
                onClick={handleStartRecording}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={isUploading || isRecording}
              >
                <Mic className="h-4 w-4" />
                Commencer l'enregistrement
              </Button>
            ) : (
              <div className="space-y-3">
                {/* Indicateur d'enregistrement */}
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-red-700">
                    Enregistrement en cours... {formatTime(recordingTime)}
                  </span>
                </div>
                
                {/* Bouton d'arrêt - TRÈS VISIBLE */}
                <Button
                  onClick={handleStopRecording}
                  variant="destructive"
                  size="lg"
                  className="w-full flex items-center gap-2 bg-red-600 hover:bg-red-700"
                  disabled={isUploading}
                >
                  <Square className="h-5 w-5" />
                  Arrêter l'enregistrement
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Interface de lecture */}
        {hasAudio && (
          <div className="flex items-center gap-4">
            <Button
              onClick={handlePlayPause}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={isUploading}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Écouter'}
            </Button>
            
            <Button
              onClick={handleClearRecording}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
              disabled={isUploading}
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
          </div>
        )}
        
        {/* États d'upload */}
        {isUploading && (
          <div className="flex items-center justify-center py-2 mt-2 bg-gray-100 rounded-md">
            <Spinner className="h-5 w-5 border-gray-500 mr-2" />
            <span className="text-sm text-gray-700">Sauvegarde en cours...</span>
          </div>
        )}
        
        {uploadedAudioUrl && !isUploading && (
          <div className="py-2 mt-2 bg-green-100 rounded-md text-center">
            <span className="text-sm text-green-700">✓ Audio sauvegardé avec succès</span>
          </div>
        )}
        
        {!reportId && !isUploading && (audioUrl || audioBlob) && (
          <div className="py-2 mt-2 bg-yellow-100 rounded-md text-center">
            <span className="text-sm text-yellow-700">⚠ Sauvegarde différée (en attente du rapport)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectAudioRecorder;
