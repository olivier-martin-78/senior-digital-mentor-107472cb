
import { useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
      console.log('🔄 Début conversion HEIC via serveur:', { mediaId, url: imageUrl, attempt: state.attempts[mediaId] });
      
      // Marquer comme en cours
      state.converting.add(mediaId);
      triggerUpdate();

      // Utiliser l'Edge Function pour la conversion
      const { data, error } = await supabase.functions.invoke('heic-converter', {
        body: { 
          imageUrl: imageUrl,
          mediaId: mediaId,
          outputFormat: 'jpeg',
          quality: 0.8
        }
      });

      if (error) {
        console.error('❌ Erreur Edge Function:', error);
        throw new Error(`Erreur serveur: ${error.message}`);
      }

      if (!data?.convertedUrl) {
        throw new Error('URL convertie non reçue du serveur');
      }

      // Stocker le résultat
      state.converted[mediaId] = data.convertedUrl;
      state.converting.delete(mediaId);
      
      console.log('✅ Conversion HEIC serveur réussie:', { 
        mediaId, 
        convertedUrl: data.convertedUrl
      });
      
      triggerUpdate();
      return data.convertedUrl;

    } catch (error) {
      console.error('❌ Erreur conversion HEIC serveur:', { 
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
    // Nettoyer les URLs temporaires (si elles sont des blob URLs)
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
