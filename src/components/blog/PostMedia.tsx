
import React, { useState } from 'react';
import { BlogMedia } from '@/types/supabase';
import MediaViewer from './MediaViewer';
import MediaDownloader from './MediaDownloader';
import { getThumbnailUrl, BLOG_MEDIA_BUCKET } from '@/utils/thumbnailtUtils';

interface PostMediaProps {
  media: BlogMedia[];
  postTitle?: string;
}

const PostMedia: React.FC<PostMediaProps> = ({ media, postTitle = 'Article' }) => {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());
  const [normalizedUrls, setNormalizedUrls] = useState<Record<string, string>>({});

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

  const handleImageError = (mediaId: string) => {
    console.error('❌ PostMedia - Erreur chargement image:', {
      mediaId,
      originalUrl: media.find(m => m.id === mediaId)?.media_url,
      normalizedUrl: normalizedUrls[mediaId]
    });
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
              
              return (
                <div 
                  key={item.id} 
                  className="flex-1 border-2 border-white cursor-pointer hover:opacity-90 transition-opacity relative"
                  style={{ width: `${100 / row.length}%` }}
                  onClick={() => handleMediaClick(item)}
                >
                  {item.media_type.startsWith('image/') ? (
                    <>
                      {hasError ? (
                        <div className="flex items-center justify-center bg-gray-100 aspect-square">
                          <div className="text-center text-gray-500">
                            <p className="text-sm font-medium">Image non disponible</p>
                            <p className="text-xs">Essayez de recharger la page</p>
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
                              url: imageUrl
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
