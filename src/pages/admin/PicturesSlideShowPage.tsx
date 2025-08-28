import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Upload, Trash2, Edit3, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { EmotionImage } from '@/types/emotionGame';

const PicturesSlideShowPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [images, setImages] = useState<EmotionImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    file: null as File | null,
    emotionName: '',
    intensity: '' as 'Puissante' | 'Intermédiaire' | 'Modérée' | ''
  });
  const [editingId, setEditingId] = useState<string>('');
  const [editForm, setEditForm] = useState({
    emotionName: '',
    intensity: '' as 'Puissante' | 'Intermédiaire' | 'Modérée' | ''
  });

  // Fetch images
  const fetchImages = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('emotion_images')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setImages(data || []);
    } catch (error) {
      console.error('Error fetching images:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les images",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Upload image
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadForm.file || !uploadForm.emotionName || !uploadForm.intensity || !user) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Upload file to storage
      const fileExt = uploadForm.file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('emotion-images')
        .upload(fileName, uploadForm.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('emotion-images')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('emotion_images')
        .insert({
          image_url: publicUrl,
          emotion_name: uploadForm.emotionName,
          intensity: uploadForm.intensity,
          created_by: user.id
        });

      if (dbError) throw dbError;

      toast({
        title: "Succès",
        description: "Image uploadée avec succès"
      });

      // Reset form
      setUploadForm({
        file: null,
        emotionName: '',
        intensity: ''
      });

      // Refresh list
      fetchImages();
      
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'upload",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete image
  const handleDelete = async (image: EmotionImage) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ?')) return;

    try {
      // Extract filename from URL
      const fileName = image.image_url.split('/').pop();
      
      if (fileName) {
        // Delete from storage
        await supabase.storage
          .from('emotion-images')
          .remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from('emotion_images')
        .delete()
        .eq('id', image.id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Image supprimée avec succès"
      });

      fetchImages();
      
    } catch (error) {
      console.error('Error deleting image:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive"
      });
    }
  };

  // Start editing
  const startEdit = (image: EmotionImage) => {
    setEditingId(image.id);
    setEditForm({
      emotionName: image.emotion_name,
      intensity: image.intensity
    });
  };

  // Save edit
  const saveEdit = async () => {
    if (!editForm.emotionName || !editForm.intensity) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('emotion_images')
        .update({
          emotion_name: editForm.emotionName,
          intensity: editForm.intensity
        })
        .eq('id', editingId);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Image modifiée avec succès"
      });

      setEditingId('');
      fetchImages();
      
    } catch (error) {
      console.error('Error updating image:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification",
        variant: "destructive"
      });
    }
  };

  // Cancel edit
  const cancelEdit = () => {
    setEditingId('');
    setEditForm({ emotionName: '', intensity: '' });
  };

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => navigate('/admin')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à l'administration
        </Button>

        <h1 className="text-3xl font-bold mb-2">Gestion des images d'émotions</h1>
        <p className="text-muted-foreground">
          Ajoutez et gérez les images pour le jeu "La palette des émotions"
        </p>
      </div>

      {/* Upload Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Ajouter une nouvelle image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="image">Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadForm(prev => ({
                    ...prev,
                    file: e.target.files?.[0] || null
                  }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="emotionName">Nom de l'émotion</Label>
                <Input
                  id="emotionName"
                  value={uploadForm.emotionName}
                  onChange={(e) => setUploadForm(prev => ({
                    ...prev,
                    emotionName: e.target.value
                  }))}
                  placeholder="ex: Joie, Tristesse, Colère..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="intensity">Intensité de l'émotion</Label>
                <Select
                  value={uploadForm.intensity}
                  onValueChange={(value: 'Puissante' | 'Intermédiaire' | 'Modérée') => 
                    setUploadForm(prev => ({ ...prev, intensity: value }))
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez l'intensité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Puissante">Puissante</SelectItem>
                    <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                    <SelectItem value="Modérée">Modérée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={isLoading}>
              <Upload className="mr-2 h-4 w-4" />
              {isLoading ? 'Upload en cours...' : 'Ajouter l\'image'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Images Table */}
      <Card>
        <CardHeader>
          <CardTitle>Images existantes ({images.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Chargement...</div>
          ) : images.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune image d'émotion ajoutée
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Nom de l'émotion</TableHead>
                  <TableHead>Intensité</TableHead>
                  <TableHead>Date d'ajout</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {images.map((image) => (
                  <TableRow key={image.id}>
                    <TableCell>
                      <img
                        src={image.image_url}
                        alt={image.emotion_name}
                        className="w-16 h-16 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell>
                      {editingId === image.id ? (
                        <Input
                          value={editForm.emotionName}
                          onChange={(e) => setEditForm(prev => ({
                            ...prev,
                            emotionName: e.target.value
                          }))}
                          className="w-full"
                        />
                      ) : (
                        image.emotion_name
                      )}
                    </TableCell>
                    <TableCell>
                      {editingId === image.id ? (
                        <Select
                          value={editForm.intensity}
                          onValueChange={(value: 'Puissante' | 'Intermédiaire' | 'Modérée') => 
                            setEditForm(prev => ({ ...prev, intensity: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Puissante">Puissante</SelectItem>
                            <SelectItem value="Intermédiaire">Intermédiaire</SelectItem>
                            <SelectItem value="Modérée">Modérée</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          image.intensity === 'Puissante' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                            : image.intensity === 'Intermédiaire'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                        }`}>
                          {image.intensity}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(image.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {editingId === image.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={saveEdit}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEdit}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startEdit(image)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(image)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PicturesSlideShowPage;