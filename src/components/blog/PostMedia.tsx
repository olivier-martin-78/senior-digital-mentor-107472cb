
import React from 'react';
import { BlogMedia } from '@/types/supabase';

interface PostMediaProps {
  media: BlogMedia[];
}

const PostMedia: React.FC<PostMediaProps> = ({ media }) => {
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

  return (
    <div className="mb-8">
      {mediaRows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex w-full">
          {row.map((item, itemIndex) => (
            <div 
              key={item.id} 
              className="flex-1"
              style={{ width: `${100 / row.length}%` }}
            >
              {item.media_type.startsWith('image/') ? (
                <img
                  src={item.media_url}
                  alt="Media du post"
                  className="w-full h-64 object-cover"
                />
              ) : item.media_type.startsWith('video/') ? (
                <video
                  src={item.media_url}
                  controls
                  className="w-full h-64 object-cover"
                />
              ) : (
                <div className="flex items-center justify-center bg-gray-100 h-64">
                  <p className="text-gray-500">Fichier non prévisualisable</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default PostMedia;
