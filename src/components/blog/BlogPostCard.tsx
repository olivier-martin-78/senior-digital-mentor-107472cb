
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageIcon } from 'lucide-react';
import { PostWithAuthor, BlogAlbum } from '@/types/supabase';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import AlbumThumbnail from './AlbumThumbnail';
import { useAuth } from '@/contexts/AuthContext';

interface BlogPostCardProps {
  post: PostWithAuthor;
  albums: BlogAlbum[];
  postImages: Record<string, string>;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ post, albums, postImages }) => {
  const { user, hasRole } = useAuth();
  
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
  };

  // Logique de visibilité simplifiée
  const isAuthor = user?.id === post.author_id;
  const isAdmin = hasRole('admin');
  
  // Le post est visible si les nouvelles politiques RLS l'autorisent
  // (cette vérification est déjà faite côté serveur, mais on garde la logique pour l'affichage)
  const canEdit = isAuthor || isAdmin;

  // Trouver l'album associé à ce post
  const postAlbum = albums.find(a => a.id === post.album_id);

  return (
    <Card className={`overflow-hidden flex flex-col h-full ${!post.published ? 'border-orange-300 bg-orange-50' : ''}`}>
      <div className="relative w-full h-48 bg-gray-100 flex-shrink-0 overflow-hidden">
        {post.album_id ? (
          <div className="w-full h-full">
            <AlbumThumbnail 
              album={postAlbum || null}
              title={post.title}
              coverImage={post.cover_image}
            />
          </div>
        ) : (
          <img 
            src={postImages[post.id] || '/placeholder.svg'} 
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        )}
        {!post.cover_image && !post.album_id && !postImages[post.id] && (
          <div className="absolute inset-0 flex items-center justify-center">
            <ImageIcon className="h-12 w-12 text-gray-300" />
          </div>
        )}
      </div>
      
      <div className="flex flex-col flex-grow">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg leading-tight">
            <Link to={`/blog/${post.id}`} className="hover:text-tranches-sage transition-colors">
              {post.title}
            </Link>
          </CardTitle>
          <CardDescription className="text-sm">
            {post.profiles?.display_name || 'Utilisateur'} • {formatDate(post.created_at)}
            {postAlbum && (
              <span className="ml-2 text-tranches-sage">• Album: {postAlbum.name}</span>
            )}
            {!post.published && (
              <span className="ml-2 px-2 py-1 bg-orange-200 text-orange-800 text-xs rounded">
                Brouillon
              </span>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-grow pb-3">
          <p className="line-clamp-3 text-gray-600 text-sm">
            {post.content.substring(0, 150)}...
          </p>
        </CardContent>
        
        <CardFooter className="pt-0 mt-auto">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link to={`/blog/${post.id}`}>
              {!post.published && canEdit ? 'Modifier/Publier' : 'Lire la suite'}
            </Link>
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
};

export default BlogPostCard;
