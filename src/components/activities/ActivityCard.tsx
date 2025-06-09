
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Play, Calendar } from 'lucide-react';

interface ActivityCardProps {
  title: string;
  link: string;
  isYouTube?: boolean;
  videoId?: string;
  thumbnailUrl?: string;
  activityDate?: string;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ 
  title, 
  link, 
  isYouTube, 
  videoId, 
  thumbnailUrl,
  activityDate 
}) => {
  const handleClick = () => {
    window.open(link, '_blank', 'noopener,noreferrer');
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
    <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleClick}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          {title}
          {isYouTube ? (
            <Play className="h-5 w-5 text-red-500" />
          ) : (
            <ExternalLink className="h-5 w-5 text-tranches-sage" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {thumbnailSrc ? (
          <div className="aspect-video mb-3">
            <img
              src={thumbnailSrc}
              alt={title}
              className="w-full h-full object-cover rounded-md"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center mb-3">
            <ExternalLink className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        {activityDate && (
          <div className="flex items-center gap-1 text-sm text-blue-600 mb-2">
            <Calendar className="h-4 w-4" />
            {new Date(activityDate).toLocaleDateString()}
          </div>
        )}
        
        <p className="text-sm text-gray-600 truncate">{link}</p>
      </CardContent>
    </Card>
  );
};

export default ActivityCard;
