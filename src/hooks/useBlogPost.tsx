
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { PostWithAuthor, CommentWithAuthor, BlogMedia, BlogCategory, BlogAlbum } from '@/types/supabase';
import { useToast } from '@/hooks/use-toast';

export const useBlogPost = (postId: string) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [album, setAlbum] = useState<BlogAlbum | null>(null);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [media, setMedia] = useState<BlogMedia[]>([]);
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPostDetails = async () => {
      // Ne pas essayer de charger un post si l'ID est "new" (création d'un nouvel article)
      if (postId === 'new') {
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 useBlogPost - CORRECTION - Début récupération post:', postId);
        
        // Fetch post with author
        const { data: postData, error: postError } = await supabase
          .from('blog_posts')
          .select(`
            *,
            profiles:author_id(*)
          `)
          .eq('id', postId)
          .single();

        if (postError) {
          console.error('🔍 useBlogPost - CORRECTION - Error fetching post:', postError);
          toast({
            title: "Erreur",
            description: "L'article n'a pas pu être chargé.",
            variant: "destructive"
          });
          navigate('/blog');
          return;
        }

        console.log('🔍 useBlogPost - CORRECTION - Post récupéré:', {
          id: postData.id,
          title: postData.title,
          author_id: postData.author_id,
          published: postData.published
        });

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
          .eq('post_id', postId);

        if (postCategoriesData) {
          const fetchedCategories = postCategoriesData.map(item => item.blog_categories) as BlogCategory[];
          setCategories(fetchedCategories);
        }

        // Fetch media
        const { data: mediaData, error: mediaError } = await supabase
          .from('blog_media')
          .select('*')
          .eq('post_id', postId);

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
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

        if (!commentsError) {
          setComments(commentsData as CommentWithAuthor[]);
        }

      } catch (error) {
        console.error('🔍 useBlogPost - CORRECTION - Error:', error);
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors du chargement de l'article.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      fetchPostDetails();
    }
  }, [postId, navigate, toast]);

  const addComment = async (content: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .insert({
          post_id: postId,
          author_id: userId,
          content: content.trim()
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
      
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été publié avec succès."
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la publication du commentaire.",
        variant: "destructive"
      });
      return false;
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

  return {
    post,
    album,
    categories,
    media,
    comments,
    loading,
    addComment,
    deleteComment
  };
};
