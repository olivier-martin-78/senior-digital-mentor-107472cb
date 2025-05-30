
import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RecentItemImage from '@/components/RecentItemImage';
import { RecentItem } from '@/hooks/useRecentItems';
import { getItemLink, getTypeLabel, getTypeColor } from '@/utils/recentUtils';

interface RecentItemCardProps {
  item: RecentItem;
}

const RecentItemCard: React.FC<RecentItemCardProps> = ({ item }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex">
        <RecentItemImage
          type={item.type}
          id={item.id}
          title={item.title}
          coverImage={item.cover_image}
          mediaUrl={item.media_url}
        />
        <div className="flex-1">
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl text-tranches-charcoal">
                <Link to={getItemLink(item)} className="hover:text-tranches-sage">
                  {item.title}
                </Link>
              </CardTitle>
              <Badge className={`text-white ${getTypeColor(item.type)}`}>
                {getTypeLabel(item.type)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {item.content_preview && (
              <p className="text-gray-600 mb-4 line-clamp-2">
                {item.content_preview}
              </p>
            )}
            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Par {item.author}</span>
              <span>{format(new Date(item.created_at), 'dd MMMM yyyy', { locale: fr })}</span>
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
};

export default RecentItemCard;
