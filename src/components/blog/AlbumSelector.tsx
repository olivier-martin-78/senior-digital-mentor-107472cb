
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BlogAlbum } from '@/types/supabase';
import { Check, ImageIcon, Loader2, Plus, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadAlbumThumbnail } from '@/utils/thumbnailtUtils';

interface AlbumSelectorProps {
  albumId: string | null;
  setAlbumId: (id: string | null) => void;
  allAlbums: BlogAlbum[];
  setAllAlbums: (albums: BlogAlbum[]) => void;
  userId: string | undefined;
}

const AlbumSelector: React.FC<AlbumSelectorProps> = ({
  albumId,
  setAlbumId,
  allAlbums,
  setAllAlbums,
  userId
}) => {
  const { toast } = useToast();
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
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

    try {
      setUploadingThumbnail(!!newAlbumThumbnail);
      
      let thumbnailUrl = null;
      
      // Créer d'abord l'album pour obtenir un ID
      const { data: albumData, error: albumError } = await supabase
        .from('blog_albums')
        .insert({
          name: newAlbumName.trim(),
          author_id: userId as string
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
          // S'assurer de ne pas utiliser une URL blob
          if (thumbnailPreview && thumbnailPreview.startsWith('blob:')) {
            URL.revokeObjectURL(thumbnailPreview);
          }
          
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

  return (
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
  );
};

export default AlbumSelector;
