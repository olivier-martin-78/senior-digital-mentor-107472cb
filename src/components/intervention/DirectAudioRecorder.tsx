
import React, { useState, useEffect } from 'react';
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
  reportId?: string;
}

const DirectAudioRecorder: React.FC<DirectAudioRecorderProps> = ({
  onAudioRecorded,
  onAudioUrlGenerated,
  reportId
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const { user } = useAuth();

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
    hasAudioUrl: !!audioUrl,
    isUploading,
    uploadedAudioUrl,
    recordingTime
  });

  // === TRAITEMENT AUTOMATIQUE DU BLOB AUDIO ===
  useEffect(() => {
    if (audioBlob && audioBlob.size > 0 && !isUploading) {
      console.log("🎙️ DIRECT - Nouveau blob détecté, traitement automatique");
      console.log("🎙️ DIRECT - Taille blob:", audioBlob.size, "octets");
      
      // 1. Notifier IMMÉDIATEMENT le parent
      onAudioRecorded(audioBlob);
      
      // 2. Déclencher l'upload si les conditions sont remplies
      if (reportId && user?.id) {
        console.log("🎙️ DIRECT - Conditions OK pour upload, démarrage...");
        handleUpload(audioBlob);
      } else {
        console.log("🎙️ DIRECT - Upload différé:", { hasReportId: !!reportId, hasUser: !!user?.id });
      }
    }
  }, [audioBlob, isUploading, user?.id, reportId, onAudioRecorded]);

  const handleUpload = async (blob: Blob) => {
    if (!user?.id || !reportId || isUploading) {
      console.log("🎙️ DIRECT - Upload annulé:", { 
        hasUser: !!user?.id, 
        hasReportId: !!reportId,
        isUploading 
      });
      return;
    }

    console.log(`🎙️ DIRECT - === DÉBUT UPLOAD ===`);
    console.log(`🎙️ DIRECT - Taille blob: ${blob.size} octets`);
    
    try {
      await uploadInterventionAudio(
        blob,
        user.id,
        reportId,
        // Callback succès
        (publicUrl) => {
          console.log(`🎙️ DIRECT - ✅ Upload réussi:`, publicUrl);
          setUploadedAudioUrl(publicUrl);
          
          if (onAudioUrlGenerated) {
            onAudioUrlGenerated(publicUrl);
          }
          
          toast({
            title: "Enregistrement sauvegardé",
            description: "L'audio a été sauvegardé avec succès",
            duration: 2000
          });
        },
        // Callback erreur
        (errorMessage) => {
          console.error(`🎙️ DIRECT - ❌ Erreur upload:`, errorMessage);
          toast({
            title: "Erreur de sauvegarde",
            description: errorMessage,
            variant: "destructive",
            duration: 3000
          });
        },
        // Callback début upload
        () => {
          console.log(`🎙️ DIRECT - 📤 Début upload`);
          setIsUploading(true);
        },
        // Callback fin upload
        () => {
          console.log(`🎙️ DIRECT - 📥 Fin upload`);
          setIsUploading(false);
        }
      );
    } catch (error) {
      console.error(`🎙️ DIRECT - 💥 Erreur non gérée:`, error);
      setIsUploading(false);
      
      toast({
        title: "Erreur inattendue",
        description: "Erreur lors du téléchargement de l'audio",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const handleStartRecording = async () => {
    console.log("🎙️ DIRECT - Début enregistrement demandé");
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
    
    try {
      await startRecording();
      console.log("🎙️ DIRECT - Enregistrement démarré");
    } catch (error) {
      console.error("🎙️ DIRECT - Erreur démarrage:", error);
    }
  };

  const handleStopRecording = async () => {
    console.log("🎙️ DIRECT - Arrêt enregistrement demandé");
    try {
      await stopRecording();
      console.log("🎙️ DIRECT - Enregistrement arrêté");
    } catch (error) {
      console.error("🎙️ DIRECT - Erreur arrêt:", error);
    }
  };

  const handleClearRecording = () => {
    console.log("🎙️ DIRECT - Suppression enregistrement");
    clearRecording();
    setUploadedAudioUrl(null);
    
    // Notifier le parent avec un blob vide
    const emptyBlob = new Blob([], { type: 'audio/webm' });
    onAudioRecorded(emptyBlob);
    
    if (onAudioUrlGenerated) {
      onAudioUrlGenerated('');
    }
  };

  const handlePlayPause = () => {
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
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasAudio = !!(audioUrl || uploadedAudioUrl);

  return (
    <div className="border rounded-md p-4 bg-white shadow-sm">
      <div className="text-sm font-medium mb-3 text-gray-700">Enregistrement vocal</div>
      
      <div className={`transition-all ${isUploading ? "opacity-60 pointer-events-none" : ""}`}>
        
        {/* Interface d'enregistrement */}
        {!hasAudio && (
          <div className="flex items-center gap-4">
            {!isRecording ? (
              <Button
                onClick={handleStartRecording}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                disabled={isUploading}
              >
                <Mic className="h-4 w-4" />
                Commencer l'enregistrement
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <Button
                  onClick={handleStopRecording}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Arrêter
                </Button>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  {formatTime(recordingTime)}
                </div>
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
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? 'Pause' : 'Écouter'}
            </Button>
            
            <Button
              onClick={handleClearRecording}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-red-600 hover:text-red-700"
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
