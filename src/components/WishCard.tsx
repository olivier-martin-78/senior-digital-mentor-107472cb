
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

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
}

interface WishCardProps {
  wish: WishPost;
}

const WishCard: React.FC<WishCardProps> = ({ wish }) => {
  const isDraft = !wish.published;

  return (
    <Link to={`/wishes/${wish.id}`}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer h-full ${
        isDraft ? 'bg-orange-50 border-orange-200 border-2' : ''
      }`}>
        <CardHeader>
          <CardTitle className="text-lg font-medium text-tranches-charcoal line-clamp-2">
            {wish.title}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {wish.first_name && <span>{wish.first_name}</span>}
            {wish.age && <span>• {wish.age} ans</span>}
            {wish.location && <span>• {wish.location}</span>}
          </div>
        </CardHeader>
        <CardContent>
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
            {isDraft && (
              <span className="text-xs text-orange-600 font-medium">📝 Brouillon</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default WishCard;
