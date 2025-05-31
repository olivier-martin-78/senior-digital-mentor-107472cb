
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { getThumbnailUrlSync, ALBUM_THUMBNAILS_BUCKET } from '@/utils/thumbnailtUtils';

interface WishPost {
  id: string;
  title: string;
  content: string;
  first_name?: string;
  age?: string;
  location?: string;
  request_type?: string;
  importance?: string;
  published?: boolean;
  created_at: string;
  cover_image?: string;
}

interface WishCardProps {
  wish: WishPost;
}

const WishCard: React.FC<WishCardProps> = ({ wish }) => {
  const isDraft = !wish.published;
  const thumbnailUrl = wish.cover_image 
    ? getThumbnailUrlSync(wish.cover_image, ALBUM_THUMBNAILS_BUCKET)
    : '/placeholder.svg';

  return (
    <Link to={`/wishes/${wish.id}`}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer h-full ${
        isDraft ? 'bg-orange-50 border-orange-200 border-2' : ''
      }`}>
        {/* Image de couverture */}
        <div className="relative">
          <AspectRatio ratio={16 / 9}>
            <img
              src={thumbnailUrl}
              alt={`Couverture de ${wish.title}`}
              className="w-full h-full object-cover rounded-t-lg"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder.svg';
              }}
            />
          </AspectRatio>
          {isDraft && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs">
                📝 Brouillon
              </Badge>
            </div>
          )}
        </div>

        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium text-tranches-charcoal line-clamp-2">
            {wish.title}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {wish.first_name && <span>{wish.first_name}</span>}
            {wish.age && <span>• {wish.age} ans</span>}
            {wish.location && <span>• {wish.location}</span>}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-gray-600 text-sm line-clamp-3 mb-3">
            {wish.content}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {wish.request_type && (
                <Badge variant="outline" className="text-xs">
                  {wish.request_type}
                </Badge>
              )}
              {wish.importance && (
                <Badge variant="outline" className="text-xs">
                  {wish.importance}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default WishCard;
