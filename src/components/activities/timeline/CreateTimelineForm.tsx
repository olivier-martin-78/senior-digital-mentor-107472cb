import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Upload } from 'lucide-react';
import { TimelineData, TimelineEvent } from '@/types/timeline';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateTimelineFormProps {
  onSubmit: (data: TimelineData) => void;
  onCancel: () => void;
  initialData?: TimelineData;
}

export const CreateTimelineForm: React.FC<CreateTimelineFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState<TimelineData>(initialData || {
    creatorName: '',
    shareGlobally: false,
    timelineName: '',
    showYearOnCard: true,
    showDateOnCard: true,
    events: []
  });

  const [currentEvent, setCurrentEvent] = useState<Partial<TimelineEvent>>({
    name: '',
    description: '',
    year: '',
    category: ''
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleInputChange = (field: keyof TimelineData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEventChange = (field: keyof TimelineEvent, value: string) => {
    setCurrentEvent(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `timeline-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError, data } = await supabase.storage
        .from('activity-thumbnails')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('activity-thumbnails')
        .getPublicUrl(filePath);

      setCurrentEvent(prev => ({ ...prev, imageUrl: publicUrl }));
      toast({ title: "Image téléchargée avec succès" });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: "Erreur lors du téléchargement", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const addEvent = () => {
    if (!currentEvent.name || !currentEvent.year || !currentEvent.description) {
      toast({ title: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }

    const newEvent: TimelineEvent = {
      id: Date.now().toString(),
      name: currentEvent.name!,
      description: currentEvent.description!,
      year: currentEvent.year!,
      category: currentEvent.category || '',
      imageUrl: currentEvent.imageUrl
    };

    setFormData(prev => ({
      ...prev,
      events: [...prev.events, newEvent]
    }));

    setCurrentEvent({
      name: '',
      description: '',
      year: '',
      category: '',
      imageUrl: undefined
    });
  };

  const removeEvent = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.filter(event => event.id !== eventId)
    }));
  };

  const handleSubmit = () => {
    if (!formData.creatorName || !formData.timelineName || formData.events.length < 2) {
      toast({ 
        title: "Informations manquantes", 
        description: "Veuillez remplir tous les champs et ajouter au moins 2 événements",
        variant: "destructive" 
      });
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Création de votre frise chronologique personnelle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="creatorName">Votre nom</Label>
              <Input
                id="creatorName"
                value={formData.creatorName}
                onChange={(e) => handleInputChange('creatorName', e.target.value)}
                placeholder="Entrez votre nom"
              />
            </div>
            <div>
              <Label htmlFor="shareGlobally">Partager cette frise avec tout le monde</Label>
              <Select 
                value={formData.shareGlobally ? 'yes' : 'no'} 
                onValueChange={(value) => handleInputChange('shareGlobally', value === 'yes')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Oui</SelectItem>
                  <SelectItem value="no">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="timelineName">Nom de votre frise chronologique</Label>
            <Input
              id="timelineName"
              value={formData.timelineName}
              onChange={(e) => handleInputChange('timelineName', e.target.value)}
              placeholder="Nom de la frise"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="showYear">Afficher l'année sur la carte de l'évènement</Label>
              <Select 
                value={formData.showYearOnCard ? 'yes' : 'no'} 
                onValueChange={(value) => handleInputChange('showYearOnCard', value === 'yes')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Oui</SelectItem>
                  <SelectItem value="no">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="showDateOnCard">Date visible dans la carte</Label>
              <Select 
                value={formData.showDateOnCard ? 'yes' : 'no'} 
                onValueChange={(value) => handleInputChange('showDateOnCard', value === 'yes')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Oui</SelectItem>
                  <SelectItem value="no">Non</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter un évènement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="eventName">Nom de l'évènement</Label>
              <Input
                id="eventName"
                value={currentEvent.name || ''}
                onChange={(e) => handleEventChange('name', e.target.value)}
                placeholder="Nom de l'évènement"
              />
            </div>
            <div>
              <Label htmlFor="eventYear">Année</Label>
              <Input
                id="eventYear"
                value={currentEvent.year || ''}
                onChange={(e) => handleEventChange('year', e.target.value)}
                placeholder="Année (ex: 1969)"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="eventCategory">Catégorie de l'évènement</Label>
            <Input
              id="eventCategory"
              value={currentEvent.category || ''}
              onChange={(e) => handleEventChange('category', e.target.value)}
              placeholder="Catégorie (optionnel)"
            />
          </div>

          <div>
            <Label htmlFor="eventDescription">Description de l'évènement</Label>
            <Textarea
              id="eventDescription"
              value={currentEvent.description || ''}
              onChange={(e) => handleEventChange('description', e.target.value)}
              placeholder="Description de l'évènement"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="eventImage">Vignette de l'évènement</Label>
            <div className="flex items-center gap-4 mt-2">
              <input
                id="eventImage"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('eventImage')?.click()}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Téléchargement...' : 'Choisir une image'}
              </Button>
              {currentEvent.imageUrl && (
                <img 
                  src={currentEvent.imageUrl} 
                  alt="Aperçu" 
                  className="w-16 h-16 object-cover rounded"
                />
              )}
            </div>
          </div>

          <Button onClick={addEvent} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter l'évènement
          </Button>
        </CardContent>
      </Card>

      {formData.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Évènements ajoutés ({formData.events.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formData.events.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {event.imageUrl && (
                      <img 
                        src={event.imageUrl} 
                        alt={event.name} 
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div>
                      <div className="font-medium">{event.name} ({event.year})</div>
                      <div className="text-sm text-muted-foreground">{event.description}</div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeEvent(event.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={handleSubmit}>
          Enregistrer
        </Button>
      </div>
    </div>
  );
};