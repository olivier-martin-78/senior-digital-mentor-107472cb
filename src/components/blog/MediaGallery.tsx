
import React from 'react';
import { Button } from '@/components/ui/button';
import { BlogMedia } from '@/types/supabase';
import { ImageIcon, Video, X } from 'lucide-react';

interface MediaGalleryProps {
  media: BlogMedia[];
  deleteMedia: (media: BlogMedia) => void;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ media, deleteMedia }) => {
  if (media.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
      {media.map(item => (
        <div key={item.id} className="group relative bg-gray-100 rounded-lg overflow-hidden">
          {item.media_type.startsWith('image/') ? (
            <>
              <img
                src={item.media_url}
                alt="Media"
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <ImageIcon className="w-6 h-6 text-white" />
              </div>
            </>
          ) : item.media_type.startsWith('video/') ? (
            <>
              <video
                src={item.media_url}
                className="w-full h-32 object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                <Video className="w-6 h-6 text-white" />
              </div>
            </>
          ) : (
            <div className="w-full h-32 flex items-center justify-center">
              <p className="text-gray-500 text-sm">Fichier non prévisualisable</p>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => deleteMedia(item)}
            className="absolute top-1 right-1 bg-white/80 hover:bg-white p-1 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
};

export default MediaGallery;
