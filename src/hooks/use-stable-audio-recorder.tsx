
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
  
  // Utiliser des refs pour éviter les re-renders
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
    mediaRecorderState: mediaRecorderRef.current?.state
  });
  
  const cleanupResources = useCallback(() => {
    console.log('🧹 STABLE - Nettoyage des ressources');
    
    // Arrêter le timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Arrêter le stream
    if (streamRef.current) {
      console.log('🔇 STABLE - Arrêt des pistes audio');
      streamRef.current.getTracks().forEach(track => {
        console.log('🔇 STABLE - Arrêt piste:', track.label, track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    
    // Reset des flags
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
      audioChunksRef.current = [];
      setRecordingTime(0);
      isStoppingRef.current = false;
      
      // Configuration MediaRecorder optimisée
      const options: MediaRecorderOptions = {
        mimeType: 'audio/webm;codecs=opus',
        bitsPerSecond: 128000
      };
      
      // Vérifier si le type MIME est supporté
      if (!MediaRecorder.isTypeSupported(options.mimeType!)) {
        options.mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          delete options.mimeType; // Utiliser le type par défaut
        }
      }
      
      console.log('🎵 STABLE - Configuration MediaRecorder:', options);
      
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      
      recorder.ondataavailable = (event) => {
        console.log('📊 STABLE - Données audio reçues:', event.data.size, 'octets');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('📦 STABLE - Total chunks collectés:', audioChunksRef.current.length);
        }
      };
      
      recorder.onstop = () => {
        console.log('🛑 STABLE - === ÉVÉNEMENT STOP DÉCLENCHÉ ===');
        console.log('🛑 STABLE - Enregistrement arrêté, chunks collectés:', audioChunksRef.current.length);
        console.log('🛑 STABLE - État au moment du stop:', {
          isStoppingRef: isStoppingRef.current,
          isStartingRef: isStartingRef.current,
          isRecording,
          chunksLength: audioChunksRef.current.length
        });
        
        if (isStoppingRef.current) {
          console.log('⚠️ STABLE - Traitement déjà en cours');
          return;
        }
        isStoppingRef.current = true;
        
        setTimeout(() => {
          console.log('📊 STABLE - Chunks finaux disponibles:', audioChunksRef.current.length);
          
          if (audioChunksRef.current.length > 0) {
            const totalSize = audioChunksRef.current.reduce((total, chunk) => total + chunk.size, 0);
            console.log('📊 STABLE - Taille totale des chunks:', totalSize, 'octets');
            
            const blob = new Blob(audioChunksRef.current, { 
              type: options.mimeType || 'audio/webm' 
            });
            const url = URL.createObjectURL(blob);
            
            console.log("✅ STABLE - Blob audio créé:", blob.size, "octets, type:", blob.type);
            setAudioBlob(blob);
            setAudioUrl(url);
          } else {
            console.warn("⚠️ STABLE - Aucune donnée audio collectée");
            toast({
              title: "Erreur d'enregistrement",
              description: "Aucune donnée audio n'a été capturée. Veuillez réessayer.",
              variant: "destructive",
            });
          }
          
          setIsRecording(false);
          cleanupResources();
        }, 500);
      };
      
      recorder.onerror = (event) => {
        console.error('❌ STABLE - Erreur MediaRecorder:', event);
        setIsRecording(false);
        cleanupResources();
        toast({
          title: "Erreur d'enregistrement",
          description: "Une erreur est survenue pendant l'enregistrement.",
          variant: "destructive",
        });
      };
      
      recorder.onstart = () => {
        console.log('🎬 STABLE - Événement onstart déclenché');
        console.log('🎬 STABLE - État MediaRecorder:', recorder.state);
        isStartingRef.current = false;
        setIsRecording(true);
        
        // Démarrer le timer
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => {
            const newTime = prev + 1;
            console.log('⏱️ STABLE - Timer:', newTime, 'secondes');
            return newTime;
          });
        }, 1000);
        
        console.log('🎙️ STABLE - Enregistrement complètement démarré');
      };
      
      // Démarrer l'enregistrement avec timeslice plus court pour une meilleure capture
      console.log('🎬 STABLE - Démarrage de l\'enregistrement...');
      recorder.start(200); // Capturer des données toutes les 200ms
      
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
    console.log('🔍 STABLE - État isRecording:', isRecording);
    console.log('🔍 STABLE - isStoppingRef:', isStoppingRef.current);
    
    if (!mediaRecorderRef.current || !isRecording || isStoppingRef.current) {
      console.log('❌ STABLE - Conditions d\'arrêt non remplies');
      return;
    }
    
    if (mediaRecorderRef.current.state === 'recording') {
      try {
        console.log("🛑 STABLE - Arrêt de l'enregistrement en cours...");
        
        // Forcer la collecte des dernières données
        mediaRecorderRef.current.requestData();
        
        // Attendre un peu avant d'arrêter
        await new Promise(resolve => setTimeout(resolve, 150));
        
        console.log('🛑 STABLE - Appel de recorder.stop()');
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
