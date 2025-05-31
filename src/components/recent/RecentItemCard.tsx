
import React from 'react';
import { Link } from 'react-router-dom';
import { RecentItem } from '@/hooks/useRecentItems';
import { Calendar, MessageCircle, Heart, BookOpen, Camera } from 'lucide-react';
import RecentItemImage from '@/components/RecentItemImage';

interface RecentItemCardProps {
  item: RecentItem;
}

const RecentItemCard = ({ item }: RecentItemCardProps) => {
  const getIcon = () => {
    switch (item.type) {
      case 'blog':
        return <Camera className="w-5 h-5" />;
      case 'wish':
        return <Heart className="w-5 h-5" />;
      case 'diary':
        return <BookOpen className="w-5 h-5" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const getLink = () => {
    switch (item.type) {
      case 'blog':
        return `/blog/post/${item.id}`;
      case 'wish':
        return `/wishes/post/${item.id}`;
      case 'diary':
        return `/diary/entry/${item.id}`;
      case 'comment':
        // Pour les commentaires, on redirige vers l'article
        return `/blog/post/${item.id}`;
      default:
        return '#';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case 'blog':
        return 'Article de blog';
      case 'wish':
        return 'Souhait';
      case 'diary':
        return 'Entrée de journal';
      case 'comment':
        return 'Commentaire';
      default:
        return '';
    }
  };

  return (
    <Link to={getLink()} className="block">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="text-tranches-sage">
              {getIcon()}
            </div>
            <span className="text-sm text-gray-500 uppercase tracking-wide">
              {getTypeLabel()}
            </span>
          </div>
          <div className="text-sm text-gray-500">
            {formatDate(item.created_at)}
          </div>
        </div>

        <h3 className="text-lg font-medium text-tranches-charcoal mb-2 line-clamp-2">
          {item.title}
        </h3>

        {item.content_preview && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-3">
            {item.content_preview}
          </p>
        )}

        {item.cover_image && (
          <div className="mb-3">
            <RecentItemImage src={item.cover_image} alt={item.title} />
          </div>
        )}

        {item.media_url && (
          <div className="mb-3">
            <RecentItemImage src={item.media_url} alt={item.title} />
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            {item.author && (
              <span>Par {item.author}</span>
            )}
            {item.first_name && (
              <span>De {item.first_name}</span>
            )}
            {item.album_name && (
              <span className="bg-tranches-sage/10 text-tranches-sage px-2 py-1 rounded-full text-xs">
                Album: {item.album_name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RecentItemCard;
