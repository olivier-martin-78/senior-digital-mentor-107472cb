
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
  userId?: string;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ post, albums, postImages, userId }) => {
  const { user, hasRole, getEffectiveUserId } = useAuth();
  
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
  };

  const effectiveUserId = getEffectiveUserId();
  const originalUserId = user?.id;

  // SIMPLIFICATION: Logique de visibilité simplifiée et corrigée
  const isAuthor = effectiveUserId && post.author_id === effectiveUserId;
  const isAdmin = hasRole('admin');
  
  console.log('🔍 BlogPostCard - ANALYSE VISIBILITÉ SIMPLIFIÉE:', {
    postId: post.id,
    title: post.title,
    published: post.published,
    authorId: post.author_id,
    authorEmail: post.profiles?.email || 'Email non disponible',
    effectiveUserId: effectiveUserId,
    isAuthor,
    isAdmin,
    albumId: post.album_id
  });
  
  // CORRECTION: Logique de visibilité corrigée
  // - Les posts publiés sont visibles pour tous les utilisateurs ayant accès à l'album
  // - Les brouillons ne sont visibles que par leur auteur ou les admins
  const isVisible = post.published || isAuthor || isAdmin;
  
  console.log('🔍 BlogPostCard - RÉSULTAT VISIBILITÉ CORRIGÉ:', {
    postId: post.id,
    title: post.title,
    published: post.published,
    isAuthor,
    isAdmin,
    isVisible,
    raisonVisibilité: post.published ? 'Post publié - visible par tous' : (isAuthor ? 'Auteur du post' : (isAdmin ? 'Utilisateur admin' : 'Non visible')),
    authorEmail: post.profiles?.email || 'Email non disponible'
  });
  
  if (!isVisible) {
    console.log('🚫 BlogPostCard - Post non visible, ignoré:', {
      postId: post.id,
      title: post.title,
      authorEmail: post.profiles?.email || 'Email non disponible'
    });
    return null;
  }

  console.log('✅ BlogPostCard - Post visible, rendu en cours:', {
    postId: post.id,
    title: post.title,
    authorEmail: post.profiles?.email || 'Email non disponible'
  });

  // Trouver l'album associé à ce post
  const postAlbum = albums.find(a => a.id === post.album_id);

  return (
    <Card className={`overflow-hidden ${!post.published ? 'border-orange-300 bg-orange-50' : ''}`}>
      <div className="relative w-full h-40 bg-gray-100">
        {post.album_id ? (
          <AlbumThumbnail 
            album={postAlbum || null}
            title={post.title}
            coverImage={post.cover_image}
          />
        ) : (
          <img 
            src={postImages[post.id] || '/placeholder.svg'} 
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Post image failed to load:', postImages[post.id]);
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
      <CardHeader>
        <CardTitle>
          <Link to={`/blog/${post.id}`} className="hover:text-tranches-sage transition-colors">
            {post.title}
          </Link>
        </CardTitle>
        <CardDescription>
          {post.profiles?.display_name || 'Utilisateur'} • {formatDate(post.created_at)}
          {/* Affichage du nom de l'album pour tous les utilisateurs */}
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
      <CardContent>
        <p className="line-clamp-3 text-gray-600">
          {post.content.substring(0, 150)}...
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline">
          <Link to={`/blog/${post.id}`}>
            {!post.published && isAuthor ? 'Modifier/Publier' : 'Lire la suite'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BlogPostCard;
