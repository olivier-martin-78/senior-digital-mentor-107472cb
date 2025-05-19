
import React from 'react';
import { BlogMedia } from '@/types/supabase';

interface PostMediaProps {
  media: BlogMedia[];
}

const PostMedia: React.FC<PostMediaProps> = ({ media }) => {
  if (media.length === 0) return null;

  return (
    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {media.map(item => (
        <div key={item.id} className="rounded-lg overflow-hidden">
          {item.media_type.startsWith('image/') ? (
            <img
              src={item.media_url}
              alt="Media du post"
              className="w-full h-48 object-cover"
            />
          ) : item.media_type.startsWith('video/') ? (
            <video
              src={item.media_url}
              controls
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="flex items-center justify-center bg-gray-100 h-48">
              <p className="text-gray-500">Fichier non prévisualisable</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PostMedia;
