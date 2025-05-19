
import React from 'react';
import { getPublicUrl } from '@/utils/storageUtils';

interface EntryMediaProps {
  mediaUrl: string | null;
  mediaType: string | null;
}

const EntryMedia: React.FC<EntryMediaProps> = ({ mediaUrl, mediaType }) => {
  if (!mediaUrl) return null;
  
  try {
    // S'assurer que nous avons l'URL publique complète
    const completeMediaUrl = getPublicUrl(mediaUrl);
    console.log('URL média à afficher:', completeMediaUrl);
    
    if (mediaType?.startsWith('image/')) {
      return (
        <div className="mt-6 rounded-lg overflow-hidden bg-gray-100">
          <img 
            src={completeMediaUrl} 
            alt="Media" 
            className="w-full h-auto max-h-[500px] object-contain" 
            onError={(e) => {
              console.error("Erreur de chargement d'image:", completeMediaUrl);
              e.currentTarget.src = '/placeholder.svg';
              e.currentTarget.className = "w-full h-[300px] object-contain opacity-50";
            }}
            onLoad={() => console.log("Image chargée avec succès:", completeMediaUrl)}
          />
        </div>
      );
    } else if (mediaType?.startsWith('video/')) {
      return (
        <div className="mt-6 rounded-lg overflow-hidden">
          <video 
            src={completeMediaUrl} 
            controls 
            className="w-full max-h-[500px]"
            onError={(e) => {
              console.error("Erreur de chargement vidéo:", completeMediaUrl);
              e.currentTarget.poster = '/placeholder.svg';
            }}
          >
            Votre navigateur ne prend pas en charge la lecture vidéo.
          </video>
        </div>
      );
    } else if (mediaType?.startsWith('audio/')) {
      return (
        <div className="mt-6">
          <audio 
            src={completeMediaUrl} 
            controls 
            className="w-full"
            onError={(e) => console.error("Erreur de chargement audio:", completeMediaUrl)}
          >
            Votre navigateur ne prend pas en charge la lecture audio.
          </audio>
        </div>
      );
    }
    
    return (
      <div className="mt-6">
        <a 
          href={completeMediaUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-tranches-sage hover:underline"
        >
          Voir le média
        </a>
      </div>
    );
  } catch (error) {
    console.error("Erreur lors du rendu du média:", error);
    return (
      <div className="mt-6 p-4 border border-red-200 bg-red-50 rounded-lg text-red-500">
        Impossible de charger le média
      </div>
    );
  }
};

export default EntryMedia;
