
import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { TranscriptionResult } from '@/types/lifeStory';

interface AudioRecorderHook {
  isRecording: boolean;
  audioBlob: Blob | null;
  audioUrl: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => void;
  transcribeAudio: () => Promise<string | null>;
  transcribing: boolean;
}

export const useAudioRecorder = (): AudioRecorderHook => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcribing, setTranscribing] = useState<boolean>(false);
  
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  
  const startRecording = useCallback(async () => {
    audioChunks.current = [];
    try {
      console.log("Requesting media permissions...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      console.log("Permission granted, creating MediaRecorder...");
      mediaRecorder.current = new MediaRecorder(stream);
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };
      
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setAudioBlob(audioBlob);
        setAudioUrl(audioUrl);
        setIsRecording(false);
        
        // Arrêter tous les tracks du stream pour libérer le microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.current.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error("Erreur lors de l'accès au microphone:", error);
      toast({
        title: "Erreur d'accès au microphone",
        description: "Veuillez vérifier que vous avez accordé les permissions nécessaires à votre navigateur.",
        variant: "destructive",
      });
    }
  }, []);
  
  const stopRecording = useCallback(async () => {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
    }
  }, [isRecording]);
  
  const clearRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioBlob(null);
    setAudioUrl(null);
  }, [audioUrl]);
  
  const transcribeAudio = useCallback(async () => {
    if (!audioBlob) return null;
    
    try {
      setTranscribing(true);
      console.log("Préparation de l'audio pour la transcription...");
      
      // Convertir le Blob en base64
      const buffer = await audioBlob.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binary);
      
      console.log("Envoi de l'audio pour transcription...");
      
      // Appeler notre fonction Edge pour transcription
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: {
          audio: base64Audio,
        },
      });
      
      if (error) {
        console.error("Erreur lors de la transcription:", error);
        throw new Error(`Erreur lors de l'appel à la fonction: ${error.message}`);
      }
      
      console.log("Réponse reçue de la fonction transcription:", data);
      
      if (!data || data.success === false) {
        // Gestion spécifique de l'erreur de quota dépassé
        if (data?.quota_exceeded) {
          throw new Error("Le quota OpenAI a été dépassé. Veuillez réessayer plus tard ou contacter l'administrateur.");
        }
        
        const errorMsg = data?.error || "Erreur inconnue lors de la transcription.";
        console.error("Échec de la transcription:", errorMsg);
        throw new Error(errorMsg);
      }
      
      console.log("Transcription réussie:", data.text);
      return data.text;
      
    } catch (error: any) {
      console.error("Erreur lors de la transcription:", error);
      toast({
        title: "Erreur de transcription",
        description: "Impossible de transcrire l'audio en texte. " + (error.message || ""),
        variant: "destructive",
      });
      return null;
    } finally {
      setTranscribing(false);
    }
  }, [audioBlob]);
  
  return {
    isRecording,
    audioBlob,
    audioUrl,
    startRecording,
    stopRecording,
    clearRecording,
    transcribeAudio,
    transcribing,
  };
};

export default useAudioRecorder;
