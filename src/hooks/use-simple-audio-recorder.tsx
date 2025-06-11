
import { useState, useRef, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface SimpleAudioRecorderHook {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => void;
  recordingTime: number;
}

export const useSimpleAudioRecorder = (): SimpleAudioRecorderHook => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const healthCheckRef = useRef<NodeJS.Timeout | null>(null);
  
  console.log('🎤 SIMPLE - useSimpleAudioRecorder render:', {
    isRecording,
    hasBlob: !!audioBlob,
    hasUrl: !!audioUrl,
    recordingTime,
    hasMediaRecorder: !!mediaRecorderRef.current,
    mediaRecorderState: mediaRecorderRef.current?.state,
    chunksLength: audioChunksRef.current.length
  });
  
  const cleanupResources = useCallback(() => {
    console.log('🧹 SIMPLE - Nettoyage des ressources');
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (healthCheckRef.current) {
      clearInterval(healthCheckRef.current);
      healthCheckRef.current = null;
    }
    
    if (streamRef.current) {
      console.log('🔇 SIMPLE - Arrêt des pistes audio');
      streamRef.current.getTracks().forEach(track => {
        console.log('🔇 SIMPLE - Arrêt de la piste:', track.label, track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    
    mediaRecorderRef.current = null;
  }, []);
  
  const startRecording = useCallback(async () => {
    console.log('🎙️ SIMPLE - === DÉBUT ENREGISTREMENT ===');
    
    if (isRecording) {
      console.log('⚠️ SIMPLE - Enregistrement déjà en cours');
      return;
    }
    
    try {
      console.log("🎤 SIMPLE - Demande d'autorisation microphone...");
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;
      console.log("✅ SIMPLE - Autorisation accordée, création MediaRecorder...");
      
      // Nettoyer les données précédentes
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      audioChunksRef.current = [];
      setRecordingTime(0);
      
      // Configuration MediaRecorder
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
      
      console.log('🎵 SIMPLE - Configuration MediaRecorder:', options);
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      
      // === ÉVÉNEMENTS MEDIARECORDER AVEC LOGS EXHAUSTIFS ===
      recorder.ondataavailable = (event) => {
        console.log('📊 SIMPLE - ondataavailable:', {
          dataSize: event.data.size,
          recorderState: recorder.state,
          timestamp: new Date().toISOString(),
          streamActive: streamRef.current?.active,
          tracksLength: streamRef.current?.getTracks().length
        });
        
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('📦 SIMPLE - Chunk ajouté, total:', audioChunksRef.current.length);
        } else {
          console.warn('⚠️ SIMPLE - Chunk vide reçu !');
        }
      };
      
      recorder.onstop = () => {
        console.log('🛑 SIMPLE - === ÉVÉNEMENT ONSTOP ===');
        console.log('🛑 SIMPLE - Chunks collectés:', audioChunksRef.current.length);
        console.log('🛑 SIMPLE - État recorder:', recorder.state);
        console.log('🛑 SIMPLE - Stream actif:', streamRef.current?.active);
        console.log('🛑 SIMPLE - Timestamp:', new Date().toISOString());
        
        setIsRecording(false);
        
        if (audioChunksRef.current.length > 0) {
          const totalSize = audioChunksRef.current.reduce((total, chunk) => total + chunk.size, 0);
          console.log('📊 SIMPLE - Taille totale chunks:', totalSize, 'octets');
          
          const blob = new Blob([...audioChunksRef.current], { 
            type: options.mimeType || 'audio/webm' 
          });
          
          console.log("✅ SIMPLE - Blob créé:", blob.size, "octets, type:", blob.type);
          
          const url = URL.createObjectURL(blob);
          console.log("✅ SIMPLE - URL générée:", url);
          
          setAudioBlob(blob);
          setAudioUrl(url);
        } else {
          console.warn("⚠️ SIMPLE - Aucun chunk collecté");
        }
        
        cleanupResources();
      };
      
      recorder.onerror = (event: Event) => {
        console.error('❌ SIMPLE - === ERREUR MEDIARECORDER ===');
        console.error('❌ SIMPLE - Événement:', event);
        console.error('❌ SIMPLE - Type:', event.type);
        console.error('❌ SIMPLE - État recorder:', recorder.state);
        console.error('❌ SIMPLE - Timestamp:', new Date().toISOString());
        
        const errorEvent = event as any;
        const errorMessage = errorEvent.error ? errorEvent.error.toString() : 'Erreur MediaRecorder inconnue';
        console.error('❌ SIMPLE - Message erreur:', errorMessage);
        
        setIsRecording(false);
        cleanupResources();
        
        toast({
          title: "Erreur d'enregistrement",
          description: errorMessage,
          variant: "destructive",
        });
      };
      
      recorder.onstart = () => {
        console.log('🎬 SIMPLE - === ÉVÉNEMENT ONSTART ===');
        console.log('🎬 SIMPLE - État recorder:', recorder.state);
        console.log('🎬 SIMPLE - Timestamp:', new Date().toISOString());
        setIsRecording(true);
        
        // Démarrer le timer
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
        
        // NOUVEAU : Health check toutes les 5 secondes pour détecter les arrêts silencieux
        healthCheckRef.current = setInterval(() => {
          const currentState = recorder.state;
          const streamActive = streamRef.current?.active;
          const tracksActive = streamRef.current?.getTracks().every(track => track.readyState === 'live');
          
          console.log('🔍 SIMPLE - Health check:', {
            recorderState: currentState,
            streamActive,
            tracksActive,
            chunksCount: audioChunksRef.current.length,
            timestamp: new Date().toISOString()
          });
          
          // Si le recorder n'est plus en recording mais qu'on pense qu'il l'est
          if (currentState !== 'recording' && isRecording) {
            console.error('💀 SIMPLE - ARRÊT SILENCIEUX DÉTECTÉ !');
            console.error('💀 SIMPLE - État attendu: recording, état réel:', currentState);
            
            // Déclencher manuellement l'arrêt si nécessaire
            if (currentState === 'inactive') {
              console.log('💀 SIMPLE - Déclenchement manuel de onstop...');
              recorder.onstop?.call(recorder, new Event('stop'));
            }
          }
          
          // Vérifier l'état des tracks
          if (!streamActive || !tracksActive) {
            console.error('💀 SIMPLE - STREAM/TRACKS INACTIFS DÉTECTÉS !');
            console.error('💀 SIMPLE - streamActive:', streamActive, 'tracksActive:', tracksActive);
          }
          
        }, 5000);
        
        console.log('🎙️ SIMPLE - Enregistrement démarré avec succès');
      };
      
      recorder.onpause = () => {
        console.log('⏸️ SIMPLE - Événement onpause');
      };
      
      recorder.onresume = () => {
        console.log('▶️ SIMPLE - Événement onresume');
      };
      
      // === SURVEILLANCE DES PISTES AUDIO AVEC LOGS EXHAUSTIFS ===
      stream.getTracks().forEach((track, index) => {
        console.log(`🎧 SIMPLE - Track ${index} initialisée:`, {
          label: track.label,
          kind: track.kind,
          readyState: track.readyState,
          enabled: track.enabled,
          muted: track.muted,
          timestamp: new Date().toISOString()
        });
        
        track.onended = () => {
          console.error(`🔇 SIMPLE - ⚠️ TRACK ${index} TERMINÉE !`);
          console.error('🔇 SIMPLE - Ceci CAUSE l\'arrêt automatique !');
          console.error('🔇 SIMPLE - Label:', track.label);
          console.error('🔇 SIMPLE - État:', track.readyState);
          console.error('🔇 SIMPLE - MediaRecorder état:', recorder.state);
          console.error('🔇 SIMPLE - Timestamp:', new Date().toISOString());
          
          // Tentative de récupération
          if (recorder.state === 'recording') {
            console.log('🔇 SIMPLE - Tentative d\'arrêt propre du recorder...');
            try {
              recorder.requestData();
              recorder.stop();
            } catch (e) {
              console.error('🔇 SIMPLE - Erreur lors de l\'arrêt:', e);
            }
          }
        };
        
        track.onmute = () => {
          console.warn(`🔇 SIMPLE - Track ${index} MUTED !`);
          console.warn('🔇 SIMPLE - MediaRecorder état:', recorder.state);
        };
        
        track.onunmute = () => {
          console.log(`🔊 SIMPLE - Track ${index} UNMUTED !`);
        };
      });
      
      console.log('🎬 SIMPLE - Démarrage enregistrement...');
      recorder.start(1000); // Collecter données toutes les secondes
      console.log('🎙️ SIMPLE - start() appelé');
      
    } catch (error) {
      console.error("❌ SIMPLE - Erreur accès microphone:", error);
      setIsRecording(false);
      setRecordingTime(0);
      cleanupResources();
      
      let errorMessage = "Erreur d'accès au microphone";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Permission refusée pour le microphone";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "Aucun microphone détecté";
        }
      }
      
      toast({
        title: "Erreur microphone",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [isRecording, audioUrl, cleanupResources]);
  
  const stopRecording = useCallback(async () => {
    console.log('🛑 SIMPLE - === DEMANDE ARRÊT MANUEL ===');
    console.log('🛑 SIMPLE - État MediaRecorder:', mediaRecorderRef.current?.state);
    console.log('🛑 SIMPLE - Chunks avant arrêt:', audioChunksRef.current.length);
    console.log('🛑 SIMPLE - Timestamp:', new Date().toISOString());
    
    if (!mediaRecorderRef.current || !isRecording) {
      console.log('❌ SIMPLE - Impossible d\'arrêter');
      return;
    }
    
    if (mediaRecorderRef.current.state === 'recording') {
      try {
        console.log("🛑 SIMPLE - Arrêt manuel en cours...");
        mediaRecorderRef.current.requestData(); // Récupérer dernières données
        mediaRecorderRef.current.stop();
        console.log('🛑 SIMPLE - stop() appelé');
      } catch (error) {
        console.error("❌ SIMPLE - Erreur lors de l'arrêt:", error);
        setIsRecording(false);
        setRecordingTime(0);
        cleanupResources();
      }
    }
  }, [isRecording, cleanupResources]);
  
  const clearRecording = useCallback(() => {
    console.log('🗑️ SIMPLE - Suppression enregistrement');
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
