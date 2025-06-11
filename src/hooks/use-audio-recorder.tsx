
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
  const isProcessingRef = useRef<boolean>(false);
  
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
    console.log('🧹 Nettoyage de toutes les ressources d\'enregistrement');
    
    if (mediaRecorder.current && mediaRecorder.current.state !== 'inactive') {
      try {
        console.log('🛑 Arrêt forcé du MediaRecorder, état:', mediaRecorder.current.state);
        mediaRecorder.current.stop();
      } catch (error) {
        console.error("Erreur lors de l'arrêt forcé du MediaRecorder:", error);
      }
    }
    
    if (streamRef.current) {
      console.log('🔇 Arrêt des pistes audio');
      streamRef.current.getTracks().forEach(track => {
        console.log('🔇 Arrêt piste:', track.label, track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    mediaRecorder.current = null;
    isStoppingRef.current = false;
    isProcessingRef.current = false;
  }, []);
  
  const startRecording = useCallback(async () => {
    try {
      console.log('🎙️ === DÉBUT PROCESSUS D\'ENREGISTREMENT ===');
      
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
      isProcessingRef.current = false;
      
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
      
      console.log('🎵 Type MIME sélectionné:', mimeType || 'défaut');
      
      const recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        bitsPerSecond: 128000
      });
      
      mediaRecorder.current = recorder;
      
      recorder.ondataavailable = (event) => {
        console.log('📊 Données audio reçues:', event.data.size, 'octets');
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
          console.log('📦 Total chunks collectés:', audioChunks.current.length);
        }
      };
      
      recorder.onstop = () => {
        console.log('🛑 === ÉVÉNEMENT STOP DÉCLENCHÉ ===');
        console.log('🛑 Enregistrement arrêté, chunks collectés:', audioChunks.current.length);
        console.log('🔍 État isProcessingRef:', isProcessingRef.current);
        console.log('🔍 État isStoppingRef:', isStoppingRef.current);
        
        // Éviter le double traitement
        if (isProcessingRef.current) {
          console.log('⚠️ Traitement déjà en cours, éviter le doublon');
          return;
        }
        isProcessingRef.current = true;
        
        // Attendre un délai pour s'assurer que tous les chunks sont reçus
        console.log('⏳ Attente de 200ms pour collecter les derniers chunks...');
        setTimeout(() => {
          console.log('📊 Chunks finaux disponibles:', audioChunks.current.length);
          
          if (audioChunks.current.length > 0) {
            const totalSize = audioChunks.current.reduce((total, chunk) => total + chunk.size, 0);
            console.log('📊 Taille totale des chunks:', totalSize, 'octets');
            
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
          
          isProcessingRef.current = false;
        }, 200); // Délai augmenté pour être sûr
      };
      
      recorder.onerror = (event) => {
        console.error('❌ Erreur MediaRecorder:', event);
        setIsRecording(false);
        isStoppingRef.current = false;
        isProcessingRef.current = false;
        toast({
          title: "Erreur d'enregistrement",
          description: "Une erreur est survenue pendant l'enregistrement.",
          variant: "destructive",
        });
      };
      
      recorder.onstart = () => {
        console.log('🎬 Événement onstart déclenché');
      };
      
      recorder.onpause = () => {
        console.log('⏸️ Événement onpause déclenché');
      };
      
      recorder.onresume = () => {
        console.log('▶️ Événement onresume déclenché');
      };
      
      // Démarrer l'enregistrement avec un intervalle pour capturer des données
      console.log('🎬 Démarrage de l\'enregistrement...');
      recorder.start(500); // Capturer des données toutes les 500ms
      setIsRecording(true);
      
      console.log('🎙️ Enregistrement démarré avec succès');
      console.log('📊 État du MediaRecorder:', recorder.state);
      
    } catch (error) {
      console.error("❌ Erreur lors de l'accès au microphone:", error);
      setIsRecording(false);
      setRecordingTime(0);
      isStoppingRef.current = false;
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
  }, [stopAllRecording, audioUrl]);
  
  const stopRecording = useCallback(async () => {
    console.log('🛑 === DEMANDE D\'ARRÊT MANUEL ===');
    console.log('🔍 État MediaRecorder:', mediaRecorder.current?.state);
    console.log('🔍 État isStoppingRef:', isStoppingRef.current);
    
    if (!mediaRecorder.current) {
      console.log('❌ Aucun MediaRecorder actif');
      return;
    }
    
    if (mediaRecorder.current.state === 'recording') {
      try {
        console.log("🛑 Arrêt de l'enregistrement en cours...");
        isStoppingRef.current = true;
        
        // Forcer la collecte des dernières données
        mediaRecorder.current.requestData();
        
        // Attendre un peu avant d'arrêter
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log('🛑 Appel de recorder.stop()');
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
      console.log("⚠️ MediaRecorder déjà arrêté ou inactif, état:", mediaRecorder.current.state);
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
