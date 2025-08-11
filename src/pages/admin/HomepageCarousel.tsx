import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useHomepageSlidesAdmin } from '@/hooks/useHomepageSlides';
import { homepageSlideService, CreateSlideData, UpdateSlideData } from '@/services/homepageSlideService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, EyeOff, Upload, GripVertical, Image as ImageIcon, Video, FileImage, FileVideo, ChevronUp, ChevronDown } from 'lucide-react';
import { HomepageSlide } from '@/hooks/useHomepageSlides';

const HomepageCarousel = () => {
  const { data: slides, isLoading } = useHomepageSlidesAdmin();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<HomepageSlide | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateSlideData>({
    title: '',
    media_url: '',
    media_type: 'image',
    button_text: '',
    button_link: '',
    display_order: 0,
    display_duration_seconds: 3,
    title_color: '#ffffff',
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const mediaType = isVideo ? 'video' : 'image';

    try {
      setIsSubmitting(true);
      const mediaUrl = await homepageSlideService.uploadMedia(file);
      setFormData(prev => ({ 
        ...prev, 
        media_url: mediaUrl,
        media_type: mediaType
      }));
      toast({
        title: `${isVideo ? 'Vidéo' : 'Image'} uploadée`,
        description: `${isVideo ? 'La vidéo' : "L'image"} a été uploadée avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: `Erreur lors de l'upload ${isVideo ? 'de la vidéo' : "de l'image"}.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingSlide) {
        await homepageSlideService.update(editingSlide.id, formData);
        toast({
          title: "Slide modifiée",
          description: "La slide a été modifiée avec succès.",
        });
      } else {
        const maxOrder = slides ? Math.max(...slides.map(s => s.display_order), 0) : 0;
        await homepageSlideService.create({
          ...formData,
          display_order: maxOrder + 1,
        });
        toast({
          title: "Slide créée",
          description: "La slide a été créée avec succès.",
        });
      }

      queryClient.invalidateQueries({ queryKey: ["homepage-slides"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-slides-admin"] });
      setIsCreateDialogOpen(false);
      setEditingSlide(null);
      setFormData({
        title: '',
        media_url: '',
        media_type: 'image',
        button_text: '',
        button_link: '',
        display_order: 0,
        display_duration_seconds: 3,
        title_color: '#ffffff',
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette slide ?')) return;

    try {
      await homepageSlideService.delete(id);
      queryClient.invalidateQueries({ queryKey: ["homepage-slides"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-slides-admin"] });
      toast({
        title: "Slide supprimée",
        description: "La slide a été supprimée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression.",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (slide: HomepageSlide) => {
    try {
      await homepageSlideService.update(slide.id, { is_active: !slide.is_active });
      queryClient.invalidateQueries({ queryKey: ["homepage-slides"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-slides-admin"] });
      toast({
        title: slide.is_active ? "Slide désactivée" : "Slide activée",
        description: `La slide a été ${slide.is_active ? 'désactivée' : 'activée'} avec succès.`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification.",
        variant: "destructive",
      });
    }
  };

  const handleMoveSlide = async (slideId: string, direction: 'up' | 'down') => {
    try {
      await homepageSlideService.updateSlideOrder(slideId, direction);
      queryClient.invalidateQueries({ queryKey: ["homepage-slides"] });
      queryClient.invalidateQueries({ queryKey: ["homepage-slides-admin"] });
      toast({
        title: "Ordre modifié",
        description: "L'ordre des slides a été mis à jour.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la modification de l'ordre.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (slide: HomepageSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title,
      media_url: slide.media_url,
      media_type: slide.media_type,
      button_text: slide.button_text || '',
      button_link: slide.button_link || '',
      display_order: slide.display_order,
      display_duration_seconds: slide.display_duration_seconds,
      title_color: slide.title_color || '#ffffff',
    });
    setIsCreateDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestion du carrousel de la page d'accueil</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingSlide(null);
              setFormData({
                title: '',
                media_url: '',
                media_type: 'image',
                button_text: '',
                button_link: '',
                display_order: 0,
                display_duration_seconds: 3,
                title_color: '#ffffff',
              });
            }}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une slide
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSlide ? 'Modifier la slide' : 'Ajouter une nouvelle slide'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Titre</Label>
                <Textarea
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Texte principal à afficher sur la slide"
                  required
                />
              </div>
              <div>
                <Label htmlFor="title_color">Couleur du titre</Label>
                <Input
                  id="title_color"
                  type="color"
                  value={formData.title_color || '#ffffff'}
                  onChange={(e) => setFormData(prev => ({ ...prev, title_color: e.target.value }))}
                  aria-label="Choisir la couleur du titre"
                />
              </div>

              <div>
                <Label htmlFor="media">Média (Image ou Vidéo)</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    {formData.media_type === 'image' ? (
                      <FileImage className="h-4 w-4 text-blue-600" />
                    ) : (
                      <FileVideo className="h-4 w-4 text-purple-600" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      Type: {formData.media_type === 'image' ? 'Image' : 'Vidéo'}
                    </span>
                  </div>
                  <Input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    disabled={isSubmitting}
                  />
                  {formData.media_url && (
                    <div className="relative">
                      {formData.media_type === 'image' ? (
                        <img 
                          src={formData.media_url} 
                          alt="Aperçu" 
                          className="w-full h-32 object-cover rounded-md"
                        />
                      ) : (
                        <video 
                          src={formData.media_url} 
                          className="w-full h-32 object-cover rounded-md"
                          controls
                          muted
                        />
                      )}
                    </div>
                  )}
                  <Input
                    value={formData.media_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, media_url: e.target.value }))}
                    placeholder="Ou saisissez l'URL du média directement"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="button_text">Texte du bouton (optionnel)</Label>
                <Input
                  id="button_text"
                  value={formData.button_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, button_text: e.target.value }))}
                  placeholder="Texte affiché sur le bouton"
                />
              </div>

              <div>
                <Label htmlFor="button_link">Lien du bouton (optionnel)</Label>
                <Input
                  id="button_link"
                  value={formData.button_link}
                  onChange={(e) => setFormData(prev => ({ ...prev, button_link: e.target.value }))}
                  placeholder="#section-id ou https://example.com"
                />
              </div>

              <div>
                <Label htmlFor="display_duration">Durée d'affichage (secondes)</Label>
                <Input
                  id="display_duration"
                  type="number"
                  min="1"
                  max="60"
                  value={formData.display_duration_seconds}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_duration_seconds: parseInt(e.target.value) || 3 }))}
                  placeholder="3"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting || !formData.title || !formData.media_url}>
                  {isSubmitting ? 'Enregistrement...' : (editingSlide ? 'Modifier' : 'Créer')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {slides?.map((slide, index) => (
          <Card key={slide.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-lg">Slide {index + 1}</CardTitle>
                  <div className="flex items-center gap-2">
                    {slide.is_active ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveSlide(slide.id, 'up')}
                      disabled={index === 0}
                      className="h-6 px-2"
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMoveSlide(slide.id, 'down')}
                      disabled={index === (slides?.length || 0) - 1}
                      className="h-6 px-2"
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <Switch
                    checked={slide.is_active}
                    onCheckedChange={() => handleToggleActive(slide)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(slide)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(slide.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  {slide.media_type === 'image' ? (
                    <img 
                      src={slide.media_url} 
                      alt={slide.title}
                      className="w-full h-48 object-cover rounded-md"
                    />
                  ) : (
                    <video 
                      src={slide.media_url} 
                      className="w-full h-48 object-cover rounded-md"
                      controls
                      muted
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <strong>Titre:</strong>
                    <p className="text-sm text-muted-foreground">{slide.title}</p>
                  </div>
                  {slide.button_text && (
                    <div>
                      <strong>Bouton:</strong>
                      <p className="text-sm text-muted-foreground">
                        {slide.button_text} → {slide.button_link}
                      </p>
                    </div>
                  )}
                  <div>
                    <strong>Ordre:</strong>
                    <p className="text-sm text-muted-foreground">{slide.display_order}</p>
                  </div>
                  <div>
                    <strong>Durée d'affichage:</strong>
                    <p className="text-sm text-muted-foreground">{slide.display_duration_seconds} secondes</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {(!slides || slides.length === 0) && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground mb-4">Aucune slide configurée</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Créer votre première slide
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HomepageCarousel;