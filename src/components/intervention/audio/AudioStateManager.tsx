
import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioState {
  isUploading: boolean;
  uploadedAudioUrl: string | null;
  currentBlob: Blob | null;
  isProcessing: boolean;
}

export const useAudioState = (existingAudioUrl?: string | null) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(existingAudioUrl || null);
  
  // Refs pour éviter les uploads multiples et les actions concurrentes
  const isMounted = useRef(true);
  const isProcessing = useRef(false);
  const currentBlobRef = useRef<Blob | null>(null);

  // Effet de nettoyage
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const setUploading = useCallback((uploading: boolean) => {
    if (isMounted.current) {
      setIsUploading(uploading);
    }
  }, []);

  const setAudioUrl = useCallback((url: string | null) => {
    if (isMounted.current) {
      setUploadedAudioUrl(url);
    }
  }, []);

  const setCurrentBlob = useCallback((blob: Blob | null) => {
    currentBlobRef.current = blob;
  }, []);

  const canProcess = useCallback(() => {
    return !isProcessing.current && isMounted.current;
  }, []);

  const startProcessing = useCallback(() => {
    isProcessing.current = true;
  }, []);

  const endProcessing = useCallback(() => {
    isProcessing.current = false;
  }, []);

  const clearAudio = useCallback(() => {
    setUploadedAudioUrl(null);
    currentBlobRef.current = null;
  }, []);

  return {
    isUploading,
    uploadedAudioUrl,
    currentBlob: currentBlobRef.current,
    isProcessing: isProcessing.current,
    isMounted: isMounted.current,
    setUploading,
    setAudioUrl,
    setCurrentBlob,
    canProcess,
    startProcessing,
    endProcessing,
    clearAudio
  };
};
