
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
  const [hasProcessedBlob, setHasProcessedBlob] = useState(false);
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
    recordingTime,
    hasProcessedBlob
  });

  // Gérer l'upload automatique quand un nouveau blob est disponible
  useEffect(() => {
    console.log("🎙️ INTERVENTION - useEffect audioBlob changé:", {
      hasBlob: !!audioBlob,
      blobSize: audioBlob?.size,
      isUploading,
      userConnected: !!user?.id,
      hasReportId: !!reportId,
      hasProcessedBlob,
      isRecording
    });

    // Conditions pour déclencher l'upload :
    // 1. On a un blob valide
    // 2. L'enregistrement est terminé
    // 3. On n'a pas déjà traité ce blob
    // 4. On n'est pas en train d'uploader
    // 5. On a un utilisateur et un reportId
    if (audioBlob && 
        audioBlob.size > 0 && 
        !isRecording && 
        !hasProcessedBlob && 
        !isUploading && 
        user?.id) {
      
      console.log("🎙️ INTERVENTION - Conditions remplies pour l'upload");
      
      // Marquer qu'on a traité ce blob
      setHasProcessedBlob(true);
      
      // Notifier IMMÉDIATEMENT le parent avec le blob
      onAudioRecorded(audioBlob);
      
      // Puis faire l'upload si on a un reportId
      if (reportId) {
        handleUpload(audioBlob);
      } else {
        console.log("🎙️ INTERVENTION - Pas de reportId, upload différé");
      }
    }
  }, [audioBlob, isRecording, hasProcessedBlob, isUploading, user?.id, reportId]);

  // Reset du flag quand on commence un nouvel enregistrement
  useEffect(() => {
    if (isRecording) {
      setHasProcessedBlob(false);
    }
  }, [isRecording]);

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
      console.log(`🎙️ INTERVENTION - Début upload, taille: ${blob.size} octets, type: ${blob.type}`);
      
      await uploadInterventionAudio(
        blob,
        user.id,
        reportId,
        // Callback de succès
        (publicUrl) => {
          console.log(`🎙️ INTERVENTION - ✅ Upload réussi, URL:`, publicUrl);
          setUploadedAudioUrl(publicUrl);
          
          // Notifier le parent de l'URL générée
          if (onAudioUrlGenerated) {
            console.log(`🎙️ INTERVENTION - Appel onAudioUrlGenerated avec:`, publicUrl);
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
      console.error(`🎙️ INTERVENTION - 💥 Erreur non gérée dans handleUpload:`, error);
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
    
    // Reset des états
    setHasProcessedBlob(false);
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
    setHasProcessedBlob(false);
    
    // Notifier le parent avec un blob vide pour déclencher la suppression
    const emptyBlob = new Blob([], { type: 'audio/webm' });
    onAudioRecorded(emptyBlob);
    
    // Notifier également que l'URL doit être supprimée
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

  console.log("🔧 INTERVENTION - SimpleAudioRecorder avant render final");

  return (
    <div className="border rounded-md p-4 bg-white shadow-sm">
      <div className="text-sm font-medium mb-3 text-gray-700">Enregistrement vocal</div>
      
      <div className={`transition-all ${isUploading ? "opacity-60 pointer-events-none" : ""}`}>
        
        {/* Interface d'enregistrement */}
        {!audioUrl && !uploadedAudioUrl && (
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
        {(audioUrl || uploadedAudioUrl) && (
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
