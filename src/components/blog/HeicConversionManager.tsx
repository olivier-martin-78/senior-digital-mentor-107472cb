
import { useRef, useState, useCallback } from 'react';
import heic2any from 'heic2any';

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
      console.log('🔄 Début conversion HEIC:', { mediaId, url: imageUrl, attempt: state.attempts[mediaId] });
      
      // Marquer comme en cours
      state.converting.add(mediaId);
      triggerUpdate();

      // Télécharger avec timeout plus court
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Timeout de téléchargement pour:', mediaId);
        controller.abort();
      }, 8000);

      let response;
      try {
        response = await fetch(imageUrl, {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        clearTimeout(timeoutId);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('❌ Erreur de téléchargement:', { mediaId, error: fetchError });
        throw new Error(`Échec du téléchargement: ${fetchError instanceof Error ? fetchError.message : 'Network error'}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Fichier vide reçu');
      }

      console.log('📥 Fichier téléchargé:', { mediaId, size: blob.size, type: blob.type });

      // Convertir avec timeout
      const conversionPromise = heic2any({
        blob,
        toType: 'image/jpeg',
        quality: 0.8
      });

      const conversionTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout de conversion')), 15000);
      });

      const convertedBlob = await Promise.race([conversionPromise, conversionTimeout]) as Blob;
      const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      
      if (!finalBlob || finalBlob.size === 0) {
        throw new Error('Conversion échouée - blob invalide');
      }

      const convertedUrl = URL.createObjectURL(finalBlob);
      
      // Stocker le résultat
      state.converted[mediaId] = convertedUrl;
      state.converting.delete(mediaId);
      
      console.log('✅ Conversion HEIC réussie:', { mediaId, convertedUrl, size: finalBlob.size });
      triggerUpdate();
      
      return convertedUrl;
    } catch (error) {
      console.error('❌ Erreur conversion HEIC:', { 
        mediaId, 
        attempt: state.attempts[mediaId],
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
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
    // Nettoyer les URLs temporaires
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
