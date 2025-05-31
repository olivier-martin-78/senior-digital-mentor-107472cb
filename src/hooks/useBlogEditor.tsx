
import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BlogPost, BlogMedia, BlogAlbum, BlogCategory } from '@/types/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { uploadAlbumThumbnail } from '@/utils/thumbnailtUtils';
import { generateVideoThumbnail, isVideoFile } from '@/utils/videoThumbnailUtils';

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
  const [allAlbums, setAllAlbums] = useState<BlogAlbum[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [media, setMedia] = useState<BlogMedia[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);

  // Fetch existing resources (albums, categories)
  useEffect(() => {
    const fetchResources = async () => {
      try {
        // Fetch albums - now including the profiles data
        const { data: albumsData, error: albumsError } = await supabase
          .from('blog_albums')
          .select(`*, profiles:author_id(*)`)
          .order('name', { ascending: true });

        if (!albumsError && albumsData) {
          setAllAlbums(albumsData as BlogAlbum[]);
        }

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

        // Check if user has permission to edit this post
        if (data.author_id !== user?.id && !hasRole('admin')) {
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

  // Fonction pour télécharger la miniature de l'article
  const uploadCoverImage = async (postId: string): Promise<string | null> => {
    if (!coverImageFile) return coverImage;
    
    try {
      setUploadingCoverImage(true);
      
      // S'assurer que nous ne sauvegardons pas une URL blob
      if (coverImage && coverImage.startsWith('blob:')) {
        // Utiliser la fonction uploadAlbumThumbnail du utils/thumbnailtUtils.ts mais pour les blogs
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

    // Nouvelle validation pour l'album obligatoire
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
      
      // Si un nouveau fichier d'image a été sélectionné, le télécharger d'abord
      if (coverImageFile) {
        if (isEditing && post) {
          finalCoverImage = await uploadCoverImage(post.id);
        }
      }
      
      // S'assurer que nous ne sauvegardons pas une URL blob
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
        // First, delete all existing category associations
        await supabase
          .from('post_categories')
          .delete()
          .eq('post_id', post.id);

        // Then, add new category associations
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
            cover_image: null // On commence sans cover_image
          })
          .select()
          .single();

        if (error) throw error;

        // Télécharger la miniature maintenant que nous avons l'ID de l'article
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

        // Add categories
        if (selectedCategories.length > 0) {
          const categoryInserts = selectedCategories.map(category => ({
            post_id: data.id,
            category_id: category.id
          }));

          const { error: insertError } = await supabase
            .from('post_categories')
            .insert(categoryInserts);

          if (insertError) throw insertError;
        }

        toast({
          title: "Article créé",
          description: publish 
            ? "L'article a été publié avec succès." 
            : "L'article a été enregistré comme brouillon."
        });

        // Redirect to the newly created post
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

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
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

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const filePath = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

      try {
        console.log(`Début upload du fichier: ${file.name} (${Math.round(file.size / (1024 * 1024))} MB)`);
        
        // Upload du fichier principal avec timeout personnalisé
        const uploadPromise = supabase.storage
          .from('blog-media')
          .upload(filePath, file);

        // Timeout personnalisé basé sur la taille du fichier
        const timeoutDuration = Math.max(60000, file.size / 1024); // Minimum 1 minute, +1ms par KB
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout: Upload trop long')), timeoutDuration);
        });

        const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;

        if (uploadError) {
          console.error(`Erreur upload ${file.name}:`, uploadError);
          newErrors.push(`Erreur lors de l'upload de ${file.name}: ${uploadError.message}`);
          continue;
        }

        console.log(`Upload réussi: ${file.name}`);

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('blog-media')
          .getPublicUrl(filePath);

        // Générer une vignette si c'est une vidéo
        let thumbnailUrl: string | null = null;
        if (isVideoFile(file)) {
          try {
            console.log('Génération de vignette pour la vidéo:', file.name);
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
              console.log('Vignette générée avec succès:', thumbnailUrl);
            } else {
              console.error('Erreur lors de l\'upload de la vignette:', thumbnailUploadError);
            }
          } catch (thumbnailError) {
            console.error('Erreur lors de la génération de la vignette:', thumbnailError);
            // Continue sans vignette si la génération échoue
          }
        }

        // Save to database with thumbnail URL if available
        const { error: dbError } = await supabase
          .from('blog_media')
          .insert({
            post_id: id || post?.id,
            media_url: publicUrl,
            media_type: file.type,
            thumbnail_url: thumbnailUrl
          });

        if (dbError) {
          console.error(`Erreur DB pour ${file.name}:`, dbError);
          newErrors.push(`Erreur lors de l'enregistrement de ${file.name}: ${dbError.message}`);
          continue;
        }

        // Add to local state
        setMedia(prev => [...prev, {
          id: Date.now().toString(), // Temporary ID
          post_id: id || post?.id || '',
          media_url: publicUrl,
          media_type: file.type,
          thumbnail_url: thumbnailUrl,
          created_at: new Date().toISOString()
        }]);

        console.log(`Traitement terminé avec succès: ${file.name}`);

      } catch (error: any) {
        console.error(`Erreur générale pour ${file.name}:`, error);
        newErrors.push(`Erreur lors du traitement de ${file.name}: ${error.message}`);
      }
    }

    if (newErrors.length > 0) {
      setUploadErrors(newErrors);
      toast({
        title: "Erreurs d'upload",
        description: `${newErrors.length} fichier(s) n'ont pas pu être téléchargés.`,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Upload réussi",
        description: `${files.length} fichier(s) téléchargé(s) avec succès.`
      });
    }

    setUploadingFiles(false);
    // Clear input
    event.target.value = '';
  }, [id, post, toast]);

  const deleteMedia = async (mediaItem: BlogMedia) => {
    try {
      // Extract filename from URL
      const urlParts = mediaItem.media_url.split('/');
      const filename = urlParts[urlParts.length - 1];

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('blog-media')
        .remove([filename]);

      // Delete from database
      const { error: dbError } = await supabase
        .from('blog_media')
        .delete()
        .eq('id', mediaItem.id);

      if (dbError) throw dbError;

      // Remove from local state
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
    loading,
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
    allAlbums,
    setAllAlbums,
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
