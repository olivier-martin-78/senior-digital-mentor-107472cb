import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BlogPost, BlogMedia, BlogAlbum, BlogCategory } from '@/types/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { uploadAlbumThumbnail } from '@/utils/thumbnailtUtils';
import { generateVideoThumbnail, isVideoFile } from '@/utils/videoThumbnailUtils';
import { useBlogAlbums } from '@/hooks/blog/useBlogAlbums';

export const useBlogEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const isEditing = !!id;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<BlogCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<BlogCategory[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [media, setMedia] = useState<BlogMedia[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);

  // Utiliser le même hook que la page blog pour les albums
  const { albums: allAlbums, loading: albumsLoading } = useBlogAlbums();
  const [localAllAlbums, setLocalAllAlbums] = useState<BlogAlbum[]>([]);

  // Synchroniser les albums du hook avec l'état local
  useEffect(() => {
    if (!albumsLoading) {
      setLocalAllAlbums(allAlbums);
    }
  }, [allAlbums, albumsLoading]);

  // Fetch existing resources (categories only now, albums are managed by useBlogAlbums)
  useEffect(() => {
    const fetchResources = async () => {
      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('blog_categories')
          .select('*')
          .order('name', { ascending: true });

        if (!categoriesError && categoriesData) {
          setAllCategories(categoriesData);
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
      }
    };

    fetchResources();
  }, []);

  // Fetch existing post if in edit mode
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          navigate('/blog');
          return;
        }

        // Avec les nouvelles politiques RLS, la vérification des permissions est automatique
        // Si l'utilisateur peut voir le post, il peut le modifier (s'il en est l'auteur)
        const isAuthor = user?.id === data.author_id;
        const isAdmin = hasRole('admin');
        
        if (!isAuthor && !isAdmin) {
          toast({
            title: "Accès refusé",
            description: "Vous n'avez pas l'autorisation de modifier cet article.",
            variant: "destructive"
          });
          navigate('/blog');
          return;
        }

        setPost(data as BlogPost);
        setTitle(data.title);
        setContent(data.content);
        setIsPublished(data.published);
        setAlbumId(data.album_id);
        setCoverImage(data.cover_image || null);

        // Fetch media for this post
        const { data: mediaData, error: mediaError } = await supabase
          .from('blog_media')
          .select('*')
          .eq('post_id', id);

        if (!mediaError && mediaData) {
          setMedia(mediaData as BlogMedia[]);
        }

        // Fetch categories for this post
        const { data: postCategoriesData, error: postCategoriesError } = await supabase
          .from('post_categories')
          .select(`
            category_id,
            blog_categories:category_id(*)
          `)
          .eq('post_id', id);

        if (!postCategoriesError && postCategoriesData) {
          const postCategories = postCategoriesData.map(item => item.blog_categories) as BlogCategory[];
          setSelectedCategories(postCategories);
        }
      } catch (error: any) {
        console.error('Error fetching post:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger l'article.",
          variant: "destructive"
        });
        navigate('/blog');
      } finally {
        setLoading(false);
      }
    };

    if (isEditing) {
      fetchPost();
    } else {
      setLoading(false);
    }
  }, [id, user, hasRole, navigate, toast, isEditing]);

  const uploadCoverImage = async (postId: string): Promise<string | null> => {
    if (!coverImageFile) return coverImage;
    
    try {
      setUploadingCoverImage(true);
      
      if (coverImage && coverImage.startsWith('blob:')) {
        const publicUrl = await uploadAlbumThumbnail(coverImageFile, `cover-${postId}`);
        return publicUrl;
      }
      
      return coverImage;
    } catch (error: any) {
      console.error('Erreur lors du téléchargement de la miniature:', error);
      toast({
        title: "Erreur",
        description: "La miniature n'a pas pu être téléchargée.",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploadingCoverImage(false);
    }
  };

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) {
      toast({
        title: "Titre manquant",
        description: "Veuillez ajouter un titre à votre article.",
        variant: "destructive"
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Contenu manquant",
        description: "Veuillez ajouter du contenu à votre article.",
        variant: "destructive"
      });
      return;
    }

    if (!albumId) {
      toast({
        title: "Album manquant",
        description: "Veuillez sélectionner un album pour votre article.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSaving(true);
      let finalCoverImage = coverImage;
      
      if (coverImageFile) {
        if (isEditing && post) {
          finalCoverImage = await uploadCoverImage(post.id);
        }
      }
      
      if (finalCoverImage && finalCoverImage.startsWith('blob:')) {
        finalCoverImage = null;
      }

      if (isEditing && post) {
        // Update existing post
        const { error } = await supabase
          .from('blog_posts')
          .update({
            title: title.trim(),
            content: content.trim(),
            published: publish || isPublished,
            album_id: albumId,
            updated_at: new Date().toISOString(),
            cover_image: finalCoverImage
          })
          .eq('id', post.id);

        if (error) throw error;

        // Update categories
        await supabase
          .from('post_categories')
          .delete()
          .eq('post_id', post.id);

        if (selectedCategories.length > 0) {
          const categoryInserts = selectedCategories.map(category => ({
            post_id: post.id,
            category_id: category.id
          }));

          const { error: insertError } = await supabase
            .from('post_categories')
            .insert(categoryInserts);

          if (insertError) throw insertError;
        }

        toast({
          title: "Article mis à jour",
          description: publish && !isPublished 
            ? "L'article a été publié avec succès." 
            : "Les modifications ont été enregistrées."
        });
      } else {
        // Create new post
        const { data, error } = await supabase
          .from('blog_posts')
          .insert({
            title: title.trim(),
            content: content.trim(),
            author_id: user?.id,
            album_id: albumId,
            published: publish,
            cover_image: null
          })
          .select()
          .single();

        if (error) throw error;

        if (coverImageFile) {
          const uploadedCoverUrl = await uploadCoverImage(data.id);
          
          if (uploadedCoverUrl) {
            const { error: updateError } = await supabase
              .from('blog_posts')
              .update({ cover_image: uploadedCoverUrl })
              .eq('id', data.id);
              
            if (updateError) {
              console.error('Erreur lors de la mise à jour de la miniature:', updateError);
            }
          }
        }

        if (selectedCategories.length > 0) {
          const categoryInserts = selectedCategories.map(category => ({
            post_id: data.id,
            category_id: category.id
          }));

          const { error: insertError } = await supabase
            .from('post_categories')
            .insert(categoryInserts);

          if (insertError) {
            console.error('Erreur lors de l\'ajout des catégories:', insertError);
          }
        }

        toast({
          title: "Article créé",
          description: publish 
            ? "L'article a été publié avec succès." 
            : "L'article a été enregistré comme brouillon."
        });

        navigate(`/blog/${data.id}`);
        return;
      }

      navigate(`/blog/${post?.id}`);
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de l'enregistrement de l'article.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = useCallback(async (files: File[]) => {
    if (!files || files.length === 0) return;
    
    if (!id && !post) {
      toast({
        title: "Enregistrez d'abord",
        description: "Veuillez d'abord enregistrer l'article avant d'ajouter des médias.",
        variant: "destructive"
      });
      return;
    }

    setUploadingFiles(true);
    setUploadErrors([]);
    const newErrors: string[] = [];
    const successfulUploads: BlogMedia[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const filePath = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

      try {
        const { error: uploadError } = await supabase.storage
          .from('blog-media')
          .upload(filePath, file);

        if (uploadError) {
          newErrors.push(`Erreur lors de l'upload de ${file.name}: ${uploadError.message}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('blog-media')
          .getPublicUrl(filePath);

        let thumbnailUrl: string | null = null;
        if (isVideoFile(file)) {
          try {
            const thumbnailFile = await generateVideoThumbnail(file);
            const thumbnailExt = thumbnailFile.name.split('.').pop();
            const thumbnailPath = `thumbnails/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${thumbnailExt}`;
            
            const { error: thumbnailUploadError } = await supabase.storage
              .from('blog-media')
              .upload(thumbnailPath, thumbnailFile);

            if (!thumbnailUploadError) {
              const { data: { publicUrl: thumbnailPublicUrl } } = supabase.storage
                .from('blog-media')
                .getPublicUrl(thumbnailPath);
              
              thumbnailUrl = thumbnailPublicUrl;
            }
          } catch (thumbnailError) {
            console.error('❌ Erreur lors de la génération de la vignette:', thumbnailError);
          }
        }

        const { data: insertedMedia, error: dbError } = await supabase
          .from('blog_media')
          .insert({
            post_id: id || post?.id,
            media_url: publicUrl,
            media_type: file.type,
            thumbnail_url: thumbnailUrl
          })
          .select()
          .single();

        if (dbError) {
          newErrors.push(`Erreur lors de l'enregistrement de ${file.name}: ${dbError.message}`);
          continue;
        }

        if (insertedMedia) {
          successfulUploads.push(insertedMedia as BlogMedia);
        }

      } catch (error: any) {
        newErrors.push(`Erreur lors du traitement de ${file.name}: ${error.message}`);
      }
    }

    if (successfulUploads.length > 0) {
      setMedia(prev => [...prev, ...successfulUploads]);
      
      toast({
        title: "Upload réussi",
        description: `${successfulUploads.length} fichier(s) téléchargé(s) avec succès.`
      });
    }

    if (newErrors.length > 0) {
      setUploadErrors(newErrors);
      toast({
        title: "Erreurs d'upload",
        description: `${newErrors.length} fichier(s) n'ont pas pu être téléchargés.`,
        variant: "destructive"
      });
    }

    setUploadingFiles(false);
  }, [id, post, toast]);

  const deleteMedia = async (mediaItem: BlogMedia) => {
    try {
      const urlParts = mediaItem.media_url.split('/');
      const filename = urlParts[urlParts.length - 1];

      const { error: storageError } = await supabase.storage
        .from('blog-media')
        .remove([filename]);

      const { error: dbError } = await supabase
        .from('blog_media')
        .delete()
        .eq('id', mediaItem.id);

      if (dbError) throw dbError;

      setMedia(prev => prev.filter(item => item.id !== mediaItem.id));

      toast({
        title: "Média supprimé",
        description: "Le fichier a été supprimé avec succès."
      });
    } catch (error: any) {
      console.error('Error deleting media:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la suppression du média.",
        variant: "destructive"
      });
    }
  };

  return {
    isEditing,
    loading: loading || albumsLoading,
    post,
    title,
    setTitle,
    content,
    setContent,
    albumId,
    setAlbumId,
    allCategories,
    setAllCategories,
    selectedCategories,
    setSelectedCategories,
    allAlbums: localAllAlbums,
    setAllAlbums: setLocalAllAlbums,
    isPublished,
    saving,
    handleSave,
    media,
    uploadingFiles,
    uploadErrors,
    handleFileUpload,
    deleteMedia,
    coverImage,
    setCoverImage,
    coverImageFile,
    setCoverImageFile,
    uploadingCoverImage
  };
};
