
import { useState, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface StableAudioRecorderHook {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => void;
  recordingTime: number;
}

export const useStableAudioRecorder = (): StableAudioRecorderHook => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isStoppingRef = useRef<boolean>(false);
  const isStartingRef = useRef<boolean>(false);
  
  console.log('🎤 STABLE - useStableAudioRecorder render - État:', {
    isRecording,
    hasBlob: !!audioBlob,
    hasUrl: !!audioUrl,
    recordingTime,
    isStoppingRef: isStoppingRef.current,
    isStartingRef: isStartingRef.current,
    hasMediaRecorder: !!mediaRecorderRef.current,
    mediaRecorderState: mediaRecorderRef.current?.state,
    chunksLength: audioChunksRef.current.length
  });
  
  const cleanupResources = useCallback(() => {
    console.log('🧹 STABLE - Nettoyage des ressources');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (streamRef.current) {
      console.log('🔇 STABLE - Arrêt des pistes audio');
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    isStoppingRef.current = false;
    isStartingRef.current = false;
  }, []);
  
  const startRecording = useCallback(async () => {
    console.log('🎙️ STABLE - === DÉBUT PROCESSUS D\'ENREGISTREMENT ===');
    console.log('🎙️ STABLE - État avant démarrage:', {
      isRecording,
      isStarting: isStartingRef.current,
      isStopping: isStoppingRef.current,
      hasMediaRecorder: !!mediaRecorderRef.current,
      mediaRecorderState: mediaRecorderRef.current?.state
    });
    
    if (isRecording || isStartingRef.current) {
      console.log('⚠️ STABLE - Enregistrement déjà en cours ou en train de démarrer');
      return;
    }
    
    isStartingRef.current = true;
    
    try {
      console.log("🎤 STABLE - Demande d'autorisation pour le microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;
      console.log("✅ STABLE - Autorisation accordée, création du MediaRecorder...");
      
      // Nettoyer les anciennes données
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      
      // Vider les chunks AVANT de commencer
      console.log('🗑️ STABLE - AVANT vidage chunks, longueur:', audioChunksRef.current.length);
      audioChunksRef.current = [];
      console.log('🗑️ STABLE - APRÈS vidage chunks, longueur:', audioChunksRef.current.length);
      
      setRecordingTime(0);
      isStoppingRef.current = false;
      
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus',
        bitsPerSecond: 128000
      };
      
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options.mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          delete options.mimeType;
        }
      }
      
      console.log('🎵 STABLE - Configuration MediaRecorder:', options);
      
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      
      // LOGS DÉTAILLÉS pour traquer les événements MediaRecorder
      recorder.ondataavailable = (event) => {
        console.log('📊 STABLE - Données audio reçues:', event.data.size, 'octets');
        console.log('📊 STABLE - État du recorder dans ondataavailable:', recorder.state);
        if (event.data.size > 0) {
          console.log('📦 STABLE - AVANT ajout chunk, longueur:', audioChunksRef.current.length);
          audioChunksRef.current.push(event.data);
          console.log('📦 STABLE - APRÈS ajout chunk, longueur:', audioChunksRef.current.length);
        }
      };
      
      recorder.onstop = () => {
        console.log('🛑 STABLE - === ÉVÉNEMENT STOP DÉCLENCHÉ ===');
        console.log('🛑 STABLE - Raison de l\'arrêt - État recorder:', recorder.state);
        console.log('🛑 STABLE - isStoppingRef:', isStoppingRef.current);
        console.log('🛑 STABLE - Chunks collectés:', audioChunksRef.current.length);
        
        // NOUVEAU: Mettre isRecording à false AVANT de créer le blob
        setIsRecording(false);
        
        if (audioChunksRef.current.length > 0) {
          const totalSize = audioChunksRef.current.reduce((total, chunk) => total + chunk.size, 0);
          console.log('📊 STABLE - Taille totale des chunks:', totalSize, 'octets');
          
          const blob = new Blob([...audioChunksRef.current], { 
            type: options.mimeType || 'audio/webm' 
          });
          
          console.log("✅ STABLE - Blob audio créé:", blob.size, "octets, type:", blob.type);
          
          const url = URL.createObjectURL(blob);
          console.log("✅ STABLE - URL générée:", url);
          
          setAudioBlob(blob);
          setAudioUrl(url);
        } else {
          console.warn("⚠️ STABLE - Aucune donnée audio collectée");
        }
        
        cleanupResources();
      };
      
      // CORRECTION: Utiliser le bon type d'événement pour les erreurs MediaRecorder
      recorder.onerror = (event: Event) => {
        console.error('❌ STABLE - ERREUR MediaRecorder détectée:', event);
        console.error('❌ STABLE - Type d\'événement:', event.type);
        console.error('❌ STABLE - État du recorder lors de l\'erreur:', recorder.state);
        console.error('❌ STABLE - Stack trace:', new Error().stack);
        
        // Vérifier si l'événement a une propriété error (MediaRecorderErrorEvent)
        const errorEvent = event as any;
        const errorMessage = errorEvent.error ? errorEvent.error.toString() : 'Erreur inconnue';
        console.error('❌ STABLE - Message d\'erreur:', errorMessage);
        
        setIsRecording(false);
        cleanupResources();
        
        toast({
          title: "Erreur d'enregistrement",
          description: `Erreur MediaRecorder: ${errorMessage}`,
          variant: "destructive",
        });
      };
      
      recorder.onstart = () => {
        console.log('🎬 STABLE - Événement onstart déclenché');
        console.log('🎬 STABLE - État du recorder dans onstart:', recorder.state);
        isStartingRef.current = false;
        setIsRecording(true);
        
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
        
        console.log('🎙️ STABLE - Enregistrement complètement démarré');
      };
      
      // NOUVEAU: Log de tous les événements possibles
      recorder.onpause = () => {
        console.log('⏸️ STABLE - Événement onpause déclenché');
        console.log('⏸️ STABLE - État du recorder:', recorder.state);
      };
      
      recorder.onresume = () => {
        console.log('▶️ STABLE - Événement onresume déclenché');
        console.log('▶️ STABLE - État du recorder:', recorder.state);
      };
      
      // NOUVEAU: Surveiller l'état du stream avec logs détaillés
      stream.getTracks().forEach((track, index) => {
        console.log(`🎧 STABLE - Initialisation track ${index}:`, {
          label: track.label,
          kind: track.kind,
          readyState: track.readyState,
          enabled: track.enabled,
          muted: track.muted
        });
        
        track.onended = () => {
          console.log(`🔇 STABLE - ⚠️ PISTE AUDIO ${index} TERMINÉE !`);
          console.log('🔇 STABLE - Track label:', track.label);
          console.log('🔇 STABLE - Track state:', track.readyState);
          console.log('🔇 STABLE - Ceci CAUSE l\'arrêt automatique de l\'enregistrement');
          console.log('🔇 STABLE - État MediaRecorder au moment de l\'arrêt track:', recorder.state);
        };
        
        track.onmute = () => {
          console.log(`🔇 STABLE - PISTE AUDIO ${index} MUTED !`);
          console.log('🔇 STABLE - État MediaRecorder:', recorder.state);
        };
        
        track.onunmute = () => {
          console.log(`🔊 STABLE - PISTE AUDIO ${index} UNMUTED !`);
          console.log('🔊 STABLE - État MediaRecorder:', recorder.state);
        };
      });
      
      console.log('🎬 STABLE - Démarrage de l\'enregistrement...');
      recorder.start(1000);
      console.log('🎙️ STABLE - start() appelé, attente de l\'événement onstart...');
      
    } catch (error) {
      console.error("❌ STABLE - Erreur lors de l'accès au microphone:", error);
      setIsRecording(false);
      setRecordingTime(0);
      isStartingRef.current = false;
      cleanupResources();
      
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
  }, [isRecording, audioUrl, cleanupResources]);
  
  const stopRecording = useCallback(async () => {
    console.log('🛑 STABLE - === DEMANDE D\'ARRÊT MANUEL ===');
    console.log('🔍 STABLE - État MediaRecorder:', mediaRecorderRef.current?.state);
    console.log('🔍 STABLE - Chunks avant arrêt:', audioChunksRef.current.length);
    
    if (!mediaRecorderRef.current || !isRecording || isStoppingRef.current) {
      console.log('❌ STABLE - Conditions d\'arrêt non remplies');
      return;
    }
    
    if (mediaRecorderRef.current.state === 'recording') {
      try {
        console.log("🛑 STABLE - Arrêt MANUEL de l'enregistrement en cours...");
        isStoppingRef.current = true;
        
        mediaRecorderRef.current.requestData();
        
        console.log('🛑 STABLE - Appel MANUEL de recorder.stop()');
        mediaRecorderRef.current.stop();
      } catch (error) {
        console.error("❌ STABLE - Erreur lors de l'arrêt:", error);
        setIsRecording(false);
        setRecordingTime(0);
        cleanupResources();
      }
    }
  }, [isRecording, cleanupResources]);
  
  const clearRecording = useCallback(() => {
    console.log('🗑️ STABLE - Suppression de l\'enregistrement');
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    
    audioChunksRef.current = [];
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

export default useStableAudioRecorder;
