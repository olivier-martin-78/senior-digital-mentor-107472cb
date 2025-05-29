
import React, { useState } from 'react';
import { BlogMedia } from '@/types/supabase';
import MediaViewer from './MediaViewer';

interface PostMediaProps {
  media: BlogMedia[];
}

const PostMedia: React.FC<PostMediaProps> = ({ media }) => {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(null);

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

  return (
    <>
      <div className="mb-8">
        {mediaRows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex w-full">
            {row.map((item, itemIndex) => (
              <div 
                key={item.id} 
                className="flex-1 border-2 border-white cursor-pointer hover:opacity-90 transition-opacity relative"
                style={{ width: `${100 / row.length}%` }}
                onClick={() => handleMediaClick(item)}
              >
                {item.media_type.startsWith('image/') ? (
                  <img
                    src={item.media_url}
                    alt="Media du post"
                    className="w-full aspect-square object-cover"
                  />
                ) : item.media_type.startsWith('video/') ? (
                  <>
                    {item.thumbnail_url ? (
                      <div className="relative">
                        <img
                          src={item.thumbnail_url}
                          alt="Vignette vidéo"
                          className="w-full aspect-square object-cover"
                        />
                        {/* Icône play au centre */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                          <div className="w-16 h-16 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[12px] border-l-black border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent ml-1"></div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <video
                        src={item.media_url}
                        className="w-full aspect-square object-cover"
                        muted
                        playsInline
                      />
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center bg-gray-100 aspect-square">
                    <p className="text-gray-500">Fichier non prévisualisable</p>
                  </div>
                )}
              </div>
            ))}
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
