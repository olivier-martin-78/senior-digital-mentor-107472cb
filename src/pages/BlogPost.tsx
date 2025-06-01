import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { useBlogPost } from '@/hooks/useBlogPost';
import PostHeader from '@/components/blog/PostHeader';
import PostMedia from '@/components/blog/PostMedia';
import CommentForm from '@/components/blog/CommentForm';
import CommentList from '@/components/blog/CommentList';
import AlbumThumbnail from '@/components/blog/AlbumThumbnail';
import { getThumbnailUrl, getThumbnailUrlSync } from '@/utils/thumbnailtUtils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useImpersonationContext } from '@/contexts/ImpersonationContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile, hasRole, getEffectiveUserId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isImpersonating, originalUser } = useImpersonationContext();
  
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasAlbumAccess, setHasAlbumAccess] = useState(false);
  
  const {
    post,
    album,
    categories,
    media,
    comments,
    loading,
    addComment,
    deleteComment
  } = useBlogPost(id as string);

  // Vérifier l'accès à l'album si le post en fait partie
  useEffect(() => {
    const checkAlbumAccess = async () => {
      if (!post || !post.album_id || !user) {
        setHasAlbumAccess(true); // Pas d'album = accès libre
        return;
      }

      try {
        // Utiliser l'ID utilisateur RÉEL (pas impersonné) pour vérifier les permissions
        const realUserId = isImpersonating ? originalUser?.id : user.id;
        
        if (!realUserId) {
          setHasAlbumAccess(false);
          return;
        }

        // Vérifier si l'utilisateur réel est propriétaire de l'album
        const { data: albumData } = await supabase
          .from('blog_albums')
          .select('author_id')
          .eq('id', post.album_id)
          .single();

        if (albumData && albumData.author_id === realUserId) {
          setHasAlbumAccess(true);
          return;
        }

        // Vérifier les permissions d'album pour l'utilisateur réel
        const { data: permissions } = await supabase
          .from('album_permissions')
          .select('id')
          .eq('album_id', post.album_id)
          .eq('user_id', realUserId)
          .maybeSingle();

        setHasAlbumAccess(!!permissions);
      } catch (error) {
        console.error('Erreur lors de la vérification des permissions d\'album:', error);
        setHasAlbumAccess(false);
      }
    };

    checkAlbumAccess();
  }, [post, user, isImpersonating, originalUser]);

  // Charger l'URL de l'image de couverture si elle existe
  useEffect(() => {
    if (post?.cover_image) {
      const loadCoverImage = async () => {
        try {
          const url = await getThumbnailUrl(post.cover_image);
          setCoverImageUrl(url);
        } catch (error) {
          console.error("Erreur lors du chargement de l'image de couverture:", error);
          setCoverImageUrl('/placeholder.svg');
        }
      };
      loadCoverImage();
    } else {
      setCoverImageUrl(null);
    }
  }, [post?.cover_image]);

  const handleCommentSubmit = async (content: string) => {
    if (!user) return;
    await addComment(content, user.id);
  };

  const handleDeletePost = async () => {
    if (!post || !user) return;
    
    try {
      setIsDeleting(true);
      
      // Supprimer d'abord les médias associés
      const { error: mediaError } = await supabase
        .from('blog_media')
        .delete()
        .eq('post_id', post.id);
      
      if (mediaError) throw mediaError;
      
      // Supprimer les commentaires
      const { error: commentsError } = await supabase
        .from('blog_comments')
        .delete()
        .eq('post_id', post.id);
      
      if (commentsError) throw commentsError;
      
      // Supprimer les associations catégories
      const { error: categoriesError } = await supabase
        .from('post_categories')
        .delete()
        .eq('post_id', post.id);
      
      if (categoriesError) throw categoriesError;
      
      // Supprimer le post
      const { error: postError } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', post.id);
      
      if (postError) throw postError;
      
      toast({
        title: "Article supprimé",
        description: "L'article a été supprimé avec succès."
      });
      
      navigate('/blog');
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'article.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // PERMISSIONS CORRIGÉES : utiliser l'utilisateur RÉEL pour les vérifications
  const effectiveUserId = getEffectiveUserId();
  const realUserId = isImpersonating ? originalUser?.id : user?.id;
  
  // Vérifier si l'utilisateur RÉEL est l'auteur
  const isRealAuthor = realUserId && post && realUserId === post.author_id;
  
  // Vérifier si l'utilisateur RÉEL est admin (pas via impersonnation)
  const isRealAdmin = !isImpersonating && user && hasRole('admin');
  
  // Vérifier si l'utilisateur RÉEL est éditeur (pas via impersonnation)
  const isRealEditor = !isImpersonating && user && hasRole('editor');

  // PERMISSIONS DE MODIFICATION : auteur réel OU admin réel OU éditeur réel
  const canEditPost = isRealAuthor || isRealAdmin || isRealEditor;

  // PERMISSIONS DE SUPPRESSION : SEULEMENT auteur réel OU admin réel
  const canDeletePost = isRealAuthor || isRealAdmin;

  // VÉRIFICATION DE VISIBILITÉ : doit avoir accès à l'album
  const canViewPost = hasAlbumAccess && (
    post?.published || 
    isRealAuthor || 
    isRealAdmin ||
    (isImpersonating && hasRole('admin')) // Admin peut voir via impersonnation
  );

  console.log('BlogPost permissions (CORRIGÉES):', {
    realUserId,
    effectiveUserId,
    isImpersonating,
    postAuthorId: post?.author_id,
    isRealAuthor,
    isRealAdmin,
    isRealEditor,
    canEditPost,
    canDeletePost,
    canViewPost,
    hasAlbumAccess,
    albumId: post?.album_id
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center">
          <h1 className="text-3xl font-serif text-tranches-charcoal mb-4">Article non trouvé</h1>
          <p className="mb-8 text-gray-600">L'article que vous recherchez n'existe pas ou a été supprimé.</p>
          <Button asChild>
            <Link to="/blog">Retour au blog</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur peut voir ce post
  if (!canViewPost) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center">
          <h1 className="text-3xl font-serif text-tranches-charcoal mb-4">Accès refusé</h1>
          <p className="mb-8 text-gray-600">
            {post.album_id 
              ? "Vous n'avez pas accès à cet album." 
              : "Cet article n'est pas encore publié."
            }
          </p>
          <Button asChild>
            <Link to="/blog">Retour au blog</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-4 flex justify-between items-center">
          <Link to="/blog" className="text-tranches-sage hover:underline">
            &larr; Retour au blog
          </Link>
          {(canEditPost || canDeletePost) && (
            <div className="flex gap-2">
              {canEditPost && (
                <Button asChild variant="outline">
                  <Link to={`/blog/edit/${post.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                  </Link>
                </Button>
              )}
              
              {canDeletePost && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-red-600 hover:text-red-700">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Supprimer l'article</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer cet article ? Cette action est irréversible.
                        Tous les commentaires et médias associés seront également supprimés.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeletePost}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? 'Suppression...' : 'Supprimer'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          )}
        </div>

        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          <AlbumThumbnail album={album} title={post.title} coverImage={coverImageUrl} />

          <div className="p-6">
            <PostHeader 
              title={post.title}
              isPublished={post.published}
              authorProfile={post.profiles}
              createdAt={post.created_at}
              album={album}
              categories={categories}
            />

            <PostMedia media={media} />

            <div className="prose max-w-none">
              {post.content.split('\n').map((paragraph, i) => (
                <p key={i} className="mb-4">{paragraph}</p>
              ))}
            </div>
          </div>
        </article>

        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-serif text-tranches-charcoal mb-6">Commentaires ({comments.length})</h2>
          
          <CommentForm 
            user={user}
            profile={profile}
            onSubmit={handleCommentSubmit}
          />

          <CommentList 
            comments={comments}
            currentUserId={user?.id}
            isAdmin={hasRole('admin')}
            onDelete={deleteComment}
          />
        </section>
      </div>
    </div>
  );
};

export default BlogPost;
