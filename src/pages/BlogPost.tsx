import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PostWithAuthor, CommentWithAuthor, BlogMedia, BlogCategory, BlogAlbum } from '@/types/supabase';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Send, Folder, Image as ImageIcon } from 'lucide-react';
import { getThumbnailUrl } from '@/utils/thumbnailtUtils';

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile, hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [album, setAlbum] = useState<BlogAlbum | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [media, setMedia] = useState<BlogMedia[]>([]);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [commentContent, setCommentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPostDetails = async () => {
      try {
        // Fetch post with author
        const { data: postData, error: postError } = await supabase
          .from('blog_posts')
          .select(`
            *,
            profiles:author_id(*)
          `)
          .eq('id', id as string)
          .single();

        if (postError) {
          console.error('Error fetching post:', postError);
          toast({
            title: "Erreur",
            description: "L'article n'a pas pu être chargé.",
            variant: "destructive"
          });
          navigate('/blog');
          return;
        }

        setPost(postData as PostWithAuthor);

        // If post has an album, fetch it
        if (postData.album_id) {
          const { data: albumData } = await supabase
            .from('blog_albums')
            .select('*')
            .eq('id', postData.album_id)
            .single();
          
          setAlbum(albumData as BlogAlbum);
        }

        // Fetch categories for this post
        const { data: postCategoriesData } = await supabase
          .from('post_categories')
          .select(`
            category_id,
            blog_categories:category_id(*)
          `)
          .eq('post_id', id as string);

        if (postCategoriesData) {
          const fetchedCategories = postCategoriesData.map(item => item.blog_categories) as BlogCategory[];
          setCategories(fetchedCategories);
        }

        // Fetch media
        const { data: mediaData, error: mediaError } = await supabase
          .from('blog_media')
          .select('*')
          .eq('post_id', id as string);

        if (!mediaError) {
          setMedia(mediaData as BlogMedia[]);
        }

        // Fetch comments with authors
        const { data: commentsData, error: commentsError } = await supabase
          .from('blog_comments')
          .select(`
            *,
            profiles:author_id(*)
          `)
          .eq('post_id', id as string)
          .order('created_at', { ascending: true });

        if (!commentsError) {
          setComments(commentsData as CommentWithAuthor[]);
        }

      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du chargement de l'article.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPostDetails();
    }
  }, [id, navigate, toast]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Non connecté",
        description: "Vous devez être connecté pour commenter.",
        variant: "destructive"
      });
      return;
    }

    if (!commentContent.trim()) {
      toast({
        title: "Commentaire vide",
        description: "Votre commentaire ne peut pas être vide.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const { data, error } = await supabase
        .from('blog_comments')
        .insert({
          post_id: id as string,
          author_id: user.id,
          content: commentContent.trim()
        })
        .select(`
          *,
          profiles:author_id(*)
        `)
        .single();

      if (error) {
        throw error;
      }

      setComments([...comments, data as CommentWithAuthor]);
      setCommentContent('');
      
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié avec succès."
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la publication du commentaire.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('blog_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        throw error;
      }

      setComments(comments.filter(comment => comment.id !== commentId));
      
      toast({
        title: "Commentaire supprimé",
        description: "Le commentaire a été supprimé avec succès."
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression du commentaire.",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: fr });
  };

  // Ajout de cette fonction pour récupérer l'URL de la vignette de l'album
  const getAlbumThumbnailUrl = (album: BlogAlbum | null): string => {
    if (!album || !album.thumbnail_url) {
      return '/placeholder.svg';
    }
    return getThumbnailUrl(album.thumbnail_url);
  };

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
          {(user?.id === post.author_id || hasRole('admin')) && (
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to={`/blog/edit/${post.id}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Modifier
                </Link>
              </Button>
            </div>
          )}
        </div>

        <article className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Ajout de la vignette en haut de l'article si l'album en a une */}
          {album && album.thumbnail_url && (
            <div className="w-full h-64 relative">
              <img 
                src={getAlbumThumbnailUrl(album)} 
                alt={post.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder.svg';
                }}
              />
            </div>
          )}

          <div className="p-6">
            <h1 className="text-3xl md:text-4xl font-serif text-tranches-charcoal mb-4">
              {post.title}
              {!post.published && <span className="ml-2 text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded">Brouillon</span>}
            </h1>
          
            <div className="flex flex-wrap items-center mb-4 gap-2">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={profile?.avatar_url || undefined} alt={post.profiles?.display_name || 'Auteur'} />
                <AvatarFallback>{getInitials(post.profiles?.display_name)}</AvatarFallback>
              </Avatar>
              <span className="text-gray-600">
                {post.profiles?.display_name || 'Utilisateur'} • Publié {formatDate(post.created_at)}
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

            {/* Media Gallery */}
            {media.length > 0 && (
              <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {media.map(item => (
                  <div key={item.id} className="rounded-lg overflow-hidden">
                    {item.media_type.startsWith('image/') ? (
                      <img
                        src={item.media_url}
                        alt="Media du post"
                        className="w-full h-48 object-cover"
                      />
                    ) : item.media_type.startsWith('video/') ? (
                      <video
                        src={item.media_url}
                        controls
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center bg-gray-100 h-48">
                        <p className="text-gray-500">Fichier non prévisualisable</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

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
          
          {user ? (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="flex gap-4 mb-4 items-start">
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={user?.email || 'Utilisateur'} />
                  <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
                </Avatar>
                <Textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  className="flex-1"
                  rows={3}
                />
              </div>
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={submitting || !commentContent.trim()}
                  className="bg-tranches-sage hover:bg-tranches-sage/90"
                >
                  {submitting ? 'Envoi...' : 'Publier'}
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          ) : (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <p className="text-center text-gray-600 mb-4">
                  Vous devez être connecté pour laisser un commentaire.
                </p>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Button asChild>
                  <Link to="/auth">Se connecter</Link>
                </Button>
              </CardFooter>
            </Card>
          )}

          {comments.length > 0 ? (
            <div className="space-y-6">
              {comments.map(comment => (
                <div key={comment.id} className="flex gap-4">
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src={comment.profiles?.avatar_url || undefined} alt={comment.profiles?.display_name || 'Utilisateur'} />
                    <AvatarFallback>{getInitials(comment.profiles?.display_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-tranches-charcoal">
                          {comment.profiles?.display_name || 'Utilisateur'}
                        </h4>
                        <p className="text-sm text-gray-500">{formatDate(comment.created_at)}</p>
                      </div>
                      {(user?.id === comment.author_id || hasRole('admin')) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteComment(comment.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="mt-2 text-gray-700">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 py-8">Aucun commentaire pour le moment. Soyez le premier à commenter!</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default BlogPost;
