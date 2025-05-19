
import React, { useState } from 'react';
import { getPublicUrl } from '@/utils/storageUtils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ImageIcon, FileIcon, MusicIcon, VideoIcon } from 'lucide-react';

interface EntryMediaProps {
  mediaUrl: string | null;
  mediaType: string | null;
}

const EntryMedia: React.FC<EntryMediaProps> = ({ mediaUrl, mediaType }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  
  if (!mediaUrl) return null;
  
  try {
    // S'assurer que nous avons l'URL publique complète
    const completeMediaUrl = getPublicUrl(mediaUrl);
    console.log('URL média à afficher:', completeMediaUrl);
    
    if (mediaType?.startsWith('image/')) {
      return (
        <div className="mt-6 rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
          {isLoading && (
            <div className="flex justify-center items-center h-[300px]">
              <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
            </div>
          )}
          <AspectRatio ratio={16/9} className={isLoading ? 'hidden' : 'block'}>
            <img 
              src={completeMediaUrl} 
              alt="Media" 
              className="w-full h-full object-contain" 
              onError={(e) => {
                console.error("Erreur de chargement d'image:", completeMediaUrl);
                setHasError(true);
                setIsLoading(false);
                e.currentTarget.src = '/placeholder.svg';
                e.currentTarget.className = "w-full h-full object-contain opacity-50";
              }}
              onLoad={() => {
                console.log("Image chargée avec succès:", completeMediaUrl);
                setIsLoading(false);
              }}
              style={{ display: hasError ? 'none' : 'block' }}
            />
            {hasError && (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                <ImageIcon size={48} />
                <p className="mt-2">Impossible de charger l'image</p>
              </div>
            )}
          </AspectRatio>
        </div>
      );
    } else if (mediaType?.startsWith('video/')) {
      return (
        <div className="mt-6 rounded-lg overflow-hidden bg-gray-50 border border-gray-200">
          <AspectRatio ratio={16/9}>
            <video 
              src={completeMediaUrl} 
              controls 
              className="w-full h-full"
              onError={(e) => {
                console.error("Erreur de chargement vidéo:", completeMediaUrl);
                e.currentTarget.poster = '/placeholder.svg';
                setHasError(true);
              }}
            >
              Votre navigateur ne prend pas en charge la lecture vidéo.
            </video>
            {hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                <VideoIcon size={48} />
                <p className="mt-2">Impossible de charger la vidéo</p>
              </div>
            )}
          </AspectRatio>
        </div>
      );
    } else if (mediaType?.startsWith('audio/')) {
      return (
        <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex items-center mb-2">
            <MusicIcon className="mr-2 text-tranches-sage" size={20} />
            <span className="text-sm font-medium">Fichier audio</span>
          </div>
          <audio 
            src={completeMediaUrl} 
            controls 
            className="w-full"
            onError={(e) => {
              console.error("Erreur de chargement audio:", completeMediaUrl);
              setHasError(true);
            }}
          >
            Votre navigateur ne prend pas en charge la lecture audio.
          </audio>
          {hasError && (
            <p className="text-sm text-red-500 mt-2">Impossible de charger le fichier audio</p>
          )}
        </div>
      );
    }
    
    return (
      <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
        <div className="flex items-center">
          <FileIcon className="mr-2 text-tranches-sage" size={20} />
          <a 
            href={completeMediaUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-tranches-sage hover:underline"
          >
            Voir le média
          </a>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Erreur lors du rendu du média:", error);
    return (
      <div className="mt-6 p-4 border border-red-200 bg-red-50 rounded-lg text-red-500 flex items-center">
        <FileIcon className="mr-2" size={20} />
        Impossible de charger le média
      </div>
    );
  }
};

export default EntryMedia;
