
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

export const useVoiceRecorder = (): AudioRecorderHook => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const isInitializingRef = useRef<boolean>(false);
  const isUnmountingRef = useRef<boolean>(false);
  
  console.log('🎤 useVoiceRecorder render - État:', {
    isRecording,
    hasBlob: !!audioBlob,
    hasUrl: !!audioUrl,
    isProcessing: isProcessingRef.current,
    isInitializing: isInitializingRef.current,
    isUnmounting: isUnmountingRef.current
  });
  
  // Nettoyer les ressources lors du démontage
  useEffect(() => {
    return () => {
      console.log('🧹 useVoiceRecorder - Démontage du hook détecté');
      
      // Marquer comme en cours de démontage
      isUnmountingRef.current = true;
      
      // Si on est en train d'enregistrer, NE PAS nettoyer immédiatement
      if (isRecording && mediaRecorder.current && mediaRecorder.current.state === 'recording') {
        console.log('⚠️ Démontage pendant l\'enregistrement - report du nettoyage');
        
        // Essayer de finir l'enregistrement proprement
        try {
          mediaRecorder.current.requestData();
          setTimeout(() => {
            if (mediaRecorder.current && mediaRecorder.current.state === 'recording') {
              mediaRecorder.current.stop();
            }
          }, 100);
        } catch (error) {
          console.error('Erreur lors de l\'arrêt d\'urgence:', error);
        }
        
        return; // Ne pas nettoyer maintenant
      }
      
      // Nettoyage normal si pas d'enregistrement en cours
      cleanupResources();
      
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, []);
  
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
  
  // Fonction pour nettoyer les ressources
  const cleanupResources = useCallback(() => {
    console.log('🧹 Nettoyage des ressources');
    
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
    
    isProcessingRef.current = false;
    isInitializingRef.current = false;
    isUnmountingRef.current = false;
  }, []);
  
  const startRecording = useCallback(async () => {
    console.log('🎙️ === DÉBUT PROCESSUS D\'ENREGISTREMENT ===');
    
    // Protection contre les appels simultanés
    if (isInitializingRef.current) {
      console.log('⚠️ Enregistrement déjà en cours d\'initialisation');
      return;
    }
    
    if (isRecording) {
      console.log('⚠️ Enregistrement déjà en cours');
      return;
    }
    
    isInitializingRef.current = true;
    isUnmountingRef.current = false; // Réinitialiser le flag
    
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
      
      console.log("✅ Autorisation accordée, création du MediaRecorder...");
      
      // Nettoyer les anciennes données
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      audioChunks.current = [];
      setRecordingTime(0);
      isProcessingRef.current = false;
      
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
        if (event.data.size > 0 && !isUnmountingRef.current) {
          audioChunks.current.push(event.data);
          console.log('📦 Total chunks collectés:', audioChunks.current.length);
        }
      };
      
      recorder.onstop = () => {
        console.log('🛑 === ÉVÉNEMENT STOP DÉCLENCHÉ ===');
        console.log('🛑 Enregistrement arrêté, chunks collectés:', audioChunks.current.length);
        console.log('🔍 État isUnmounting:', isUnmountingRef.current);
        
        // Éviter le double traitement
        if (isProcessingRef.current) {
          console.log('⚠️ Traitement déjà en cours, éviter le doublon');
          return;
        }
        isProcessingRef.current = true;
        
        // Attendre un délai plus long pour s'assurer que tous les chunks sont reçus
        console.log('⏳ Attente de 1000ms pour collecter les derniers chunks...');
        setTimeout(() => {
          console.log('📊 Chunks finaux disponibles:', audioChunks.current.length);
          
          if (audioChunks.current.length > 0) {
            const totalSize = audioChunks.current.reduce((total, chunk) => total + chunk.size, 0);
            console.log('📊 Taille totale des chunks:', totalSize, 'octets');
            
            if (totalSize > 0) {
              const blob = new Blob(audioChunks.current, { 
                type: mimeType || 'audio/webm' 
              });
              const url = URL.createObjectURL(blob);
              
              console.log("✅ Blob audio créé:", blob.size, "octets, type:", blob.type);
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
          
          // Arrêter les tracks du stream seulement maintenant
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
          
          isProcessingRef.current = false;
        }, 1000); // Délai plus long pour laisser le temps aux chunks
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
      
      // Démarrer l'enregistrement avec un intervalle plus grand
      console.log('🎬 Démarrage de l\'enregistrement...');
      recorder.start(500); // Capturer des données toutes les 500ms au lieu de 100ms
      setIsRecording(true);
      isInitializingRef.current = false;
      
      console.log('🎙️ Enregistrement démarré avec succès');
      console.log('📊 État du MediaRecorder:', recorder.state);
      
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
    console.log('🔍 État isRecording:', isRecording);
    console.log('🔍 Temps d\'enregistrement:', recordingTime);
    
    if (!mediaRecorder.current || !isRecording) {
      console.log('❌ Aucun enregistrement actif à arrêter');
      return;
    }
    
    // Vérifier la durée minimale
    if (recordingTime < 2) {
      console.log('⚠️ Enregistrement trop court:', recordingTime, 'secondes');
      toast({
        title: "Enregistrement trop court",
        description: "Veuillez enregistrer pendant au moins 2 secondes.",
        variant: "destructive",
      });
      // Continuer l'enregistrement au lieu de l'arrêter
      return;
    }
    
    if (mediaRecorder.current.state === 'recording') {
      try {
        console.log("🛑 Arrêt de l'enregistrement en cours...");
        
        // Forcer la collecte des dernières données avant d'arrêter
        mediaRecorder.current.requestData();
        
        // Attendre un peu avant d'arrêter pour laisser le temps aux données
        await new Promise(resolve => setTimeout(resolve, 300));
        
        console.log('🛑 Appel de recorder.stop()');
        mediaRecorder.current.stop();
      } catch (error) {
        console.error("Erreur lors de l'arrêt de l'enregistrement:", error);
        
        // Nettoyage forcé en cas d'erreur
        cleanupResources();
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
  }, [isRecording, recordingTime, cleanupResources]);
  
  const clearRecording = useCallback(() => {
    console.log('🗑️ Suppression de l\'enregistrement');
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

export default useVoiceRecorder;
