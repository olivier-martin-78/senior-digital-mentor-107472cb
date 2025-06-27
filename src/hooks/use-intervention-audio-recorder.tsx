
import { useState, useRef, useCallback, useEffect } from 'react';

interface UseInterventionAudioRecorderReturn {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  recordingTime: number;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => void;
  isSupported: boolean;
}

export const useInterventionAudioRecorder = (): UseInterventionAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Détecter le support et les formats audio compatibles
  useEffect(() => {
    const checkSupport = () => {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
        setIsSupported(false);
        return;
      }

      // Tester les formats supportés dans l'ordre de préférence
      const formats = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4', // Fallback pour iPad/Safari
        'audio/wav'
      ];

      for (const format of formats) {
        if (MediaRecorder.isTypeSupported(format)) {
          console.log('🎤 INTERVENTION_AUDIO - Format supporté:', format);
          setIsSupported(true);
          return;
        }
      }

      console.warn('🎤 INTERVENTION_AUDIO - Aucun format audio supporté');
      setIsSupported(false);
    };

    checkSupport();
  }, []);

  // Obtenir le meilleur format MIME supporté
  const getBestMimeType = useCallback((): string => {
    const formats = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4', // Important pour iPad/Safari
      'audio/wav'
    ];

    for (const format of formats) {
      if (MediaRecorder.isTypeSupported(format)) {
        console.log('🎤 INTERVENTION_AUDIO - Utilisation du format:', format);
        return format;
      }
    }

    // Fallback par défaut
    return 'audio/webm';
  }, []);

  const startRecording = useCallback(async (): Promise<void> => {
    if (!isSupported) {
      throw new Error('Enregistrement audio non supporté sur cet appareil');
    }

    try {
      // Nettoyer les données précédentes
      chunksRef.current = [];
      setAudioBlob(null);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }

      // Demander l'accès au microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      const mimeType = getBestMimeType();

      // Créer le MediaRecorder avec le format optimal
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;

      // Gérer les données d'enregistrement
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      // Gérer la fin d'enregistrement
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        
        // Créer l'URL pour la prévisualisation
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        console.log('🎤 INTERVENTION_AUDIO - Enregistrement terminé:', {
          size: blob.size,
          type: blob.type,
          duration: recordingTime
        });
      };

      // Démarrer l'enregistrement
      mediaRecorder.start(1000); // Collecter les données toutes les secondes
      setIsRecording(true);
      setRecordingTime(0);

      // Démarrer le timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      console.log('🎤 INTERVENTION_AUDIO - Enregistrement démarré avec format:', mimeType);
    } catch (error) {
      console.error('🎤 INTERVENTION_AUDIO - Erreur démarrage:', error);
      throw new Error('Impossible d\'accéder au microphone');
    }
  }, [isSupported, getBestMimeType, audioUrl, recordingTime]);

  const stopRecording = useCallback(async (): Promise<void> => {
    if (!mediaRecorderRef.current || !streamRef.current) {
      return;
    }

    try {
      // Arrêter le timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Arrêter l'enregistrement
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      // Arrêter les pistes audio
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      mediaRecorderRef.current = null;

      setIsRecording(false);
      console.log('🎤 INTERVENTION_AUDIO - Enregistrement arrêté');
    } catch (error) {
      console.error('🎤 INTERVENTION_AUDIO - Erreur arrêt:', error);
    }
  }, []);

  const clearRecording = useCallback(() => {
    // Nettoyer l'URL existante
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    // Réinitialiser tous les états
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    chunksRef.current = [];

    console.log('🎤 INTERVENTION_AUDIO - Enregistrement supprimé');
  }, [audioUrl]);

  // Nettoyer les ressources au démontage
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  return {
    isRecording,
    audioBlob,
    audioUrl,
    recordingTime,
    startRecording,
    stopRecording,
    clearRecording,
    isSupported
  };
};
