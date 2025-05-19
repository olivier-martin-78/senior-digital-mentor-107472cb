
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Image } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DiaryEntry } from '@/types/diary';
import { getThumbnailUrl, getThumbnailUrlSync, DIARY_MEDIA_BUCKET } from '@/utils/thumbnailtUtils';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface EntryCardProps {
  entry: DiaryEntry;
}

const EntryCard: React.FC<EntryCardProps> = ({ entry }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  
  // Vérifier si le média est une image ou une vidéo
  const isVisualMedia = entry.media_type?.startsWith('image/') || entry.media_type?.startsWith('video/');
  
  // Pour déboguer
  useEffect(() => {
    if (entry.media_url) {
      console.log("URL du média dans EntryCard:", entry.media_url);
      console.log("Type du média dans EntryCard:", entry.media_type);
      
      // Définir une URL initiale synchrone pour un chargement rapide
      const initialUrl = getThumbnailUrlSync(entry.media_url, DIARY_MEDIA_BUCKET);
      setThumbnailUrl(initialUrl);
      
      // Récupérer l'URL du thumbnail de façon asynchrone pour une meilleure qualité
      const loadThumbnail = async () => {
        try {
          const url = await getThumbnailUrl(entry.media_url, DIARY_MEDIA_BUCKET);
          console.log("URL générée:", url);
          setThumbnailUrl(url);
        } catch (error) {
          console.error("Erreur lors de la récupération de l'URL:", error);
          setImageError(true);
          setIsLoading(false);
        }
      };
      
      loadThumbnail();
    }
  }, [entry.media_url, entry.media_type]);
  
  return (
    <Link 
      to={`/diary/${entry.id}`} 
      className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center mb-4 text-sm text-gray-500">
        <Calendar className="h-4 w-4 mr-2" />
        {entry.entry_date && format(parseISO(entry.entry_date), "d MMMM yyyy", { locale: fr })}
      </div>
      <h3 className="font-medium text-xl mb-2 text-tranches-charcoal">{entry.title}</h3>
      
      {isVisualMedia && entry.media_url && (
        <div className="mt-2 mb-3 border border-gray-100 rounded-lg overflow-hidden bg-gray-50">
          <AspectRatio ratio={16/9}>
            {entry.media_type?.startsWith('image/') ? (
              <>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="w-8 h-8 border-4 border-tranches-sage border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                {thumbnailUrl && (
                  <img 
                    src={thumbnailUrl} 
                    alt="Aperçu du média"
                    className={`w-full h-full object-cover ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      console.error("Erreur de chargement d'image dans EntryCard:", entry.media_url);
                      console.log("URL d'image qui a échoué:", target.src);
                      setImageError(true);
                      setIsLoading(false);
                    }}
                    onLoad={() => {
                      console.log("Image chargée avec succès dans EntryCard");
                      setIsLoading(false);
                    }}
                    style={{ display: imageError ? 'none' : 'block' }}
                  />
                )}
                {imageError && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-gray-100">
                    <Image className="h-10 w-10 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Image non disponible</span>
                  </div>
                )}
              </>
            ) : entry.media_type?.startsWith('video/') ? (
              <div className="relative bg-gray-100 w-full h-full">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Image className="h-10 w-10 text-gray-400" />
                </div>
              </div>
            ) : null}
          </AspectRatio>
        </div>
      )}
      
      {entry.media_url && !isVisualMedia && (
        <div className="mt-2 flex items-center text-sm text-gray-500">
          <Image className="h-4 w-4 mr-2" />
          {entry.media_type?.startsWith('audio/') ? (
            'Audio attaché'
          ) : (
            'Média attaché'
          )}
        </div>
      )}
      
      {entry.mood_rating && (
        <div className="flex items-center mt-4">
          <div className="text-sm mr-2">Humeur:</div>
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <span 
                key={i} 
                className={`w-4 h-4 rounded-full mx-0.5 ${i < entry.mood_rating! ? 'bg-yellow-400' : 'bg-gray-200'}`}
              ></span>
            ))}
          </div>
        </div>
      )}
      
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-4">
          {entry.tags.map((tag, idx) => (
            <span 
              key={idx} 
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
};

export default EntryCard;
