import React, { useState } from 'react';
import { BlogMedia } from '@/types/supabase';
import MediaViewer from './MediaViewer';
import MediaDownloader from './MediaDownloader';
import { getThumbnailUrl, BLOG_MEDIA_BUCKET } from '@/utils/thumbnailtUtils';
import heic2any from 'heic2any';

interface PostMediaProps {
  media: BlogMedia[];
  postTitle?: string;
}

const PostMedia: React.FC<PostMediaProps> = ({ media, postTitle = 'Article' }) => {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());
  const [normalizedUrls, setNormalizedUrls] = useState<Record<string, string>>({});
  const [heicConvertedUrls, setHeicConvertedUrls] = useState<Record<string, string>>({});
  const [heicConversions, setHeicConversions] = useState<Set<string>>(new Set());
  const [heicConversionAttempts, setHeicConversionAttempts] = useState<Set<string>>(new Set());
  const [heicConversionFailures, setHeicConversionFailures] = useState<Set<string>>(new Set());

  // Normaliser les URLs au chargement
  React.useEffect(() => {
    const normalizeUrls = async () => {
      const urlPromises = media.map(async (item) => {
        try {
          console.log('🔗 PostMedia - Normalisation URL pour:', {
            id: item.id,
            originalUrl: item.media_url,
            type: item.media_type
          });
          
          const normalizedUrl = await getThumbnailUrl(item.media_url, BLOG_MEDIA_BUCKET);
          console.log('✅ PostMedia - URL normalisée:', {
            id: item.id,
            normalizedUrl
          });
          
          return { id: item.id, url: normalizedUrl };
        } catch (error) {
          console.error('❌ PostMedia - Erreur normalisation URL:', {
            id: item.id,
            originalUrl: item.media_url,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          return { id: item.id, url: '/placeholder.svg' };
        }
      });

      const results = await Promise.all(urlPromises);
      const urlMap = results.reduce((acc, { id, url }) => {
        acc[id] = url;
        return acc;
      }, {} as Record<string, string>);
      
      setNormalizedUrls(urlMap);
    };

    if (media.length > 0) {
      normalizeUrls();
    }
  }, [media]);

  if (media.length === 0) return null;

  // Fonction pour convertir HEIC en JPEG avec protection contre les boucles
  const convertHeicToJpeg = async (imageUrl: string, mediaId: string): Promise<string> => {
    try {
      console.log('📸 PostMedia - Tentative conversion HEIC pour:', mediaId);
      
      // Vérifier si une conversion est déjà en cours ou a déjà échoué
      if (heicConversions.has(mediaId)) {
        console.log('📸 PostMedia - Conversion déjà en cours pour:', mediaId);
        return imageUrl;
      }

      if (heicConversionFailures.has(mediaId)) {
        console.log('📸 PostMedia - Conversion déjà échouée pour:', mediaId);
        return '/placeholder.svg';
      }

      // Marquer comme en cours de conversion
      setHeicConversions(prev => new Set([...prev, mediaId]));
      setHeicConversionAttempts(prev => new Set([...prev, mediaId]));

      // Télécharger l'image avec timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes max

      const response = await fetch(imageUrl, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error('Fichier HEIC vide ou corrompu');
      }
      
      // Convertir avec heic2any
      const convertedBlob = await heic2any({
        blob,
        toType: 'image/jpeg',
        quality: 0.8
      }) as Blob;
      
      // Créer une URL temporaire
      const convertedUrl = URL.createObjectURL(convertedBlob);
      
      console.log('✅ PostMedia - HEIC converti avec succès pour:', mediaId);
      
      // Stocker l'URL convertie
      setHeicConvertedUrls(prev => ({
        ...prev,
        [mediaId]: convertedUrl
      }));

      // Retirer des conversions en cours
      setHeicConversions(prev => {
        const newSet = new Set(prev);
        newSet.delete(mediaId);
        return newSet;
      });
      
      return convertedUrl;
    } catch (error) {
      console.error('❌ PostMedia - Erreur conversion HEIC:', {
        mediaId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Marquer comme échec et retirer des conversions en cours
      setHeicConversionFailures(prev => new Set([...prev, mediaId]));
      setHeicConversions(prev => {
        const newSet = new Set(prev);
        newSet.delete(mediaId);
        return newSet;
      });
      
      return '/placeholder.svg';
    }
  };

  // Fonction pour organiser les médias en lignes de 1, 2 ou 3 éléments
  const organizeMediaInRows = (mediaArray: BlogMedia[]) => {
    const rows: BlogMedia[][] = [];
    let currentIndex = 0;

    while (currentIndex < mediaArray.length) {
      const remaining = mediaArray.length - currentIndex;
      
      // Logique pour déterminer combien d'éléments dans cette ligne
      let itemsInRow = 1;
      if (remaining >= 3) {
        // Alterner entre 1, 2, et 3 éléments pour une disposition variée
        const pattern = Math.floor(currentIndex / 3) % 3;
        itemsInRow = pattern === 0 ? 3 : pattern === 1 ? 2 : 1;
      } else if (remaining === 2) {
        itemsInRow = 2;
      } else {
        itemsInRow = 1;
      }

      rows.push(mediaArray.slice(currentIndex, currentIndex + itemsInRow));
      currentIndex += itemsInRow;
    }

    return rows;
  };

  const mediaRows = organizeMediaInRows(media);

  const handleMediaClick = (mediaItem: BlogMedia) => {
    const index = media.findIndex(item => item.id === mediaItem.id);
    setSelectedMediaIndex(index);
  };

  const closeViewer = () => {
    setSelectedMediaIndex(null);
  };

  const navigateMedia = (direction: 'next' | 'prev') => {
    if (selectedMediaIndex === null) return;
    if (direction === 'next') {
      setSelectedMediaIndex((selectedMediaIndex + 1) % media.length);
    } else {
      setSelectedMediaIndex(selectedMediaIndex === 0 ? media.length - 1 : selectedMediaIndex - 1);
    }
  };

  const handleImageError = async (mediaId: string) => {
    console.error('❌ PostMedia - Erreur chargement image:', {
      mediaId,
      originalUrl: media.find(m => m.id === mediaId)?.media_url,
      normalizedUrl: normalizedUrls[mediaId]
    });

    // Vérifier si c'est un fichier HEIC et si on n'a pas déjà tenté de le convertir
    const mediaItem = media.find(m => m.id === mediaId);
    const isHeicFile = mediaItem?.media_url?.toLowerCase().includes('.heic') || 
                      normalizedUrls[mediaId]?.toLowerCase().includes('.heic');

    if (isHeicFile && 
        !heicConvertedUrls[mediaId] && 
        !heicConversions.has(mediaId) && 
        !heicConversionAttempts.has(mediaId) &&
        !heicConversionFailures.has(mediaId)) {
      
      console.log('📸 PostMedia - Détection fichier HEIC, tentative de conversion');
      const imageUrl = normalizedUrls[mediaId];
      if (imageUrl && imageUrl !== '/placeholder.svg') {
        await convertHeicToJpeg(imageUrl, mediaId);
        return; // Ne pas marquer comme erreur, laisser la conversion se faire
      }
    }

    // Marquer comme erreur seulement si ce n'est pas un HEIC ou si la conversion a échoué
    setImageErrors(prev => new Set([...prev, mediaId]));
  };

  const handleVideoError = (mediaId: string) => {
    console.error('❌ PostMedia - Erreur chargement vidéo:', {
      mediaId,
      originalUrl: media.find(m => m.id === mediaId)?.media_url,
      normalizedUrl: normalizedUrls[mediaId]
    });
    setVideoErrors(prev => new Set([...prev, mediaId]));
  };

  const getImageUrl = (item: BlogMedia): string => {
    // Priorité 1: URL convertie depuis HEIC
    if (heicConvertedUrls[item.id]) {
      return heicConvertedUrls[item.id];
    }

    // Priorité 2: URL normalisée
    const normalizedUrl = normalizedUrls[item.id];
    if (normalizedUrl && normalizedUrl !== '/placeholder.svg') {
      return normalizedUrl;
    }
    
    // Fallback vers l'URL originale si la normalisation n'est pas encore prête
    return item.media_url || '/placeholder.svg';
  };

  const renderVideoThumbnail = (item: BlogMedia) => {
    const hasError = imageErrors.has(item.id);
    const thumbnailUrl = item.thumbnail_url ? normalizedUrls[item.id + '_thumb'] || item.thumbnail_url : null;

    // Si vignette ok et pas d'erreur
    if (thumbnailUrl && !hasError) {
      return (
        <div className="relative">
          <img
            src={thumbnailUrl}
            alt="Vignette vidéo"
            className="w-full aspect-square object-cover"
            onError={() => handleImageError(item.id)}
          />
          {/* Icône play au centre */}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
            <div className="w-16 h-16 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-l-[12px] border-l-black border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
            </div>
          </div>
        </div>
      );
    }

    // Fallback vidéo avec URL normalisée
    const videoUrl = getImageUrl(item);
    return (
      <div className="relative bg-gray-900">
        <video
          src={videoUrl}
          className="w-full aspect-square object-cover"
          muted
          playsInline
          preload="metadata"
          poster={thumbnailUrl || undefined}
          onError={() => handleVideoError(item.id)}
        />
        {/* Icône play au centre */}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <div className="w-16 h-16 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
            <div className="w-0 h-0 border-l-[12px] border-l-black border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
          </div>
        </div>
        {/* Indicateur vidéo */}
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
          📹 Vidéo
        </div>
        {/* Message d'erreur si la vidéo échoue à charger */}
        {videoErrors.has(item.id) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white p-4 z-10">
            <p className="font-semibold mb-1">Vidéo non supportée</p>
            <p className="text-xs text-gray-200">Ce format n'est pas lisible par votre navigateur. Essayez un autre appareil ou contactez l'auteur.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="mb-8">
        <MediaDownloader media={media} postTitle={postTitle} />

        {mediaRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex w-full">
            {row.map((item, itemIndex) => {
              const imageUrl = getImageUrl(item);
              const hasError = imageErrors.has(item.id);
              const isConverting = heicConversions.has(item.id);
              const conversionFailed = heicConversionFailures.has(item.id);
              
              return (
                <div 
                  key={item.id} 
                  className="flex-1 border-2 border-white cursor-pointer hover:opacity-90 transition-opacity relative"
                  style={{ width: `${100 / row.length}%` }}
                  onClick={() => handleMediaClick(item)}
                >
                  {item.media_type.startsWith('image/') ? (
                    <>
                      {(hasError || conversionFailed) && !isConverting ? (
                        <div className="flex items-center justify-center bg-gray-100 aspect-square">
                          <div className="text-center text-gray-500">
                            <p className="text-sm font-medium">
                              {conversionFailed ? 'Conversion échouée' : 'Image non disponible'}
                            </p>
                            <p className="text-xs">
                              {conversionFailed ? 'Impossible de convertir ce fichier HEIC' : 'Format non supporté par ce navigateur'}
                            </p>
                          </div>
                        </div>
                      ) : isConverting ? (
                        <div className="flex items-center justify-center bg-gray-100 aspect-square">
                          <div className="text-center text-gray-500">
                            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full mx-auto mb-2"></div>
                            <p className="text-sm font-medium">Conversion en cours...</p>
                            <p className="text-xs">Adaptation du format pour votre navigateur</p>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={imageUrl}
                          alt="Media du post"
                          className="w-full aspect-square object-cover"
                          onError={() => handleImageError(item.id)}
                          onLoad={() => {
                            console.log('✅ PostMedia - Image chargée avec succès:', {
                              id: item.id,
                              url: imageUrl,
                              isConverted: !!heicConvertedUrls[item.id]
                            });
                          }}
                        />
                      )}
                    </>
                  ) : item.media_type.startsWith('video/') ? (
                    renderVideoThumbnail(item)
                  ) : (
                    <div className="flex items-center justify-center bg-gray-100 aspect-square">
                      <p className="text-gray-500">Fichier non prévisualisable</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {selectedMediaIndex !== null && (
        <MediaViewer
          media={media}
          currentIndex={selectedMediaIndex}
          onClose={closeViewer}
          onNavigate={navigateMedia}
        />
      )}
    </>
  );
};

export default PostMedia;
