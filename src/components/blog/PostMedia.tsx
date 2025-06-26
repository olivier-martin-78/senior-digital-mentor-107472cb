import React, { useState, useEffect } from 'react';
import { BlogMedia } from '@/types/supabase';
import MediaViewer from './MediaViewer';
import MediaDownloader from './MediaDownloader';
import MediaItem from './MediaItem';
import { useHeicConversion } from './HeicConversionManager';
import { getThumbnailUrl, BLOG_MEDIA_BUCKET } from '@/utils/thumbnailtUtils';

interface PostMediaProps {
  media: BlogMedia[];
  postTitle?: string;
}

const PostMedia: React.FC<PostMediaProps> = ({ media, postTitle = 'Article' }) => {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);
  const [normalizedUrls, setNormalizedUrls] = useState<Record<string, string>>({});
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const {
    isHeicFile,
    isConverting,
    isConversionFailed,
    getConvertedUrl,
    shouldAttemptConversion,
    convertHeicToJpeg,
    cleanup
  } = useHeicConversion();

  // Normaliser les URLs au chargement
  useEffect(() => {
    const normalizeUrls = async () => {
      const urlPromises = media.map(async (item) => {
        try {
          const normalizedUrl = await getThumbnailUrl(item.media_url, BLOG_MEDIA_BUCKET);
          return { id: item.id, url: normalizedUrl };
        } catch (error) {
          console.error('❌ Erreur normalisation URL:', { id: item.id, error });
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

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  if (media.length === 0) return null;

  const organizeMediaInRows = (mediaArray: BlogMedia[]) => {
    const rows: BlogMedia[][] = [];
    let currentIndex = 0;

    while (currentIndex < mediaArray.length) {
      const remaining = mediaArray.length - currentIndex;
      
      let itemsInRow = 1;
      if (remaining >= 3) {
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
    console.error('❌ Erreur chargement image:', { mediaId });
    setImageErrors(prev => new Set([...prev, mediaId]));
  };

  const getImageUrl = (item: BlogMedia): string => {
    // Priorité 1: URL convertie depuis HEIC
    const convertedUrl = getConvertedUrl(item.id);
    if (convertedUrl) {
      return convertedUrl;
    }

    // Priorité 2: URL normalisée
    const normalizedUrl = normalizedUrls[item.id];
    if (normalizedUrl && normalizedUrl !== '/placeholder.svg') {
      return normalizedUrl;
    }
    
    // Fallback
    return item.media_url || '/placeholder.svg';
  };

  const handleConversion = async (imageUrl: string, mediaId: string) => {
    if (isHeicFile(imageUrl)) {
      await convertHeicToJpeg(imageUrl, mediaId);
    }
  };

  return (
    <>
      <div className="mb-8">
        <MediaDownloader media={media} postTitle={postTitle} />

        {mediaRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex w-full">
            {row.map((item) => {
              const imageUrl = getImageUrl(item);
              const hasError = imageErrors.has(item.id);
              
              return (
                <MediaItem
                  key={item.id}
                  media={item}
                  onClick={() => handleMediaClick(item)}
                />
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
