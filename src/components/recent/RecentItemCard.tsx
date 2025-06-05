
import React from 'react';
import { Link } from 'react-router-dom';
import { RecentItem } from '@/hooks/useRecentItems';
import { Calendar, MessageCircle, Heart, BookOpen, Camera, User } from 'lucide-react';
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
      case 'life-story':
        return <User className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const getLink = () => {
    switch (item.type) {
      case 'blog':
        return `/blog/${item.id}`;
      case 'wish':
        return `/wishes/${item.id}`;
      case 'diary':
        return `/diary/${item.id}`;
      case 'comment':
        // Pour les commentaires, utiliser post_id s'il existe, sinon fallback sur item.id
        return `/blog/${item.post_id || item.id}`;
      case 'life-story':
        return `/life-story`;
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
      case 'life-story':
        return 'Histoire de vie';
      default:
        return '';
    }
  };

  return (
    <Link to={getLink()} className="block">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
        <div className="flex">
          {/* Vignette sur le côté gauche */}
          <div className="flex-shrink-0">
            <RecentItemImage
              type={item.type}
              id={item.id}
              title={item.title}
              coverImage={item.cover_image}
              mediaUrl={item.media_url}
              className="w-48 h-32 object-cover"
            />
          </div>
          
          {/* Contenu de la carte */}
          <div className="flex-1 p-6">
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
        </div>
      </div>
    </Link>
  );
};

export default RecentItemCard;
