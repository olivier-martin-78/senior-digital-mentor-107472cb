import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BlogPost, BlogMedia, BlogAlbum, BlogCategory } from '@/types/supabase';
import { uploadAlbumThumbnail } from '@/utils/thumbnailtUtils';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Image as ImageIcon, Video, Plus, Check } from 'lucide-react';

const BlogEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const isEditing = !!id;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [allCategories, setAllCategories] = useState<BlogCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<BlogCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [allAlbums, setAllAlbums] = useState<BlogAlbum[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [media, setMedia] = useState<BlogMedia[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [newAlbumThumbnail, setNewAlbumThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

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

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewAlbumThumbnail(file);
      // Créer une URL pour la prévisualisation
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);
    }
  };

  const createNewAlbum = async () => {
    if (!newAlbumName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez entrer un nom pour l'album.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingThumbnail(!!newAlbumThumbnail);
      
      let thumbnailUrl = null;
      
      // Créer d'abord l'album pour obtenir un ID
      const { data: albumData, error: albumError } = await supabase
        .from('blog_albums')
        .insert({
          name: newAlbumName.trim(),
          author_id: user?.id as string
        })
        .select(`*, profiles:author_id(*)`)
        .single();

      if (albumError) {
        if (albumError.code === '23505') { // Unique constraint violation
          toast({
            title: "Album existant",
            description: "Un album avec ce nom existe déjà.",
            variant: "destructive"
          });
        } else {
          throw albumError;
        }
        return;
      }
      
      // Si une vignette a été sélectionnée, la télécharger
      if (newAlbumThumbnail) {
        try {
          thumbnailUrl = await uploadAlbumThumbnail(newAlbumThumbnail, albumData.id);
          
          // Mettre à jour l'album avec l'URL de la vignette
          const { error: updateError } = await supabase
            .from('blog_albums')
            .update({ thumbnail_url: thumbnailUrl })
            .eq('id', albumData.id);
            
          if (updateError) throw updateError;
          
          // Mettre à jour l'objet albumData avec l'URL de la vignette
          albumData.thumbnail_url = thumbnailUrl;
        } catch (uploadError: any) {
          console.error('Erreur lors du téléchargement de la vignette:', uploadError);
          toast({
            title: "Erreur",
            description: "L'album a été créé, mais la vignette n'a pas pu être téléchargée.",
            variant: "destructive"
          });
        }
      }

      setAllAlbums([...allAlbums, albumData as BlogAlbum]);
      setAlbumId(albumData.id);
      setNewAlbumName('');
      setNewAlbumThumbnail(null);
      setThumbnailPreview(null);
      setIsCreatingAlbum(false);
      
      toast({
        title: "Album créé",
        description: "L'album a été créé avec succès."
      });
    } catch (error: any) {
      console.error('Error creating album:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de l'album.",
        variant: "destructive"
      });
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const createNewCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .insert({
          name: newCategoryName.trim()
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          const existingCategory = allCategories.find(c => 
            c.name.toLowerCase() === newCategoryName.trim().toLowerCase()
          );
          
          if (existingCategory && !selectedCategories.some(c => c.id === existingCategory.id)) {
            setSelectedCategories([...selectedCategories, existingCategory]);
          }
          
          setNewCategoryName('');
          return;
        }
        throw error;
      }

      const newCategory = data as BlogCategory;
      setAllCategories([...allCategories, newCategory]);
      setSelectedCategories([...selectedCategories, newCategory]);
      setNewCategoryName('');
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de la catégorie.",
        variant: "destructive"
      });
    }
  };

  const toggleCategory = (category: BlogCategory) => {
    setSelectedCategories(prev => {
      const isSelected = prev.some(c => c.id === category.id);
      if (isSelected) {
        return prev.filter(c => c.id !== category.id);
      } else {
        return [...prev, category];
      }
    });
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

    try {
      setSaving(true);

      if (isEditing && post) {
        // Update existing post
        const { error } = await supabase
          .from('blog_posts')
          .update({
            title: title.trim(),
            content: content.trim(),
            published: publish || isPublished,
            album_id: albumId,
            updated_at: new Date().toISOString()
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
            published: publish
          })
          .select()
          .single();

        if (error) throw error;

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
        // Upload to storage
        const { error: uploadError, data } = await supabase.storage
          .from('blog-media')
          .upload(filePath, file);

        if (uploadError) {
          newErrors.push(`Erreur lors de l'upload de ${file.name}: ${uploadError.message}`);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('blog-media')
          .getPublicUrl(filePath);

        // Save to database
        const { error: dbError } = await supabase
          .from('blog_media')
          .insert({
            post_id: id || post?.id,
            media_url: publicUrl,
            media_type: file.type
          });

        if (dbError) {
          newErrors.push(`Erreur lors de l'enregistrement de ${file.name}: ${dbError.message}`);
          continue;
        }

        // Add to local state
        setMedia(prev => [...prev, {
          id: Date.now().toString(), // Temporary ID
          post_id: id || post?.id || '',
          media_url: publicUrl,
          media_type: file.type,
          created_at: new Date().toISOString()
        }]);

      } catch (error: any) {
        newErrors.push(`Erreur lors du traitement de ${file.name}: ${error.message}`);
      }
    }

    if (newErrors.length > 0) {
      setUploadErrors(newErrors);
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

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-serif text-tranches-charcoal">
            {isEditing ? 'Modifier l\'article' : 'Nouvel article'}
          </h1>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/blog')}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enregistrer
            </Button>
            <Button
              className="bg-tranches-sage hover:bg-tranches-sage/90"
              onClick={() => handleSave(true)}
              disabled={saving}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditing && isPublished ? 'Mettre à jour' : 'Publier'}
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Title */}
          <div className="mb-6">
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl mt-1"
              placeholder="Titre de l'article"
            />
          </div>

          {/* Album Selection */}
          <div className="mb-6">
            <Label>Album</Label>
            {isCreatingAlbum ? (
              <div className="space-y-4 mt-1">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newAlbumName}
                    onChange={(e) => setNewAlbumName(e.target.value)}
                    placeholder="Nom du nouvel album"
                    className="flex-1"
                  />
                  <Button 
                    onClick={createNewAlbum} 
                    className="bg-tranches-sage hover:bg-tranches-sage/90"
                    size="sm"
                    disabled={uploadingThumbnail}
                  >
                    {uploadingThumbnail ? 
                      <Loader2 className="h-4 w-4 animate-spin" /> : 
                      <Check className="h-4 w-4" />
                    }
                  </Button>
                  <Button 
                    onClick={() => {
                      setIsCreatingAlbum(false);
                      setNewAlbumThumbnail(null);
                      setThumbnailPreview(null);
                    }} 
                    variant="outline"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Ajout du champ de vignette */}
                <div>
                  <Label htmlFor="album-thumbnail" className="block mb-2">Vignette de l'album (optionnel)</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 border border-gray-300 rounded-md overflow-hidden">
                      {thumbnailPreview ? (
                        <img 
                          src={thumbnailPreview} 
                          alt="Aperçu de la vignette" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <Input
                        id="album-thumbnail"
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        className="max-w-xs"
                      />
                      <p className="text-xs text-gray-500 mt-1">Format recommandé: JPEG ou PNG, max 2MB</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 mt-1">
                <Select value={albumId || 'none'} onValueChange={(value) => setAlbumId(value === 'none' ? null : value)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner un album" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun album</SelectItem>
                    {allAlbums.map(album => (
                      <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  onClick={() => setIsCreatingAlbum(true)} 
                  variant="outline"
                  size="sm"
                  className="whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nouvel album
                </Button>
              </div>
            )}
          </div>

          {/* Categories Selection */}
          <div className="mb-6">
            <Label>Catégories</Label>
            <div className="mt-2 flex flex-wrap gap-2 mb-2">
              {allCategories.map(category => (
                <Badge 
                  key={category.id}
                  variant={selectedCategories.some(c => c.id === category.id) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCategory(category)}
                >
                  {category.name}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ajouter une nouvelle catégorie"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCategoryName.trim()) {
                    e.preventDefault();
                    createNewCategory();
                  }
                }}
              />
              <Button 
                onClick={createNewCategory} 
                disabled={!newCategoryName.trim()}
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="mb-6">
            <Label htmlFor="content">Contenu</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[300px] mt-1"
              placeholder="Contenu de l'article..."
            />
          </div>

          {/* Media Upload - only show if post is already saved */}
          {(isEditing || post) && (
            <div className="border-t pt-6 mt-6">
              <h2 className="text-xl font-serif mb-4">Médias</h2>
              
              <div className="mb-6">
                <Label htmlFor="media-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-tranches-sage transition-colors">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600">Cliquez pour ajouter des images ou vidéos</p>
                      <p className="text-xs text-gray-500 mt-1">Formats supportés: JPG, PNG, GIF, MP4, etc.</p>
                    </div>
                  </div>
                  <Input
                    id="media-upload"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={uploadingFiles}
                  />
                </Label>
              </div>

              {uploadingFiles && (
                <div className="flex justify-center my-4">
                  <div className="flex items-center">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    <span>Téléchargement en cours...</span>
                  </div>
                </div>
              )}

              {uploadErrors.length > 0 && (
                <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4">
                  <h3 className="font-medium mb-1">Erreurs d'upload:</h3>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    {uploadErrors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Media Gallery */}
              {media.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                  {media.map(item => (
                    <div key={item.id} className="group relative bg-gray-100 rounded-lg overflow-hidden">
                      {item.media_type.startsWith('image/') ? (
                        <>
                          <img
                            src={item.media_url}
                            alt="Media"
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                            <ImageIcon className="w-6 h-6 text-white" />
                          </div>
                        </>
                      ) : item.media_type.startsWith('video/') ? (
                        <>
                          <video
                            src={item.media_url}
                            className="w-full h-32 object-cover"
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                            <Video className="w-6 h-6 text-white" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-32 flex items-center justify-center">
                          <p className="text-gray-500 text-sm">Fichier non prévisualisable</p>
                        </div>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMedia(item)}
                        className="absolute top-1 right-1 bg-white/80 hover:bg-white p-1 rounded-full"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlogEditor;
