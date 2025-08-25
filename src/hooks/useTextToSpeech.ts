import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TTSOptions {
  voice_id?: string;
  text: string;
}

interface TTSResult {
  audioContent: string;
  error?: string;
}

export const useTextToSpeech = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSpeech = useCallback(async (options: TTSOptions): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: rpcError } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: options.text,
          voice_id: options.voice_id || '9BWtsMINqrJLrRacOk9x' // Aria voice by default
        }
      });

      if (rpcError) {
        throw new Error(rpcError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Convert base64 to blob URL
      const binaryString = atob(data.audioContent);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const blob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      
      return audioUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate speech';
      setError(errorMessage);
      console.error('TTS Error:', errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    generateSpeech,
    isLoading,
    error
  };
};