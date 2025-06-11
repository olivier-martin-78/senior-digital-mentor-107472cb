
import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface AudioRecorderHook {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => void;
  recordingTime: number;
}

export const useAudioRecorder = (): AudioRecorderHook => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  
  // Nettoyer les ressources lors du démontage
  useEffect(() => {
    return () => {
      stopAllRecording();
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);
  
  // Gestion du timer d'enregistrement
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRecording]);
  
  // Fonction pour arrêter l'enregistrement et libérer les ressources
  const stopAllRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      try {
        mediaRecorder.current.stop();
      } catch (error) {
        console.error("Erreur lors de l'arrêt forcé du MediaRecorder:", error);
      }
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    mediaRecorder.current = null;
    isStoppingRef.current = false;
  }, []);
  
  const startRecording = useCallback(async () => {
    try {
      // Nettoyer les enregistrements précédents
      stopAllRecording();
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      
      setAudioBlob(null);
      audioChunks.current = [];
      setRecordingTime(0);
      isStoppingRef.current = false;
      
      console.log("Demande d'autorisation pour le microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      streamRef.current = stream;
      
      console.log("Autorisation accordée, création du MediaRecorder...");
      
      // Utiliser le format le plus compatible
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
          }
        }
      }
      
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        bitsPerSecond: 128000
      });
      
      mediaRecorder.current = recorder;
      
      recorder.ondataavailable = (event) => {
        console.log('📊 Données audio reçues:', event.data.size, 'octets');
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        console.log('🛑 Enregistrement arrêté, chunks collectés:', audioChunks.current.length);
        
        // Éviter le double traitement
        if (isStoppingRef.current) {
          console.log('⚠️ Traitement déjà en cours, éviter le doublon');
          return;
        }
        isStoppingRef.current = true;
        
        // Attendre un petit délai pour s'assurer que tous les chunks sont reçus
        setTimeout(() => {
          if (audioChunks.current.length > 0) {
            const blob = new Blob(audioChunks.current, { 
              type: mimeType || 'audio/webm' 
            });
            const url = URL.createObjectURL(blob);
            
            console.log("✅ Blob audio créé:", blob.size, "octets, type:", blob.type);
            setAudioBlob(blob);
            setAudioUrl(url);
          } else {
            console.warn("⚠️ Aucune donnée audio collectée");
            toast({
              title: "Erreur d'enregistrement",
              description: "Aucune donnée audio n'a été capturée. Veuillez réessayer.",
              variant: "destructive",
            });
          }
          
          setIsRecording(false);
          
          // Arrêter tous les tracks du stream
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        }, 100); // Petit délai pour recevoir les derniers chunks
      };
      
      recorder.onerror = (event) => {
        console.error('❌ Erreur MediaRecorder:', event);
        setIsRecording(false);
        isStoppingRef.current = false;
        toast({
          title: "Erreur d'enregistrement",
          description: "Une erreur est survenue pendant l'enregistrement.",
          variant: "destructive",
        });
      };
      
      // Démarrer l'enregistrement avec un intervalle plus court pour capturer plus de données
      recorder.start(250); // Capturer des données toutes les 250ms
      setIsRecording(true);
      
      console.log('🎙️ Enregistrement démarré avec succès');
      
    } catch (error) {
      console.error("Erreur lors de l'accès au microphone:", error);
      setIsRecording(false);
      setRecordingTime(0);
      isStoppingRef.current = false;
      
      let errorMessage = "Veuillez vérifier que vous avez accordé les permissions nécessaires à votre navigateur.";
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Permission refusée. Veuillez autoriser l'accès au microphone.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "Aucun microphone détecté. Vérifiez votre matériel.";
        }
      }
      
      toast({
        title: "Erreur d'accès au microphone",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [stopAllRecording, audioUrl]);
  
  const stopRecording = useCallback(async () => {
    if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
      try {
        console.log("🛑 Arrêt de l'enregistrement...");
        
        // Ajouter une petite attente avant d'arrêter pour s'assurer qu'on a des données
        await new Promise(resolve => setTimeout(resolve, 500));
        
        mediaRecorder.current.stop();
      } catch (error) {
        console.error("Erreur lors de l'arrêt de l'enregistrement:", error);
        
        // Nettoyage forcé en cas d'erreur
        stopAllRecording();
        setIsRecording(false);
        setRecordingTime(0);
        
        toast({
          title: "Erreur d'enregistrement",
          description: "Un problème est survenu lors de l'arrêt de l'enregistrement.",
          variant: "destructive",
        });
      }
    } else {
      // Si déjà arrêté, assurons-nous que l'état est cohérent
      console.log("⚠️ MediaRecorder déjà arrêté ou inactif");
      setIsRecording(false);
      setRecordingTime(0);
    }
  }, [stopAllRecording]);
  
  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
  }, [audioUrl]);
  
  return {
    isRecording,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    clearRecording,
    recordingTime
  };
};

export default useAudioRecorder;
