
import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/contexts/AuthContext';
import useVoiceRecorder from '@/hooks/use-voice-recorder';
import RecordingControls from './RecordingControls';
import VoiceAnswerPlayer from './VoiceAnswerPlayer';
import { uploadRecording, validateAudioUrl, preloadAudio } from './utils/audioUtils';

interface VoiceAnswerRecorderProps {
  questionId: string;
  chapterId: string;
  existingAudio?: string | null;
  onRecordingComplete: (questionId: string, audioBlob: Blob, audioUrl: string) => void;
  onDeleteRecording: (questionId: string) => void;
}

export const VoiceAnswerRecorder: React.FC<VoiceAnswerRecorderProps> = ({
  questionId,
  chapterId,
  existingAudio,
  onRecordingComplete,
  onDeleteRecording
}) => {
  const { user } = useAuth();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [audioUrlError, setAudioUrlError] = useState(false);
  const [processingRecording, setProcessingRecording] = useState(false);
  
  const { 
    isRecording, 
    audioBlob, 
    recordingTime, 
    startRecording, 
    stopRecording
  } = useVoiceRecorder({
    onRecordingComplete: (blob, tempUrl) => {
      console.log("Enregistrement terminé, blob disponible:", blob.size, "octets");
      setProcessingRecording(true);
      
      // Vérification de la validité du blob
      if (!blob || blob.size === 0) {
        toast({
          title: "Erreur d'enregistrement",
          description: "L'enregistrement audio semble vide ou corrompu",
          variant: "destructive",
        });
        setProcessingRecording(false);
        return;
      }
      
      // Pour le test local ou si pas d'utilisateur
      if (!user || !user.id) {
        setTimeout(() => {
          onRecordingComplete(questionId, blob, tempUrl);
          setAudioUrl(tempUrl);
          setProcessingRecording(false);
        }, 500);
        return;
      }
      
      // Sinon, télécharger l'enregistrement
      uploadAudioRecording(blob);
    }
  });
  
  // Initialize audio URL from props if provided
  useEffect(() => {
    if (existingAudio) {
      const validUrl = validateAudioUrl(existingAudio);
      if (validUrl) {
        console.log("URL audio existante valide:", validUrl);
        setAudioUrl(validUrl);
        setAudioUrlError(false);
      } else {
        console.error("URL audio existante invalide:", existingAudio);
        setAudioUrl(null);
        setAudioUrlError(true);
      }
    } else {
      setAudioUrl(null);
      setAudioUrlError(false);
    }
  }, [existingAudio]);
  
  const uploadAudioRecording = async (blob: Blob) => {
    if (!user || !user.id) {
      toast({
        title: "Erreur d'authentification",
        description: "Veuillez vous connecter pour enregistrer une réponse vocale.",
        variant: "destructive",
      });
      setProcessingRecording(false);
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Vérification supplémentaire du blob avant upload
      if (!blob || blob.size < 100) { // Une taille minimale pour s'assurer qu'il y a du contenu
        throw new Error("Enregistrement audio invalide ou vide");
      }
      
      // Création d'une copie du blob pour éviter les problèmes de référence
      const blobCopy = blob.slice(0, blob.size, blob.type);
      
      uploadRecording(
        blobCopy,
        user.id,
        chapterId,
        questionId,
        {
          onSuccess: async (url) => {
            // Vérification supplémentaire de l'URL après téléchargement
            if (validateAudioUrl(url)) {
              console.log("URL audio valide après téléchargement:", url);
              
              // Vérifier que l'audio est accessible
              const isValid = await preloadAudio(url);
              if (isValid) {
                setAudioUrl(url);
                onRecordingComplete(questionId, blobCopy, url);
                toast({
                  title: "Enregistrement sauvegardé",
                  description: "Votre enregistrement vocal a été sauvegardé avec succès",
                  duration: 2000
                });
              } else {
                throw new Error("L'audio téléchargé n'est pas lisible");
              }
            } else {
              throw new Error("L'URL de l'enregistrement n'est pas valide après téléchargement");
            }
          },
          onError: (errorMessage) => {
            console.error("Erreur lors du téléchargement:", errorMessage);
            toast({
              title: "Erreur de téléchargement",
              description: errorMessage,
              variant: "destructive",
            });
            throw new Error(errorMessage);
          },
          onUploadStart: () => {
            console.log("Début du téléchargement");
          },
          onUploadEnd: () => {
            console.log("Fin du téléchargement");
            setIsUploading(false);
            setProcessingRecording(false);
          }
        }
      );
    } catch (error: any) {
      console.error("Erreur pendant le processus d'upload:", error);
      toast({
        title: "Erreur d'enregistrement",
        description: error.message || "Erreur lors du traitement de l'enregistrement audio",
        variant: "destructive",
      });
      setIsUploading(false);
      setProcessingRecording(false);
    }
  };
  
  const handleDelete = () => {
    setAudioUrl(null);
    onDeleteRecording(questionId);
  };
  
  // Affichage en cas d'erreur d'URL audio
  if (audioUrlError) {
    return (
      <div className="mt-2 p-3 border rounded-md bg-gray-50">
        <div className="text-sm font-medium mb-2">Réponse vocale</div>
        <div className="p-2 text-amber-700 bg-amber-50 rounded-md mb-2">
          L'enregistrement audio n'a pas pu être chargé. Vous pouvez en enregistrer un nouveau.
        </div>
        <RecordingControls 
          isRecording={isRecording}
          recordingTime={recordingTime}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
        />
      </div>
    );
  }
  
  return (
    <div className="mt-2 p-3 border rounded-md bg-gray-50">
      <div className="text-sm font-medium mb-2">Réponse vocale</div>
      
      {isRecording || (!isUploading && !audioUrl && !processingRecording) ? (
        <RecordingControls 
          isRecording={isRecording}
          recordingTime={recordingTime}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
        />
      ) : (
        <div className="flex items-center justify-between mb-2">
          <span className="text-gray-500">
            {audioUrl ? "Réponse vocale enregistrée" : "Prêt à enregistrer"}
          </span>
          {!audioUrl && !isUploading && !processingRecording && (
            <button 
              className="px-2 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100"
              onClick={startRecording}
            >
              Enregistrer
            </button>
          )}
        </div>
      )}
      
      {(isUploading || processingRecording) && (
        <div className="flex justify-center items-center py-2 mb-2">
          <Spinner className="mr-2 h-4 w-4" />
          <span className="text-sm">
            {isUploading ? "Téléchargement en cours..." : "Traitement de l'enregistrement..."}
          </span>
        </div>
      )}
      
      {audioUrl && !isUploading && !processingRecording && (
        <VoiceAnswerPlayer
          audioUrl={audioUrl}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

export default VoiceAnswerRecorder;
