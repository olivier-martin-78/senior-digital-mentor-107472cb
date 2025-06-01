
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
  const { user, profile, hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
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

  // Vérifications d'autorisation explicites et corrigées
  const isAuthor = user && post && user.id === post.author_id;
  const isAdmin = user && hasRole('admin');
  const isEditor = user && hasRole('editor');

  // L'utilisateur peut modifier si : il est l'auteur OU admin OU éditeur
  const canEditPost = isAuthor || isAdmin || isEditor;

  // CORRECTION IMPORTANTE : L'utilisateur peut supprimer SEULEMENT si : il est l'auteur OU admin
  // Les éditeurs ne peuvent PAS supprimer s'ils ne sont pas l'auteur
  const canDeletePost = isAuthor || isAdmin;

  // Debug logs pour vérifier les permissions
  console.log('BlogPost permissions check (CORRIGÉ):', {
    userId: user?.id,
    postAuthorId: post?.author_id,
    userEmail: user?.email,
    isAuthor,
    isAdmin,
    isEditor,
    canEditPost,
    canDeletePost: canDeletePost, // Cette valeur doit être false pour un éditeur non-auteur
    roles: user ? ['admin', 'editor', 'reader'].filter(role => hasRole(role as any)) : []
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

  // Si l'article n'est pas publié et que l'utilisateur n'est pas l'auteur ou admin
  if (!post.published && (!user || (user.id !== post.author_id && !hasRole('admin')))) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-16 flex flex-col items-center">
          <h1 className="text-3xl font-serif text-tranches-charcoal mb-4">Article non publié</h1>
          <p className="mb-8 text-gray-600">Cet article n'est pas encore publié.</p>
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
              
              {/* CORRECTION : Bouton supprimer affiché SEULEMENT pour auteur ou admin */}
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
          {/* Album thumbnail */}
          <AlbumThumbnail album={album} title={post.title} coverImage={coverImageUrl} />

          <div className="p-6">
            {/* Post header with title, author, date, categories */}
            <PostHeader 
              title={post.title}
              isPublished={post.published}
              authorProfile={post.profiles}
              createdAt={post.created_at}
              album={album}
              categories={categories}
            />

            {/* Media gallery */}
            <PostMedia media={media} />

            {/* Post Content */}
            <div className="prose max-w-none">
              {post.content.split('\n').map((paragraph, i) => (
                <p key={i} className="mb-4">{paragraph}</p>
              ))}
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-serif text-tranches-charcoal mb-6">Commentaires ({comments.length})</h2>
          
          {/* Comment Form */}
          <CommentForm 
            user={user}
            profile={profile}
            onSubmit={handleCommentSubmit}
          />

          {/* Comment List */}
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
