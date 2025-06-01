
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageIcon } from 'lucide-react';
import { PostWithAuthor, BlogAlbum } from '@/types/supabase';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import AlbumThumbnail from './AlbumThumbnail';
import { useAuth } from '@/contexts/AuthContext';
import { useImpersonationContext } from '@/contexts/ImpersonationContext';
import { supabase } from '@/integrations/supabase/client';

interface BlogPostCardProps {
  post: PostWithAuthor;
  albums: BlogAlbum[];
  postImages: Record<string, string>;
  userId?: string;
}

const BlogPostCard: React.FC<BlogPostCardProps> = ({ post, albums, postImages, userId }) => {
  const { user, hasRole, getEffectiveUserId } = useAuth();
  const { isImpersonating, originalUser } = useImpersonationContext();
  const [hasAlbumAccess, setHasAlbumAccess] = useState(false);
  
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
  };

  // Vérifier l'accès à l'album
  useEffect(() => {
    const checkAlbumAccess = async () => {
      if (!post.album_id || !user) {
        console.log('🔍 BlogPostCard - Pas d\'album ou pas d\'utilisateur:', {
          postId: post.id,
          postTitle: post.title,
          albumId: post.album_id,
          hasUser: !!user
        });
        setHasAlbumAccess(true); // Pas d'album = accès libre
        return;
      }

      try {
        // CORRECTION PRINCIPALE : Utiliser l'ID utilisateur EFFECTIF (impersonné) pour vérifier les permissions
        const effectiveUserId = getEffectiveUserId();
        
        console.log('🔍 BlogPostCard - CORRECTION - Vérification accès album:', {
          postId: post.id,
          postTitle: post.title,
          albumId: post.album_id,
          effectiveUserId,
          realUserId: isImpersonating ? originalUser?.id : user?.id,
          isImpersonating,
          userEmail: user.email
        });

        // Vérifier si l'utilisateur EFFECTIF (impersonné) est propriétaire de l'album
        const { data: albumData } = await supabase
          .from('blog_albums')
          .select('author_id')
          .eq('id', post.album_id)
          .single();

        if (albumData && albumData.author_id === effectiveUserId) {
          console.log('✅ BlogPostCard - CORRECTION - Utilisateur effectif propriétaire de l\'album:', {
            postId: post.id,
            albumId: post.album_id,
            albumAuthorId: albumData.author_id,
            effectiveUserId
          });
          setHasAlbumAccess(true);
          return;
        }

        // Vérifier les permissions d'album pour l'utilisateur EFFECTIF (impersonné)
        const { data: permissions } = await supabase
          .from('album_permissions')
          .select('id')
          .eq('album_id', post.album_id)
          .eq('user_id', effectiveUserId)
          .maybeSingle();

        const hasPermission = !!permissions;
        console.log('🔍 BlogPostCard - CORRECTION - Résultat vérification permissions:', {
          postId: post.id,
          albumId: post.album_id,
          effectiveUserId,
          hasPermission,
          permissionId: permissions?.id
        });

        setHasAlbumAccess(hasPermission);
      } catch (error) {
        console.error('❌ BlogPostCard - CORRECTION - Erreur lors de la vérification des permissions d\'album:', error);
        setHasAlbumAccess(false);
      }
    };

    checkAlbumAccess();
  }, [post.album_id, user, isImpersonating, originalUser, getEffectiveUserId]);

  const effectiveUserId = getEffectiveUserId();
  const realUserId = isImpersonating ? originalUser?.id : user?.id;

  // Logique de visibilité CORRIGÉE
  const isEffectiveAuthor = effectiveUserId && post.author_id === effectiveUserId;
  const isRealAdmin = !isImpersonating && hasRole('admin');
  
  // CORRECTION PRINCIPALE : Le post est visible si :
  // 1. Il est publié ET l'utilisateur (impersonné) a accès à l'album
  // 2. OU l'utilisateur effectif (impersonné) est l'auteur
  // 3. OU l'utilisateur réel est admin ET pas en impersonnation
  const isVisible = (post.published && hasAlbumAccess) || 
                   isEffectiveAuthor || 
                   isRealAdmin;
  
  console.log('🎯 BlogPostCard - CORRECTION - Calcul visibilité:', {
    postId: post.id,
    postTitle: post.title,
    postAuthorId: post.author_id,
    effectiveUserId,
    realUserId,
    isImpersonating,
    published: post.published,
    hasAlbumAccess,
    isEffectiveAuthor,
    isRealAdmin,
    isVisible,
    albumId: post.album_id
  });
  
  if (!isVisible) {
    console.log('🚫 BlogPostCard - CORRECTION - Post non visible, masqué:', {
      postId: post.id,
      postTitle: post.title,
      reason: !post.published ? 'Non publié' : !hasAlbumAccess ? 'Pas d\'accès album' : 'Autres raisons'
    });
    return null;
  }

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
            {!post.published && isEffectiveAuthor ? 'Modifier/Publier' : 'Lire la suite'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default BlogPostCard;
