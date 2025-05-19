
import React, { useState } from 'react';
import { getPublicUrl } from '@/utils/storageUtils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ImageIcon, FileIcon, MusicIcon, VideoIcon } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import LoadingSpinner from './LoadingSpinner';

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
            <div className="flex justify-center items-center py-16">
              <LoadingSpinner size="md" />
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
              }}
              onLoad={() => {
                console.log("Image chargée avec succès:", completeMediaUrl);
                setIsLoading(false);
              }}
              style={{ display: hasError ? 'none' : 'block' }}
            />
            {hasError && (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100 p-8">
                <ImageIcon size={48} className="text-gray-400 mb-2" />
                <p className="font-medium text-gray-500">Impossible de charger l'image</p>
                <p className="text-sm text-gray-400 mt-1">Vérifiez que le fichier existe et est accessible</p>
                <a 
                  href={completeMediaUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="mt-4 text-sm text-tranches-sage hover:underline"
                >
                  Essayer d'ouvrir directement
                </a>
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
                setHasError(true);
              }}
            >
              Votre navigateur ne prend pas en charge la lecture vidéo.
            </video>
            {hasError && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-400 p-8">
                <VideoIcon size={48} className="mb-2" />
                <p className="font-medium text-gray-500">Impossible de charger la vidéo</p>
                <p className="text-sm text-gray-400 mt-1">Vérifiez que le fichier existe et est accessible</p>
                <a 
                  href={completeMediaUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="mt-4 text-sm text-tranches-sage hover:underline"
                >
                  Essayer d'ouvrir directement
                </a>
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
            <Alert variant="destructive" className="mt-2">
              <AlertTitle>Impossible de charger le fichier audio</AlertTitle>
              <AlertDescription>
                Vérifiez que le fichier existe et est accessible.
                <div className="mt-2">
                  <a 
                    href={completeMediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm underline"
                  >
                    Essayer d'ouvrir directement
                  </a>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      );
    }
    
    // Pour les autres types de médias
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
      <Alert variant="destructive" className="mt-6">
        <AlertTitle>Erreur de chargement du média</AlertTitle>
        <AlertDescription>
          Une erreur s'est produite lors du chargement du média. Veuillez réessayer plus tard.
        </AlertDescription>
      </Alert>
    );
  }
};

export default EntryMedia;
