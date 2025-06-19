
import { useRef, useState, useCallback } from 'react';

interface HeicConversionState {
  converting: Set<string>;
  converted: Record<string, string>;
  failed: Set<string>;
  attempts: Record<string, number>;
}

export const useHeicConversion = () => {
  const conversionState = useRef<HeicConversionState>({
    converting: new Set(),
    converted: {},
    failed: new Set(),
    attempts: {}
  });

  const [, forceUpdate] = useState({});
  const triggerUpdate = useCallback(() => forceUpdate({}), []);

  const isHeicFile = useCallback((url: string): boolean => {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.includes('.heic') || lowerUrl.includes('.heif');
  }, []);

  const isConverting = useCallback((mediaId: string): boolean => {
    return conversionState.current.converting.has(mediaId);
  }, []);

  const isConversionFailed = useCallback((mediaId: string): boolean => {
    return conversionState.current.failed.has(mediaId);
  }, []);

  const getConvertedUrl = useCallback((mediaId: string): string | null => {
    return conversionState.current.converted[mediaId] || null;
  }, []);

  const shouldAttemptConversion = useCallback((mediaId: string): boolean => {
    const state = conversionState.current;
    const attempts = state.attempts[mediaId] || 0;
    return attempts < 2 && !state.converting.has(mediaId) && !state.failed.has(mediaId);
  }, []);

  const convertHeicToJpeg = useCallback(async (imageUrl: string, mediaId: string): Promise<string> => {
    const state = conversionState.current;
    
    // Vérifier si déjà en cours ou échoué
    if (state.converting.has(mediaId) || state.failed.has(mediaId)) {
      return '/placeholder.svg';
    }

    // Incrémenter le compteur de tentatives
    state.attempts[mediaId] = (state.attempts[mediaId] || 0) + 1;
    
    // Si trop de tentatives, marquer comme échoué
    if (state.attempts[mediaId] > 2) {
      state.failed.add(mediaId);
      triggerUpdate();
      return '/placeholder.svg';
    }

    try {
      console.log('🔄 Début conversion HEIC avec heic2any:', { mediaId, url: imageUrl, attempt: state.attempts[mediaId] });
      
      // Marquer comme en cours
      state.converting.add(mediaId);
      triggerUpdate();

      // Télécharger le fichier HEIC
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Échec du téléchargement: ${response.status}`);
      }

      const blob = await response.blob();
      console.log('📥 Fichier HEIC téléchargé:', { mediaId, size: blob.size, type: blob.type });

      // Dynamically import heic2any to avoid SSR issues
      const { default: heic2any } = await import('heic2any');

      // Convertir avec heic2any
      const convertedBlob = await heic2any({
        blob: blob,
        toType: 'image/jpeg',
        quality: 0.8
      });

      // heic2any peut retourner un blob ou un array de blobs
      const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      
      // Créer une URL temporaire pour l'image convertie
      const convertedUrl = URL.createObjectURL(finalBlob as Blob);

      // Stocker le résultat
      state.converted[mediaId] = convertedUrl;
      state.converting.delete(mediaId);
      
      console.log('✅ Conversion HEIC réussie avec heic2any:', { 
        mediaId, 
        convertedUrl,
        originalSize: blob.size,
        convertedSize: (finalBlob as Blob).size
      });
      
      triggerUpdate();
      return convertedUrl;

    } catch (error) {
      console.error('❌ Erreur conversion HEIC avec heic2any:', { 
        mediaId, 
        attempt: state.attempts[mediaId],
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Marquer comme échoué
      state.converting.delete(mediaId);
      
      // Si c'est la dernière tentative, marquer comme définitivement échoué
      if (state.attempts[mediaId] >= 2) {
        state.failed.add(mediaId);
        console.error('💀 Conversion HEIC définitivement échouée après', state.attempts[mediaId], 'tentatives:', mediaId);
      }
      
      triggerUpdate();
      return '/placeholder.svg';
    }
  }, [triggerUpdate]);

  const cleanup = useCallback(() => {
    // Nettoyer les URLs temporaires (blob URLs)
    Object.values(conversionState.current.converted).forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
    
    // Réinitialiser l'état
    conversionState.current = {
      converting: new Set(),
      converted: {},
      failed: new Set(),
      attempts: {}
    };
  }, []);

  return {
    isHeicFile,
    isConverting,
    isConversionFailed,
    getConvertedUrl,
    shouldAttemptConversion,
    convertHeicToJpeg,
    cleanup
  };
};
