import { useState, useCallback, useEffect } from 'react';

interface WebSpeechOptions {
  text: string;
  voiceId?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

interface WebSpeechResult {
  speak: (options: WebSpeechOptions) => Promise<void>;
  stop: () => void;
  isLoading: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
}

export const useWebSpeechAPI = (): WebSpeechResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSupported] = useState(() => 'speechSynthesis' in window);

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    // Load voices immediately if available
    loadVoices();

    // Listen for voices changed event (Chrome needs this)
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [isSupported]);

  const speak = useCallback(async (options: WebSpeechOptions): Promise<void> => {
    if (!isSupported) {
      throw new Error('Web Speech API not supported');
    }

    return new Promise((resolve, reject) => {
      try {
        setIsLoading(true);

        // Stop any ongoing speech
        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(options.text);
        
        // Set voice if specified
        if (options.voiceId && voices.length > 0) {
          const selectedVoice = voices.find(voice => 
            voice.name.includes(options.voiceId!) || 
            voice.lang.includes(options.voiceId!)
          );
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }
        } else {
          // Default to French voice if available
          const frenchVoice = voices.find(voice => 
            voice.lang.startsWith('fr') || voice.name.toLowerCase().includes('french')
          );
          if (frenchVoice) {
            utterance.voice = frenchVoice;
          }
        }

        // Set speech parameters
        utterance.rate = options.rate || 1.0;
        utterance.pitch = options.pitch || 1.0;
        utterance.volume = options.volume || 1.0;

        utterance.onend = () => {
          setIsLoading(false);
          resolve();
        };

        utterance.onerror = (error) => {
          setIsLoading(false);
          reject(new Error(`Speech synthesis error: ${error.error}`));
        };

        speechSynthesis.speak(utterance);
      } catch (error) {
        setIsLoading(false);
        reject(error);
      }
    });
  }, [isSupported, voices]);

  const stop = useCallback(() => {
    if (isSupported) {
      speechSynthesis.cancel();
      setIsLoading(false);
    }
  }, [isSupported]);

  return {
    speak,
    stop,
    isLoading,
    isSupported,
    voices
  };
};