
import { useState, useRef, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseVoiceRecorderProps {
  onRecordingComplete?: (audioBlob: Blob, audioUrl: string) => void;
}

export const useVoiceRecorder = ({ onRecordingComplete }: UseVoiceRecorderProps = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isStoppingRef = useRef(false);
  const finalizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Nettoyer les ressources lors du démontage
  useEffect(() => {
    return () => {
      stopRecording();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (finalizeTimeoutRef.current) {
        clearTimeout(finalizeTimeoutRef.current);
      }
    };
  }, []);
  
  // Gérer le minuteur d'enregistrement
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);
  
  const finalizeRecording = () => {
    console.log("Finalisation de l'enregistrement...");
    console.log("Chunks finaux disponibles:", audioChunks.current.length);
    
    if (audioChunks.current.length > 0) {
      // Création du blob audio
      const mimeType = mediaRecorder.current?.mimeType || 'audio/webm';
      const blob = new Blob(audioChunks.current, { type: mimeType });
      console.log("Blob audio final créé:", blob.size, "octets, type:", blob.type);
      
      if (blob.size > 0) {
        const tempUrl = URL.createObjectURL(blob);
        console.log("URL temporaire créée:", tempUrl);
        
        setAudioBlob(blob);
        setAudioUrl(tempUrl);
        
        if (onRecordingComplete) {
          console.log("Appel du callback onRecordingComplete");
          onRecordingComplete(blob, tempUrl);
        }
      } else {
        console.error("Blob audio vide après finalisation");
        toast({
          title: "Erreur d'enregistrement",
          description: "L'enregistrement audio est vide. Veuillez réessayer et parler plus longtemps.",
          variant: "destructive",
        });
      }
    } else {
      console.error("Aucun chunk audio disponible après finalisation");
      toast({
        title: "Erreur d'enregistrement", 
        description: "Aucune donnée audio n'a été capturée. Veuillez réessayer et parler plus longtemps.",
        variant: "destructive",
      });
    }
    
    setIsRecording(false);
    isStoppingRef.current = false;
    
    // Arrêter toutes les pistes du flux
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };
  
  const startRecording = async () => {
    try {
      // Réinitialiser les flags
      isStoppingRef.current = false;
      
      // Nettoyer les timeouts précédents
      if (finalizeTimeoutRef.current) {
        clearTimeout(finalizeTimeoutRef.current);
        finalizeTimeoutRef.current = null;
      }
      
      // Nettoyer l'enregistrement précédent s'il existe
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      
      setAudioBlob(null);
      setAudioUrl(null);
      audioChunks.current = [];
      setRecordingTime(0);
      
      console.log("Demande d'accès au microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;
      
      console.log("Création du MediaRecorder...");
      // Utiliser des options explicites pour MediaRecorder
      const options = { 
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };
      
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
        console.log("MediaRecorder créé avec les options:", options);
      } catch (e) {
        // Fallback si le codec opus n'est pas supporté
        console.warn("Codec opus non supporté, utilisation des options par défaut");
        recorder = new MediaRecorder(stream);
      }
      
      mediaRecorder.current = recorder;
      
      recorder.ondataavailable = (event) => {
        console.log("Chunk audio reçu:", event.data.size, "octets");
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        console.log("Enregistrement arrêté, attendre les derniers chunks...");
        
        // CORRECTION: Attendre un délai pour que tous les chunks arrivent
        finalizeTimeoutRef.current = setTimeout(() => {
          finalizeRecording();
        }, 300); // Attendre 300ms pour les derniers chunks
      };
      
      recorder.onerror = (event) => {
        console.error("Erreur MediaRecorder:", event);
        setIsRecording(false);
        isStoppingRef.current = false;
        toast({
          title: "Erreur d'enregistrement",
          description: "Une erreur s'est produite pendant l'enregistrement. Veuillez réessayer.",
          variant: "destructive",
        });
      };
      
      // Démarrer l'enregistrement avec un intervalle de collection de données plus court
      recorder.start(100); // Collecter des données toutes les 100ms
      setIsRecording(true);
      console.log("Enregistrement démarré");
      
    } catch (error) {
      console.error("Erreur lors de l'accès au microphone:", error);
      setIsRecording(false);
      isStoppingRef.current = false;
      
      let errorMessage = "Veuillez vérifier que vous avez accordé les permissions nécessaires à votre navigateur.";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "L'accès au microphone a été refusé. Veuillez autoriser l'accès au microphone dans votre navigateur.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "Aucun microphone n'a été trouvé. Veuillez vérifier qu'un microphone est connecté.";
        } else if (error.name === 'NotReadableError') {
          errorMessage = "Le microphone est utilisé par une autre application. Veuillez fermer les autres applications utilisant le microphone.";
        }
      }
      
      toast({
        title: "Erreur d'accès au microphone",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  const stopRecording = () => {
    console.log("Tentative d'arrêt de l'enregistrement...");
    
    if (isStoppingRef.current) {
      console.log("Arrêt déjà en cours...");
      return;
    }
    
    isStoppingRef.current = true;
    
    try {
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        console.log("État du MediaRecorder avant arrêt:", mediaRecorder.current.state);
        
        if (mediaRecorder.current.state === 'recording') {
          // Force la collecte d'un dernier chunk avant l'arrêt
          mediaRecorder.current.requestData();
          
          // Petit délai puis arrêt
          setTimeout(() => {
            if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
              mediaRecorder.current.stop();
              console.log("MediaRecorder arrêté");
            }
          }, 50);
        } else {
          mediaRecorder.current.stop();
          console.log("MediaRecorder arrêté");
        }
      } else if (mediaRecorder.current) {
        console.log("MediaRecorder déjà inactif:", mediaRecorder.current.state);
        isStoppingRef.current = false;
      } else {
        console.log("Pas de MediaRecorder à arrêter");
        isStoppingRef.current = false;
      }
    } catch (error) {
      console.error("Erreur lors de l'arrêt du MediaRecorder:", error);
      isStoppingRef.current = false;
    }
    
    try {
      if (streamRef.current) {
        console.log("Arrêt des pistes audio du stream");
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log("Piste arrêtée:", track.kind, track.label);
        });
        streamRef.current = null;
      }
    } catch (error) {
      console.error("Erreur lors de l'arrêt des pistes audio:", error);
    }
  };
  
  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      console.log("URL temporaire révoquée");
    }
    
    if (finalizeTimeoutRef.current) {
      clearTimeout(finalizeTimeoutRef.current);
      finalizeTimeoutRef.current = null;
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
    audioChunks.current = [];
    console.log("Enregistrement effacé");
  };
  
  return {
    isRecording,
    audioBlob,
    audioUrl,
    recordingTime,
    startRecording,
    stopRecording,
    clearRecording
  };
};

export default useVoiceRecorder;
