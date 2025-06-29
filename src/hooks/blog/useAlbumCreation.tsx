
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadAlbumThumbnail } from '@/utils/thumbnailtUtils';
import { useToast } from '@/hooks/use-toast';
import { BlogAlbum } from '@/types/supabase';

export const useAlbumCreation = (
  userId: string | undefined,
  allAlbums: BlogAlbum[],
  setAllAlbums: (albums: BlogAlbum[]) => void,
  setAccessibleAlbums: (albums: BlogAlbum[]) => void,
  accessibleAlbums: BlogAlbum[],
  setAlbumId: (id: string | null) => void
) => {
  const { toast } = useToast();
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumThumbnail, setNewAlbumThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewAlbumThumbnail(file);
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

    // Vérifier l'unicité uniquement parmi les albums accessibles
    const albumExistsInAccessible = accessibleAlbums.some(
      album => album.name.toLowerCase() === newAlbumName.trim().toLowerCase()
    );

    if (albumExistsInAccessible) {
      toast({
        title: "Album existant",
        description: "Un album avec ce nom existe déjà dans vos albums accessibles.",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingThumbnail(!!newAlbumThumbnail);
      
      let thumbnailUrl = null;
      
      // Créer l'album
      const { data: albumData, error: albumError } = await supabase
        .from('blog_albums')
        .insert({
          name: newAlbumName.trim(),
          author_id: userId as string
        })
        .select(`*, profiles:author_id(*)`)
        .single();

      if (albumError) {
        console.error('Erreur lors de la création de l\'album:', albumError);
        throw albumError;
      }
      
      // Si une vignette a été sélectionnée, la télécharger
      if (newAlbumThumbnail) {
        try {
          if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
            URL.revokeObjectURL(thumbnailPreview);
          }
          
          thumbnailUrl = await uploadAlbumThumbnail(newAlbumThumbnail, albumData.id);
          
          const { error: updateError } = await supabase
            .from('blog_albums')
            .update({ thumbnail_url: thumbnailUrl })
            .eq('id', albumData.id);
            
          if (updateError) throw updateError;
          
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

      const newAlbum = albumData as BlogAlbum;
      setAllAlbums([...allAlbums, newAlbum]);
      setAccessibleAlbums([...accessibleAlbums, newAlbum]);
      setAlbumId(newAlbum.id);
      resetForm();
      
      toast({
        title: "Album créé",
        description: "L'album a été créé avec succès."
      });
      
      return true; // Indicates success
    } catch (error: any) {
      console.error('Error creating album:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de l'album.",
        variant: "destructive"
      });
      return false;
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const resetForm = () => {
    setNewAlbumName('');
    setNewAlbumThumbnail(null);
    setThumbnailPreview(null);
  };

  return {
    newAlbumName,
    setNewAlbumName,
    newAlbumThumbnail,
    thumbnailPreview,
    uploadingThumbnail,
    handleThumbnailChange,
    createNewAlbum,
    resetForm
  };
};
