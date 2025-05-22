
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
  
  // Nettoyer les ressources lors du démontage
  useEffect(() => {
    return () => {
      stopRecording();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
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
  
  const startRecording = async () => {
    try {
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
        if (event.data.size > 0) {
          console.log("Chunk audio reçu:", event.data.size, "octets");
          audioChunks.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        console.log("Enregistrement arrêté, traitement des données...");
        if (audioChunks.current.length > 0) {
          console.log("Nombre de chunks audio:", audioChunks.current.length);
          
          // Création du blob audio
          const mimeType = recorder.mimeType || 'audio/webm';
          const blob = new Blob(audioChunks.current, { type: mimeType });
          console.log("Blob audio créé:", blob.size, "octets, type:", blob.type);
          
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
            console.error("Blob audio vide");
            toast({
              title: "Erreur d'enregistrement",
              description: "L'enregistrement audio est vide. Veuillez réessayer.",
              variant: "destructive",
            });
          }
        } else {
          console.error("Aucun chunk audio disponible");
          toast({
            title: "Erreur d'enregistrement",
            description: "Aucune donnée audio n'a été capturée. Veuillez réessayer.",
            variant: "destructive",
          });
        }
        
        setIsRecording(false);
        
        // Arrêter toutes les pistes du flux
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      
      // Démarrer l'enregistrement avec un intervalle de 1 seconde
      recorder.start(1000);
      setIsRecording(true);
      console.log("Enregistrement démarré");
      
    } catch (error) {
      console.error("Erreur lors de l'accès au microphone:", error);
      setIsRecording(false);
      
      toast({
        title: "Erreur d'accès au microphone",
        description: "Veuillez vérifier que vous avez accordé les permissions nécessaires à votre navigateur.",
        variant: "destructive",
      });
    }
  };
  
  const stopRecording = () => {
    console.log("Tentative d'arrêt de l'enregistrement...");
    try {
      if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
        console.log("État du MediaRecorder avant arrêt:", mediaRecorder.current.state);
        mediaRecorder.current.stop();
        console.log("MediaRecorder arrêté");
      } else if (mediaRecorder.current) {
        console.log("MediaRecorder déjà inactif:", mediaRecorder.current.state);
      } else {
        console.log("Pas de MediaRecorder à arrêter");
      }
    } catch (error) {
      console.error("Erreur lors de l'arrêt du MediaRecorder:", error);
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
    
    setIsRecording(false);
  };
  
  const clearRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      console.log("URL temporaire révoquée");
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
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
