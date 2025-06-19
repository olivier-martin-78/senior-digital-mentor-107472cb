
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
    return attempts < 3 && !state.converting.has(mediaId) && !state.failed.has(mediaId);
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
    if (state.attempts[mediaId] > 3) {
      state.failed.add(mediaId);
      triggerUpdate();
      return '/placeholder.svg';
    }

    try {
      console.log('🔄 Début conversion HEIC:', { mediaId, url: imageUrl, attempt: state.attempts[mediaId] });
      
      // Marquer comme en cours
      state.converting.add(mediaId);
      triggerUpdate();

      // Télécharger avec timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('⏰ Timeout de téléchargement pour:', mediaId);
        controller.abort();
      }, 10000);

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

      // Stratégies de conversion multiples avec timeouts plus longs
      const conversionStrategies = [
        // Stratégie 1: JPEG haute qualité
        {
          name: 'JPEG qualité 0.9',
          params: { blob, toType: 'image/jpeg' as const, quality: 0.9 },
          timeout: 30000
        },
        // Stratégie 2: JPEG qualité réduite
        {
          name: 'JPEG qualité 0.7',
          params: { blob, toType: 'image/jpeg' as const, quality: 0.7 },
          timeout: 25000
        },
        // Stratégie 3: PNG (pas de compression)
        {
          name: 'PNG sans compression',
          params: { blob, toType: 'image/png' as const },
          timeout: 35000
        }
      ];

      let convertedBlob: Blob | null = null;
      let usedStrategy = '';

      // Essayer chaque stratégie
      for (const strategy of conversionStrategies) {
        try {
          console.log(`🔄 Tentative ${strategy.name} pour:`, mediaId);
          
          const conversionPromise = heic2any(strategy.params);
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error(`Timeout ${strategy.name}`)), strategy.timeout);
          });

          const result = await Promise.race([conversionPromise, timeoutPromise]);
          convertedBlob = Array.isArray(result) ? result[0] : result;
          usedStrategy = strategy.name;
          
          if (convertedBlob && convertedBlob.size > 0) {
            console.log(`✅ Conversion réussie avec ${strategy.name}:`, { mediaId, size: convertedBlob.size });
            break;
          }
        } catch (strategyError) {
          console.warn(`⚠️ Échec ${strategy.name} pour ${mediaId}:`, strategyError instanceof Error ? strategyError.message : 'Unknown error');
          continue;
        }
      }

      if (!convertedBlob || convertedBlob.size === 0) {
        throw new Error('Toutes les stratégies de conversion ont échoué');
      }

      const convertedUrl = URL.createObjectURL(convertedBlob);
      
      // Stocker le résultat
      state.converted[mediaId] = convertedUrl;
      state.converting.delete(mediaId);
      
      console.log('✅ Conversion HEIC réussie:', { 
        mediaId, 
        convertedUrl, 
        size: convertedBlob.size, 
        strategy: usedStrategy 
      });
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
      if (state.attempts[mediaId] >= 3) {
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
