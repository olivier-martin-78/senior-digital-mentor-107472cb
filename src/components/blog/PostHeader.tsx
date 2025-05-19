
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BlogAlbum, BlogCategory, Profile } from '@/types/supabase';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Folder } from 'lucide-react';

interface PostHeaderProps {
  title: string;
  isPublished: boolean;
  authorProfile: Profile | null;
  createdAt: string;
  album: BlogAlbum | null;
  categories: BlogCategory[];
}

export const getInitials = (name: string | null) => {
  if (!name) return '??';
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2);
};

export const formatDate = (dateString: string) => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
};

const PostHeader: React.FC<PostHeaderProps> = ({
  title,
  isPublished,
  authorProfile,
  createdAt,
  album,
  categories
}) => {
  return (
    <>
      <h1 className="text-3xl md:text-4xl font-serif text-tranches-charcoal mb-4">
        {title}
        {!isPublished && <span className="ml-2 text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded">Brouillon</span>}
      </h1>
    
      <div className="flex flex-wrap items-center mb-4 gap-2">
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={authorProfile?.avatar_url || undefined} alt={authorProfile?.display_name || 'Auteur'} />
          <AvatarFallback>{getInitials(authorProfile?.display_name)}</AvatarFallback>
        </Avatar>
        <span className="text-gray-600">
          {authorProfile?.display_name || 'Utilisateur'} • Publié {formatDate(createdAt)}
        </span>
      </div>

      {/* Album and Categories */}
      <div className="flex flex-wrap gap-2 mb-6">
        {album && (
          <div className="flex items-center text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
            <Folder className="h-3 w-3 mr-1" />
            <span>Album: {album.name}</span>
          </div>
        )}
        {categories.map(category => (
          <Badge key={category.id} variant="secondary">
            {category.name}
          </Badge>
        ))}
      </div>
    </>
  );
};

export default PostHeader;
