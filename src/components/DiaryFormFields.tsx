import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover';
import { Button } from '@/components/ui/button';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface DiaryFormFieldsProps {
  form: UseFormReturn<any>;
  onMediaChange: (file: File | null) => void;
}

export const DiaryFormFields: React.FC<DiaryFormFieldsProps> = ({ form, onMediaChange }) => {
  const [tagInput, setTagInput] = useState('');
  const [contactInput, setContactInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const addTag = () => {
    if (!tagInput.trim()) return;
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', [...currentTags, tagInput.trim()]);
    setTagInput('');
  };

  const removeTag = (index: number) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter((_, i) => i !== index));
  };

  const addContact = () => {
    if (!contactInput.trim()) return;
    const currentContacts = form.getValues('contacted_people') || [];
    form.setValue('contacted_people', [...currentContacts, contactInput.trim()]);
    setContactInput('');
  };

  const removeContact = (index: number) => {
    const currentContacts = form.getValues('contacted_people') || [];
    form.setValue('contacted_people', currentContacts.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    
    // Supprimer l'ancienne URL de prévisualisation si elle existe
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      onMediaChange(file);
    } else {
      setSelectedFile(null);
      // Ne pas effacer previewUrl ici pour conserver la prévisualisation du fichier existant
      onMediaChange(null);
    }
  };

  useEffect(() => {
    // Nettoyer les URL blob à la destruction du composant
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <>
      {/* Date */}
      <FormField
        control={form.control}
        name="entry_date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Date</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? (
                      format(field.value, "d MMMM yyyy", { locale: fr })
                    ) : (
                      <span>Choisir une date</span>
                    )}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Titre */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Titre *</FormLabel>
            <FormControl>
              <Input placeholder="Titre de votre entrée" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Ce que j'ai fait aujourd'hui */}
      <FormField
        control={form.control}
        name="activities"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ce que j'ai fait aujourd'hui</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Décrivez vos activités de la journée..." 
                className="min-h-[100px]" 
                {...field} 
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Humeur du jour */}
      <FormField
        control={form.control}
        name="mood_rating"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Humeur du jour</FormLabel>
            <FormControl>
              <div className="space-y-2">
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  defaultValue={[field.value || 3]}
                  onValueChange={(value) => field.onChange(value[0])}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>😔</span>
                  <span>😐</span>
                  <span>😊</span>
                  <span>😃</span>
                  <span>🤩</span>
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Choses positives */}
      <FormField
        control={form.control}
        name="positive_things"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Choses positives</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Les choses positives de votre journée..." 
                {...field} 
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Choses négatives */}
      <FormField
        control={form.control}
        name="negative_things"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Choses négatives</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Les choses négatives de votre journée..." 
                {...field} 
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Forme physique */}
      <FormField
        control={form.control}
        name="physical_state"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Forme physique</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value || ''}
                className="flex space-x-4"
              >
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="fatigué" />
                  </FormControl>
                  <FormLabel className="font-normal">Fatigué</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="dormi" />
                  </FormControl>
                  <FormLabel className="font-normal">Bien dormi</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="énergique" />
                  </FormControl>
                  <FormLabel className="font-normal">Énergique</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Forme mentale */}
      <FormField
        control={form.control}
        name="mental_state"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Forme mentale</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value || ''}
                className="flex space-x-4"
              >
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="stressé" />
                  </FormControl>
                  <FormLabel className="font-normal">Stressé</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="calme" />
                  </FormControl>
                  <FormLabel className="font-normal">Calme</FormLabel>
                </FormItem>
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <RadioGroupItem value="motivé" />
                  </FormControl>
                  <FormLabel className="font-normal">Motivé</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Personnes contactées */}
      <FormField
        control={form.control}
        name="contacted_people"
        render={() => (
          <FormItem>
            <FormLabel>Personnes contactées</FormLabel>
            <div className="flex space-x-2">
              <Input
                placeholder="Nom de la personne"
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addContact();
                  }
                }}
              />
              <Button type="button" onClick={addContact}>Ajouter</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(form.getValues('contacted_people') || []).map((contact: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {contact}
                  <button 
                    type="button" 
                    className="ml-1 text-xs" 
                    onClick={() => removeContact(index)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Réflexions du jour */}
      <FormField
        control={form.control}
        name="reflections"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Réflexions du jour</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Vos réflexions sur la journée..." 
                className="min-h-[100px]" 
                {...field} 
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Média */}
      <FormItem>
        <FormLabel>Média (photo/vidéo/audio)</FormLabel>
        <FormControl>
          <Input
            type="file"
            accept="image/*,video/*,audio/*"
            onChange={handleFileChange}
          />
        </FormControl>
        {selectedFile && (
          <div className="mt-2">
            <p>Fichier sélectionné: {selectedFile.name}</p>
            {selectedFile.type.startsWith('image/') && previewUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                <img 
                  src={previewUrl} 
                  alt="Prévisualisation" 
                  className="max-h-48 object-contain"
                />
              </div>
            )}
          </div>
        )}
        <FormDescription>
          Ajoutez une photo, vidéo ou un enregistrement audio lié à votre journée
        </FormDescription>
      </FormItem>
      
      {/* Envie du jour */}
      <FormField
        control={form.control}
        name="desire_of_day"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Envie du jour</FormLabel>
            <FormControl>
              <Input placeholder="Ce que vous aimeriez faire..." {...field} value={field.value || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Tags ou catégories */}
      <FormField
        control={form.control}
        name="tags"
        render={() => (
          <FormItem>
            <FormLabel>Tags ou catégories</FormLabel>
            <div className="flex space-x-2">
              <Input
                placeholder="Ajouter un tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" onClick={addTag}>Ajouter</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(form.getValues('tags') || []).map((tag: string, index: number) => (
                <Badge key={index} variant="outline">
                  {tag}
                  <button 
                    type="button" 
                    className="ml-1 text-xs" 
                    onClick={() => removeTag(index)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <FormDescription>
              Ajoutez des tags ou des catégories pour organiser vos entrées (ex: travail, famille, sport)
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Notes privées */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="private_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes privées</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Vos notes privées..." 
                  className="min-h-[100px]" 
                  {...field} 
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="is_private_notes_locked"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel>Verrouiller les notes privées</FormLabel>
                <FormDescription>
                  Les notes privées seront masquées jusqu'à ce que vous choisissiez de les afficher.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      
      {/* Objectifs ou tâches */}
      <FormField
        control={form.control}
        name="objectives"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Objectifs ou tâches</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Vos objectifs pour demain..." 
                {...field} 
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};
