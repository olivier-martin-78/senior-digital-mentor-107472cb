
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadInterventionAudio } from '@/utils/interventionAudioUtils';
import { toast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Play, Pause } from 'lucide-react';
import { useStableAudioRecorder } from '@/hooks/use-stable-audio-recorder';

interface SimpleAudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  onAudioUrlGenerated?: (url: string) => void;
  reportId?: string;
}

const SimpleAudioRecorder: React.FC<SimpleAudioRecorderProps> = ({
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
  } = useStableAudioRecorder();

  console.log("🔧 INTERVENTION - SimpleAudioRecorder rendu", {
    hasUser: !!user,
    userId: user?.id,
    reportId,
    isUploading,
    uploadedAudioUrl,
    isRecording,
    hasAudioBlob: !!audioBlob,
    hasAudioUrl: !!audioUrl,
    recordingTime
  });

  // Traiter le blob audio quand il est disponible
  useEffect(() => {
    console.log("🎙️ INTERVENTION - useEffect audioBlob changé:", {
      hasBlob: !!audioBlob,
      blobSize: audioBlob?.size,
      isUploading,
      userConnected: !!user?.id,
      hasReportId: !!reportId,
      isRecording
    });

    if (audioBlob && !isRecording && !isUploading && audioBlob.size > 0) {
      console.log("🎙️ INTERVENTION - Traitement du blob audio");
      
      // Notifier IMMÉDIATEMENT le parent avec le blob
      onAudioRecorded(audioBlob);
      
      // Si on a un reportId et un blob valide, faire l'upload
      if (reportId && user?.id) {
        console.log("🎙️ INTERVENTION - Conditions remplies pour upload");
        handleUpload(audioBlob);
      } else {
        console.log("🎙️ INTERVENTION - Upload différé, manque reportId ou user");
      }
    }
  }, [audioBlob, isRecording, isUploading, user?.id, reportId, onAudioRecorded]);

  const handleUpload = async (blob: Blob) => {
    if (!user?.id || isUploading || !reportId) {
      console.log("🎙️ INTERVENTION - Upload annulé:", { 
        hasUser: !!user?.id, 
        isUploading, 
        hasReportId: !!reportId 
      });
      return;
    }

    try {
      console.log(`🎙️ INTERVENTION - Début upload, taille: ${blob.size} octets`);
      
      await uploadInterventionAudio(
        blob,
        user.id,
        reportId,
        // Callback de succès
        (publicUrl) => {
          console.log(`🎙️ INTERVENTION - ✅ Upload réussi, URL:`, publicUrl);
          setUploadedAudioUrl(publicUrl);
          
          if (onAudioUrlGenerated) {
            onAudioUrlGenerated(publicUrl);
          }
          
          toast({
            title: "Enregistrement sauvegardé",
            description: "Votre enregistrement vocal a été sauvegardé avec succès",
            duration: 2000
          });
        },
        // Callback d'erreur
        (errorMessage) => {
          console.error(`🎙️ INTERVENTION - ❌ Erreur upload:`, errorMessage);
          
          toast({
            title: "Erreur de sauvegarde",
            description: errorMessage,
            variant: "destructive",
            duration: 3000
          });
        },
        // Callback de début d'upload
        () => {
          console.log(`🎙️ INTERVENTION - 📤 Début téléchargement`);
          setIsUploading(true);
        },
        // Callback de fin d'upload
        () => {
          console.log(`🎙️ INTERVENTION - 📥 Fin téléchargement`);
          setIsUploading(false);
        }
      );
    } catch (error) {
      console.error(`🎙️ INTERVENTION - 💥 Erreur non gérée:`, error);
      setIsUploading(false);
      
      toast({
        title: "Erreur inattendue",
        description: "Une erreur est survenue lors du téléchargement de l'audio",
        variant: "destructive",
        duration: 3000
      });
    }
  };

  const handleStartRecording = async () => {
    console.log("🎙️ INTERVENTION - Début enregistrement demandé");
    if (!user?.id) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour enregistrer un audio",
        variant: "destructive",
        duration: 2000
      });
      return;
    }
    
    setUploadedAudioUrl(null);
    
    try {
      await startRecording();
      console.log("🎙️ INTERVENTION - Enregistrement démarré avec succès");
    } catch (error) {
      console.error("🎙️ INTERVENTION - Erreur démarrage enregistrement:", error);
    }
  };

  const handleStopRecording = async () => {
    console.log("🎙️ INTERVENTION - Arrêt enregistrement demandé");
    try {
      await stopRecording();
      console.log("🎙️ INTERVENTION - Enregistrement arrêté avec succès");
    } catch (error) {
      console.error("🎙️ INTERVENTION - Erreur arrêt enregistrement:", error);
    }
  };

  const handleClearRecording = () => {
    console.log("🎙️ INTERVENTION - Suppression enregistrement demandée");
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
    if (!audioUrl && !uploadedAudioUrl) return;

    const urlToPlay = uploadedAudioUrl || audioUrl;

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

  console.log("🔧 INTERVENTION - SimpleAudioRecorder avant render final", {
    hasAudio,
    audioUrl,
    uploadedAudioUrl
  });

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

export default SimpleAudioRecorder;
