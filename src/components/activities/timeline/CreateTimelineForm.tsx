import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Upload, Edit } from 'lucide-react';
import { TimelineData, TimelineEvent } from '@/types/timeline';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import SubActivitySelector from '@/components/activities/SubActivitySelector';
import { UserActionsService } from '@/services/UserActionsService';

interface CreateTimelineFormProps {
  onSubmit: (data: TimelineData & { subActivityTagId?: string }) => void;
  onCancel: () => void;
  initialData?: TimelineData;
  initialSubActivityTagId?: string | null;
}

export const CreateTimelineForm: React.FC<CreateTimelineFormProps> = ({ onSubmit, onCancel, initialData, initialSubActivityTagId }) => {
  console.log('🔍 CreateTimelineForm - Initialisation avec:', {
    initialData,
    initialSubActivityTagId,
    hasInitialData: !!initialData,
    isEditing: !!initialData
  });

  const [formData, setFormData] = useState<TimelineData>(initialData || {
    creatorName: '',
    shareGlobally: false,
    timelineName: '',
    showYearOnCard: true,
    showDateOnCard: true,
    events: [],
    thumbnailUrl: undefined
  });

  const [currentEvent, setCurrentEvent] = useState<Partial<TimelineEvent>>({
    name: '',
    description: '',
    year: '',
    category: '',
    answerOptions: undefined
  });

  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedSubTagId, setSelectedSubTagId] = useState<string | null>(initialSubActivityTagId || null);
  
  console.log('🔍 CreateTimelineForm - État initial selectedSubTagId:', {
    selectedSubTagId,
    initialSubActivityTagId,
    willSetFromProp: !!initialSubActivityTagId
  });

  // useEffect pour surveiller les changements de initialSubActivityTagId
  React.useEffect(() => {
    console.log('🔍 CreateTimelineForm - useEffect initialSubActivityTagId changé:', {
      newValue: initialSubActivityTagId,
      oldSelectedSubTagId: selectedSubTagId,
      willUpdate: !!initialSubActivityTagId && initialSubActivityTagId !== selectedSubTagId
    });
    
    if (initialSubActivityTagId && initialSubActivityTagId !== selectedSubTagId) {
      console.log('🔍 CreateTimelineForm - Mise à jour selectedSubTagId vers:', initialSubActivityTagId);
      setSelectedSubTagId(initialSubActivityTagId);
    }
  }, [initialSubActivityTagId, selectedSubTagId]);
  const [isUploading, setIsUploading] = useState(false);
  const [isThumbnailUploading, setIsThumbnailUploading] = useState(false);

  const handleInputChange = (field: keyof TimelineData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEventChange = (field: keyof TimelineEvent, value: string | string[]) => {
    setCurrentEvent(prev => ({ ...prev, [field]: value }));
  };

  const handleAnswerOptionChange = (index: number, value: string) => {
    setCurrentEvent(prev => {
      const newOptions = prev.answerOptions ? [...prev.answerOptions] : ['', '', ''];
      newOptions[index] = value;
      return { ...prev, answerOptions: newOptions };
    });
  };

  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `timeline-event-${Date.now()}.${fileExt}`;
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

  const handleThumbnailUpload = async (file: File) => {
    setIsThumbnailUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `timeline-thumbnail-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError, data } = await supabase.storage
        .from('activity-thumbnails')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('activity-thumbnails')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, thumbnailUrl: publicUrl }));
      toast({ title: "Vignette téléchargée avec succès" });
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      toast({ title: "Erreur lors du téléchargement de la vignette", variant: "destructive" });
    } finally {
      setIsThumbnailUploading(false);
    }
  };

  const addEvent = () => {
    console.log('Adding event validation:', {
      currentEvent: currentEvent,
      name: currentEvent.name,
      year: currentEvent.year,
      description: currentEvent.description,
      answerOptions: currentEvent.answerOptions
    });

    if (!currentEvent.name || !currentEvent.year || !currentEvent.description) {
      console.log('Missing required fields');
      toast({ title: "Veuillez remplir tous les champs obligatoires", variant: "destructive" });
      return;
    }

    // Vérifier les options de réponse seulement si elles sont fournies ET non vides
    const answerOptions = currentEvent.answerOptions || [];
    console.log('Answer options check:', answerOptions);
    
    // Vérifier si au moins une option de réponse est remplie
    const hasFilledOptions = answerOptions.some(option => option && option.trim());
    
    // Si des options de réponse sont commencées, elles doivent être complètes (3 options)
    if (hasFilledOptions) {
      if (answerOptions.length !== 3 || answerOptions.some(option => !option.trim())) {
        console.log('Answer options incomplete');
        toast({ 
          title: "Options de réponse incomplètes", 
          description: "Si vous ajoutez des options de réponse, veuillez remplir les 3 options pour le quiz",
          variant: "destructive" 
        });
        return;
      }

      // Vérifier qu'une des options correspond à l'année
      console.log('Checking if year matches options:', currentEvent.year, answerOptions);
      if (!answerOptions.includes(currentEvent.year!)) {
        console.log('No option matches the year');
        toast({ 
          title: "Aucune option ne correspond à l'année", 
          description: "Une des options de réponse doit correspondre exactement à l'année saisie",
          variant: "destructive" 
        });
        return;
      }
    }

    console.log('All validations passed, adding event');

    if (editingEventId) {
      // Mode édition
      const updatedEvent: TimelineEvent = {
        id: editingEventId,
        name: currentEvent.name!,
        description: currentEvent.description!,
        year: currentEvent.year!,
        category: currentEvent.category || '',
        imageUrl: currentEvent.imageUrl,
        answerOptions: hasFilledOptions ? currentEvent.answerOptions : undefined
      };

      setFormData(prev => ({
        ...prev,
        events: prev.events.map(event => 
          event.id === editingEventId ? updatedEvent : event
        )
      }));

      setEditingEventId(null);
      toast({ title: "Événement modifié avec succès" });
    } else {
      // Mode ajout
      const newEvent: TimelineEvent = {
        id: Date.now().toString(),
        name: currentEvent.name!,
        description: currentEvent.description!,
        year: currentEvent.year!,
        category: currentEvent.category || '',
        imageUrl: currentEvent.imageUrl,
        answerOptions: hasFilledOptions ? currentEvent.answerOptions : undefined
      };

      setFormData(prev => ({
        ...prev,
        events: [...prev.events, newEvent]
      }));

      toast({ title: "Événement ajouté avec succès" });
    }

    // Réinitialiser le formulaire
    setCurrentEvent({
      name: '',
      description: '',
      year: '',
      category: '',
      imageUrl: undefined,
      answerOptions: undefined
    });
  };

  const editEvent = (event: TimelineEvent) => {
    setCurrentEvent({
      name: event.name,
      description: event.description,
      year: event.year,
      category: event.category,
      imageUrl: event.imageUrl,
      answerOptions: event.answerOptions || undefined
    });
    setEditingEventId(event.id);
  };

  const cancelEdit = () => {
    setEditingEventId(null);
    setCurrentEvent({
      name: '',
      description: '',
      year: '',
      category: '',
      imageUrl: undefined,
      answerOptions: undefined
    });
  };

  const removeEvent = (eventId: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.filter(event => event.id !== eventId)
    }));
  };

  const handleSubmit = () => {
    console.log('🔍 Timeline form validation:', {
      creatorName: formData.creatorName,
      timelineName: formData.timelineName,
      eventsCount: formData.events.length,
      selectedSubTagId: selectedSubTagId,
      formData: formData
    });
    
    if (!formData.creatorName || !formData.timelineName || formData.events.length < 1) {
      console.log('❌ Validation failed - missing data');
      toast({ 
        title: "Informations manquantes", 
        description: "Veuillez remplir tous les champs et ajouter au moins 1 événement",
        variant: "destructive" 
      });
      return;
    }

    console.log('✅ Validation passed, calling onSubmit with selectedSubTagId:', selectedSubTagId);
    
    // Track timeline creation
    UserActionsService.trackCreate('activity', 'timeline-created', formData.timelineName, {
      action: 'timeline_created',
      eventsCount: formData.events.length,
      shareGlobally: formData.shareGlobally,
      subTagId: selectedSubTagId
    });
    
    console.log('🚀 Calling onSubmit with data:', { ...formData, subActivityTagId: selectedSubTagId });
    onSubmit({ ...formData, subActivityTagId: selectedSubTagId });
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

          {/* Sélecteur de sous-activité */}
          <SubActivitySelector
            activityType="games"
            selectedSubTagId={selectedSubTagId}
            onSubTagChange={(subTagId) => {
              console.log('🔍 SubActivitySelector - Changement de sous-activité:', subTagId);
              setSelectedSubTagId(subTagId);
            }}
          />

          <div>
            <Label htmlFor="timelineThumbnail">Vignette de votre frise chronologique</Label>
            <div className="flex items-center gap-4 mt-2">
              <input
                id="timelineThumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleThumbnailUpload(file);
                }}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('timelineThumbnail')?.click()}
                disabled={isThumbnailUploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isThumbnailUploading ? 'Téléchargement...' : 'Choisir une vignette'}
              </Button>
              {formData.thumbnailUrl && (
                <img 
                  src={formData.thumbnailUrl} 
                  alt="Vignette de la timeline" 
                  className="w-16 h-16 object-cover rounded"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Cette vignette illustrera votre jeu Timeline dans la liste des activités
            </p>
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
          <CardTitle>
            {editingEventId ? 'Modifier l\'événement' : 'Ajouter un événement'}
          </CardTitle>
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

          <div>
            <Label>Options de réponse pour le quiz (optionnel - 3 options requises si utilisé)</Label>
            <div className="space-y-2 mt-2">
              {((currentEvent.answerOptions && currentEvent.answerOptions.length > 0) ? currentEvent.answerOptions : ['', '', '']).map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm font-medium w-8">
                    {String.fromCharCode(65 + index)})
                  </span>
                  <Input
                    value={option}
                    onChange={(e) => handleAnswerOptionChange(index, e.target.value)}
                    placeholder={`Option ${String.fromCharCode(65 + index)} (ex: 1960-1970)`}
                  />
                  {option === currentEvent.year && (
                    <span className="text-xs text-green-600 font-medium">✓ Bonne réponse</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Laissez vide pour une timeline classique, ou remplissez les 3 options pour un quiz. 
              La bonne réponse sera automatiquement détectée parmi les options qui correspondent à l'année saisie ({currentEvent.year})
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={addEvent} className="flex-1">
              {editingEventId ? (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier l'événement
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter l'événement
                </>
              )}
            </Button>
            {editingEventId && (
              <Button variant="outline" onClick={cancelEdit}>
                Annuler
              </Button>
            )}
          </div>
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
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => editEvent(event)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEvent(event.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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
