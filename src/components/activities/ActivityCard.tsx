
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Play, Calendar, Edit } from 'lucide-react';

interface ActivityCardProps {
  title: string;
  link: string;
  isYouTube?: boolean;
  videoId?: string;
  thumbnailUrl?: string;
  activityDate?: string;
  showEditButton?: boolean;
  onEdit?: () => void;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ 
  title, 
  link, 
  isYouTube, 
  videoId, 
  thumbnailUrl,
  activityDate,
  showEditButton = false,
  onEdit
}) => {
  const handleCardClick = () => {
    if (isYouTube) {
      // Pour YouTube, ouvrir directement la vidéo
      window.open(link, '_blank', 'noopener,noreferrer');
    } else {
      // Pour les autres liens, ouvrir dans un nouvel onglet
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la propagation vers le clic de la carte
    onEdit?.();
  };

  const getThumbnailUrl = () => {
    if (thumbnailUrl) return thumbnailUrl;
    if (isYouTube && videoId) {
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return null;
  };

  const thumbnailSrc = getThumbnailUrl();

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow group relative">
      {showEditButton && (
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleEditClick}
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
      
      <div onClick={handleCardClick}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between cursor-pointer">
            {title}
            {isYouTube ? (
              <Play className="h-5 w-5 text-red-500" />
            ) : (
              <ExternalLink className="h-5 w-5 text-tranches-sage" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="cursor-pointer" onClick={handleCardClick}>
            {thumbnailSrc ? (
              <div className="aspect-video mb-3 relative overflow-hidden rounded-md group">
                <img
                  src={thumbnailSrc}
                  alt={title}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                {isYouTube && (
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-3 group-hover:bg-gray-200 transition-colors">
                {isYouTube ? (
                  <Play className="h-12 w-12 text-red-400" />
                ) : (
                  <ExternalLink className="h-12 w-12 text-gray-400" />
                )}
              </div>
            )}
          </div>
          
          {activityDate && (
            <div className="flex items-center gap-1 text-sm text-blue-600 mb-2">
              <Calendar className="h-4 w-4" />
              {new Date(activityDate).toLocaleDateString()}
            </div>
          )}
          
          <p className="text-sm text-gray-600 truncate">{link}</p>
        </CardContent>
      </div>
    </Card>
  );
};

export default ActivityCard;
