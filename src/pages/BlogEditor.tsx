
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BlogPost, BlogMedia } from '@/types/supabase';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Image, Video } from 'lucide-react';

const BlogEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const isEditing = !!id;

  const [post, setPost] = useState<BlogPost | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [media, setMedia] = useState<BlogMedia[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<boolean>(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);

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

        // Fetch media for this post
        const { data: mediaData, error: mediaError } = await supabase
          .from('blog_media')
          .select('*')
          .eq('post_id', id);

        if (!mediaError && mediaData) {
          setMedia(mediaData as BlogMedia[]);
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
            updated_at: new Date().toISOString()
          })
          .eq('id', post.id);

        if (error) throw error;

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
            published: publish
          })
          .select()
          .single();

        if (error) throw error;

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
                            <Image className="w-6 h-6 text-white" />
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
