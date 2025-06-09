
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Play } from 'lucide-react';

interface ActivityCardProps {
  title: string;
  link: string;
  isYouTube?: boolean;
  videoId?: string;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ title, link, isYouTube, videoId }) => {
  const handleClick = () => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

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
        {isYouTube && videoId ? (
          <div className="aspect-video">
            <img
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt={title}
              className="w-full h-full object-cover rounded-md"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gray-100 rounded-md flex items-center justify-center">
            <ExternalLink className="h-12 w-12 text-gray-400" />
          </div>
        )}
        <p className="text-sm text-gray-600 mt-2 truncate">{link}</p>
      </CardContent>
    </Card>
  );
};

export default ActivityCard;
