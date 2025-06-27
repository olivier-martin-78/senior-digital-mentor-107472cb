
import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface AdaptiveAudioRecorderHook {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => void;
  recordingTime: number;
  recordingFormat: string;
}

// Détecter la plateforme et choisir le format optimal
const getOptimalAudioFormat = (): { mimeType: string; extension: string } => {
  const isIPad = /iPad/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  // Sur iPad ou Safari, privilégier MP3 pour la compatibilité
  if (isIPad || isSafari) {
    // Tester la disponibilité des formats
    if (MediaRecorder.isTypeSupported('audio/mp4')) {
      return { mimeType: 'audio/mp4', extension: 'mp4' };
    }
    if (MediaRecorder.isTypeSupported('audio/mpeg')) {
      return { mimeType: 'audio/mpeg', extension: 'mp3' };
    }
  }
  
  // Pour les autres plateformes, utiliser WebM (meilleure qualité/compression)
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    return { mimeType: 'audio/webm;codecs=opus', extension: 'webm' };
  }
  if (MediaRecorder.isTypeSupported('audio/webm')) {
    return { mimeType: 'audio/webm', extension: 'webm' };
  }
  
  // Fallback ultime
  return { mimeType: '', extension: 'webm' };
};

export const useAdaptiveVoiceRecorder = (): AdaptiveAudioRecorderHook => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const [recordingFormat, setRecordingFormat] = useState<string>('');
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);
  
  console.log('🎤 useAdaptiveVoiceRecorder render - État:', {
    isRecording,
    hasBlob: !!audioBlob,
    hasUrl: !!audioUrl,
    recordingFormat,
    isProcessing: isProcessingRef.current,
    isInitializing: isInitializingRef.current
  });
  
  // Nettoyer les ressources lors du démontage
  useEffect(() => {
    return () => {
      console.log('🧹 useAdaptiveVoiceRecorder - Démontage du hook détecté');
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  
  // Gestion du timer d'enregistrement
  useEffect(() => {
    if (isRecording) {
      console.log('⏱️ Démarrage du timer d\'enregistrement');
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        console.log('⏱️ Arrêt du timer d\'enregistrement');
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
  
  const startRecording = useCallback(async () => {
    console.log('🎙️ === DÉBUT PROCESSUS D\'ENREGISTREMENT ADAPTATIF ===');
    
    if (isInitializingRef.current || isRecording) {
      console.log('⚠️ Enregistrement déjà en cours');
      return;
    }
    
    isInitializingRef.current = true;
    
    try {
      console.log("🎤 Demande d'autorisation pour le microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      streamRef.current = stream;
      
      console.log("✅ Autorisation accordée, détection du format optimal...");
      
      // Détecter le format optimal pour cette plateforme
      const optimalFormat = getOptimalAudioFormat();
      console.log('🎵 Format optimal détecté:', optimalFormat);
      setRecordingFormat(optimalFormat.extension);
      
      // Nettoyer les anciennes données
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      audioChunks.current = [];
      setRecordingTime(0);
      isProcessingRef.current = false;
      
      // Créer le MediaRecorder avec le format optimal
      const recorderOptions: MediaRecorderOptions = {
        bitsPerSecond: 128000
      };
      
      if (optimalFormat.mimeType) {
        recorderOptions.mimeType = optimalFormat.mimeType;
      }
      
      console.log('🎵 Configuration MediaRecorder:', recorderOptions);
      
      const recorder = new MediaRecorder(stream, recorderOptions);
      mediaRecorder.current = recorder;
      
      recorder.ondataavailable = (event) => {
        console.log('📊 Données audio reçues:', event.data.size, 'octets, format:', optimalFormat.extension);
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
          console.log('📦 Total chunks collectés:', audioChunks.current.length);
        }
      };
      
      recorder.onstop = () => {
        console.log('🛑 === ÉVÉNEMENT STOP DÉCLENCHÉ ===');
        console.log('🛑 Enregistrement arrêté, chunks collectés:', audioChunks.current.length);
        
        if (isProcessingRef.current) {
          console.log('⚠️ Traitement déjà en cours, éviter le doublon');
          return;
        }
        isProcessingRef.current = true;
        
        setTimeout(() => {
          console.log('📊 Chunks finaux disponibles:', audioChunks.current.length);
          
          if (audioChunks.current.length > 0) {
            const totalSize = audioChunks.current.reduce((total, chunk) => total + chunk.size, 0);
            console.log('📊 Taille totale des chunks:', totalSize, 'octets');
            
            if (totalSize > 0) {
              const blob = new Blob(audioChunks.current, { 
                type: optimalFormat.mimeType || `audio/${optimalFormat.extension}` 
              });
              const url = URL.createObjectURL(blob);
              
              console.log("✅ Blob audio créé:", {
                size: blob.size,
                type: blob.type,
                format: optimalFormat.extension
              });
              
              setAudioBlob(blob);
              setAudioUrl(url);
            } else {
              console.warn("⚠️ Chunks vides détectés");
              toast({
                title: "Enregistrement trop court",
                description: "Veuillez enregistrer pendant au moins 2 secondes.",
                variant: "destructive",
              });
            }
          } else {
            console.warn("⚠️ Aucune donnée audio collectée");
            toast({
              title: "Erreur d'enregistrement",
              description: "Aucune donnée audio n'a été capturée. Veuillez réessayer en parlant plus fort.",
              variant: "destructive",
            });
          }
          
          setIsRecording(false);
          isInitializingRef.current = false;
          
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          
          isProcessingRef.current = false;
        }, 1000);
      };
      
      recorder.onerror = (event) => {
        console.error('❌ Erreur MediaRecorder:', event);
        setIsRecording(false);
        isInitializingRef.current = false;
        isProcessingRef.current = false;
        toast({
          title: "Erreur d'enregistrement",
          description: "Une erreur est survenue pendant l'enregistrement.",
          variant: "destructive",
        });
      };
      
      console.log('🎬 Démarrage de l\'enregistrement...');
      recorder.start(500);
      setIsRecording(true);
      isInitializingRef.current = false;
      
      console.log('🎙️ Enregistrement démarré avec succès, format:', optimalFormat.extension);
      
    } catch (error) {
      console.error("❌ Erreur lors de l'accès au microphone:", error);
      setIsRecording(false);
      setRecordingTime(0);
      isInitializingRef.current = false;
      isProcessingRef.current = false;
      
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
  }, [audioUrl]);
  
  const stopRecording = useCallback(async () => {
    console.log('🛑 === DEMANDE D\'ARRÊT MANUEL ===');
    console.log('🔍 État MediaRecorder:', mediaRecorder.current?.state);
    console.log('🔍 Temps d\'enregistrement:', recordingTime);
    
    if (!mediaRecorder.current || !isRecording) {
      console.log('❌ Aucun enregistrement actif à arrêter');
      return;
    }
    
    if (recordingTime < 2) {
      console.log('⚠️ Enregistrement trop court:', recordingTime, 'secondes');
      toast({
        title: "Enregistrement trop court",
        description: "Veuillez enregistrer pendant au moins 2 secondes.",
        variant: "destructive",
      });
      return;
    }
    
    if (mediaRecorder.current.state === 'recording') {
      try {
        console.log("🛑 Arrêt de l'enregistrement en cours...");
        mediaRecorder.current.requestData();
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('🛑 Appel de recorder.stop()');
        mediaRecorder.current.stop();
      } catch (error) {
        console.error("Erreur lors de l'arrêt de l'enregistrement:", error);
        setIsRecording(false);
        setRecordingTime(0);
        toast({
          title: "Erreur d'enregistrement",
          description: "Un problème est survenu lors de l'arrêt de l'enregistrement.",
          variant: "destructive",
        });
      }
    }
  }, [isRecording, recordingTime]);
  
  const clearRecording = useCallback(() => {
    console.log('🗑️ Suppression de l\'enregistrement');
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingFormat('');
  }, [audioUrl]);
  
  return {
    isRecording,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    clearRecording,
    recordingTime,
    recordingFormat
  };
};

export default useAdaptiveVoiceRecorder;
