
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadAudio } from '@/utils/audioUploadUtils';
import { toast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Mic, Square, Trash2, Play, Pause } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';

interface SimpleAudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  onAudioUrlGenerated?: (url: string) => void;
}

const SimpleAudioRecorder: React.FC<SimpleAudioRecorderProps> = ({
  onAudioRecorded,
  onAudioUrlGenerated
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
  } = useAudioRecorder();

  console.log("🔧 INTERVENTION - SimpleAudioRecorder rendu", {
    hasUser: !!user,
    userId: user?.id,
    isUploading,
    uploadedAudioUrl,
    isRecording,
    hasAudioBlob: !!audioBlob,
    hasAudioUrl: !!audioUrl,
    recordingTime
  });

  // Gestion de l'upload automatique quand un nouveau blob est disponible
  useEffect(() => {
    console.log("🎙️ INTERVENTION - useEffect audioBlob changé:", {
      hasBlob: !!audioBlob,
      blobSize: audioBlob?.size,
      isUploading,
      userConnected: !!user?.id
    });

    if (audioBlob && audioBlob.size > 0 && user?.id && !isUploading) {
      console.log("🎙️ INTERVENTION - Début du processus d'upload");
      
      // Notifier IMMÉDIATEMENT le parent avec le blob
      onAudioRecorded(audioBlob);
      
      // Puis faire l'upload
      handleUpload(audioBlob);
    }
  }, [audioBlob, user?.id, isUploading]);

  const handleUpload = async (blob: Blob) => {
    if (!user?.id || isUploading) {
      console.log("🎙️ INTERVENTION - Upload annulé:", { hasUser: !!user?.id, isUploading });
      return;
    }

    try {
      console.log(`🎙️ INTERVENTION - Début upload, taille: ${blob.size} octets, type: ${blob.type}`);
      setIsUploading(true);
      
      await uploadAudio(
        blob,
        user.id,
        'intervention',
        'audio-record',
        // Callback de succès
        (publicUrl) => {
          console.log(`🎙️ INTERVENTION - ✅ Upload réussi, URL:`, publicUrl);
          setUploadedAudioUrl(publicUrl);
          setIsUploading(false);
          
          // Notifier le parent de l'URL générée
          if (onAudioUrlGenerated) {
            console.log(`🎙️ INTERVENTION - Appel onAudioUrlGenerated avec:`, publicUrl);
            onAudioUrlGenerated(publicUrl);
          }
          
          toast({
            title: "Enregistrement sauvegardé",
            description: "Votre enregistrement vocal a été sauvegardé avec succès",
            duration: 700
          });
        },
        // Callback d'erreur
        (errorMessage) => {
          console.error(`🎙️ INTERVENTION - ❌ Erreur upload:`, errorMessage);
          setIsUploading(false);
          
          toast({
            title: "Erreur de sauvegarde",
            description: errorMessage,
            variant: "destructive",
            duration: 700
          });
        },
        // Callback de début d'upload
        () => {
          console.log(`🎙️ INTERVENTION - 📤 Début téléchargement`);
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
        duration: 700
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
        duration: 700
      });
      return;
    }
    
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
  };

  const handlePlayPause = () => {
    if (!audioUrl) return;

    if (isPlaying) {
      audioElement?.pause();
    } else {
      if (!audioElement) {
        const audio = new Audio(audioUrl);
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
        {!audioUrl && (
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
        {audioUrl && (
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
        
        {uploadedAudioUrl && !isUploading && uploadedAudioUrl !== 'local-audio' && (
          <div className="py-2 mt-2 bg-green-100 rounded-md text-center">
            <span className="text-sm text-green-700">✓ Audio sauvegardé avec succès</span>
          </div>
        )}
        
        {uploadedAudioUrl === 'local-audio' && !isUploading && (
          <div className="py-2 mt-2 bg-yellow-100 rounded-md text-center">
            <span className="text-sm text-yellow-700">⚠ Audio local uniquement</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleAudioRecorder;
