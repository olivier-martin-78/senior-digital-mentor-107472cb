import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, User, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface GlobalContentCardProps {
  content: {
    id: string;
    title: string;
    type: 'blog' | 'diary' | 'wish' | 'life-story';
    author_name: string;
    created_at: string;
    content_preview?: string;
  };
}

const GlobalContentCard: React.FC<GlobalContentCardProps> = ({ content }) => {
  const getContentUrl = () => {
    switch (content.type) {
      case 'blog':
        return `/blog/${content.id}`;
      case 'diary':
        return `/diary/${content.id}`;
      case 'wish':
        return `/wishes/${content.id}`;
      case 'life-story':
        return `/life-story`;
      default:
        return '#';
    }
  };

  const getTypeLabel = () => {
    switch (content.type) {
      case 'blog':
        return 'Article';
      case 'diary':
        return 'Journal';
      case 'wish':
        return 'Souhait';
      case 'life-story':
        return 'Histoire de vie';
      default:
        return 'Contenu';
    }
  };

  const getTypeColor = () => {
    switch (content.type) {
      case 'blog':
        return 'bg-blue-100 text-blue-800';
      case 'diary':
        return 'bg-green-100 text-green-800';
      case 'wish':
        return 'bg-purple-100 text-purple-800';
      case 'life-story':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Link to={getContentUrl()}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-medium text-gray-900 line-clamp-2">
                {content.title}
              </CardTitle>
              <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                <User className="h-4 w-4" />
                <span>Par {content.author_name}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <Badge className={getTypeColor()}>
                {getTypeLabel()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Globe className="h-3 w-3 mr-1" />
                Global
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {content.content_preview && (
            <p className="text-sm text-gray-600 line-clamp-3 mb-3">
              {content.content_preview}
            </p>
          )}
          
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(content.created_at)}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default GlobalContentCard;