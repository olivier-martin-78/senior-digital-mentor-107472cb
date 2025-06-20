
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Edit, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ActivityCardProps {
  title: string;
  link: string;
  isYouTube: boolean;
  videoId?: string;
  thumbnailUrl?: string;
  activityDate?: string;
  showEditButton?: boolean;
  onEdit?: () => void;
  subActivityName?: string;
  iframeCode?: string;
}

const ActivityCard: React.FC<ActivityCardProps> = ({
  title,
  link,
  isYouTube,
  videoId,
  thumbnailUrl,
  activityDate,
  showEditButton = false,
  onEdit,
  subActivityName,
  iframeCode
}) => {
  const getDisplayImage = () => {
    if (thumbnailUrl) {
      return thumbnailUrl;
    }
    if (isYouTube && videoId) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    if (iframeCode) {
      // Extraire l'URL de la source de l'iframe pour récupérer l'ID de la vidéo
      const srcMatch = iframeCode.match(/src="https:\/\/www\.youtube\.com\/embed\/([^"?]+)/);
      if (srcMatch && srcMatch[1]) {
        return `https://img.youtube.com/vi/${srcMatch[1]}/maxresdefault.jpg`;
      }
    }
    return '/placeholder.svg';
  };

  const handleClick = () => {
    if (iframeCode) {
      // Ouvrir dans une nouvelle fenêtre avec le code iframe
      const newWindow = window.open('', '_blank', 'width=800,height=600');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { margin: 0; padding: 20px; background: #000; }
                iframe { width: 100%; height: 500px; }
              </style>
            </head>
            <body>
              <h2 style="color: white; text-align: center;">${title}</h2>
              ${iframeCode}
            </body>
          </html>
        `);
      }
    } else {
      window.open(link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-shadow cursor-pointer" onClick={handleClick}>
      <div className="relative">
        <img
          src={getDisplayImage()}
          alt={title}
          className="w-full h-48 object-cover rounded-t-lg"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder.svg';
          }}
        />
        {(isYouTube || iframeCode) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-t-lg">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
              <div className="w-0 h-0 border-l-8 border-l-white border-t-4 border-t-transparent border-b-4 border-b-transparent ml-1"></div>
            </div>
          </div>
        )}
        {showEditButton && onEdit && (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <CardHeader>
        <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
        {subActivityName && (
          <Badge variant="secondary" className="w-fit">
            {subActivityName}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between">
          {activityDate && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              {new Date(activityDate).toLocaleDateString('fr-FR')}
            </div>
          )}
          <ExternalLink className="h-4 w-4 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ActivityCard;
