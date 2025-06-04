import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, X, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import MoodSelector from '@/components/MoodSelector';
import ImageUploadField from '@/components/diary/ImageUploadField';

interface DiaryFormFieldsProps {
  form: UseFormReturn<any>;
  onMediaChange?: (file: File | null) => void;
  existingMediaUrl?: string | null;
  existingMediaType?: string | null;
}

const DiaryFormFields = ({ form, onMediaChange, existingMediaUrl, existingMediaType }: DiaryFormFieldsProps) => {
  const [newPerson, setNewPerson] = useState('');
  const [newTag, setNewTag] = useState('');

  const addPerson = () => {
    if (newPerson.trim()) {
      const currentPeople = form.getValues('contacted_people') || [];
      form.setValue('contacted_people', [...currentPeople, newPerson.trim()]);
      setNewPerson('');
    }
  };

  const removePerson = (index: number) => {
    const currentPeople = form.getValues('contacted_people') || [];
    form.setValue('contacted_people', currentPeople.filter((_: string, i: number) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim()) {
      const currentTags = form.getValues('tags') || [];
      form.setValue('tags', [...currentTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue('tags', currentTags.filter((_: string, i: number) => i !== index));
  };

  // Vérifier si les champs sont verrouillés
  const isLocked = form.watch('is_private_notes_locked');

  return (
    <div className="space-y-6">
      {/* Verrouillage - Placé en premier pour plus de visibilité */}
      <FormField
        control={form.control}
        name="is_private_notes_locked"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-amber-50">
            <div className="space-y-0.5">
              <FormLabel className="text-base font-medium">
                Verrouiller l'entrée
              </FormLabel>
              <div className="text-sm text-muted-foreground">
                Empêche la modification de tous les champs sauf le titre et la date
              </div>
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

      {isLocked && (
        <div className="p-3 bg-amber-100 border border-amber-300 rounded-lg">
          <p className="text-sm text-amber-800">
            🔒 Cette entrée est verrouillée. Seuls le titre et la date peuvent être modifiés.
          </p>
        </div>
      )}

      {/* Date - toujours modifiable */}
      <FormField
        control={form.control}
        name="entry_date"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Date de l'entrée</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[240px] pl-3 text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value ? (
                      format(field.value, "PPP", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Titre - toujours modifiable */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Titre de l'entrée</FormLabel>
            <FormControl>
              <Input placeholder="Donnez un titre à votre journée..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Activités - verrouillable */}
      <FormField
        control={form.control}
        name="activities"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Activités de la journée</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Décrivez vos activités de la journée..."
                className="min-h-[100px]"
                {...field}
                value={field.value || ''}
                disabled={isLocked}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Humeur - verrouillable */}
      <MoodSelector form={form} disabled={isLocked} />

      {/* Choses positives - verrouillable */}
      <FormField
        control={form.control}
        name="positive_things"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Choses positives de la journée</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Qu'est-ce qui s'est bien passé aujourd'hui ?"
                {...field}
                value={field.value || ''}
                disabled={isLocked}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Choses négatives - verrouillable */}
      <FormField
        control={form.control}
        name="negative_things"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Difficultés rencontrées</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Y a-t-il eu des difficultés aujourd'hui ?"
                {...field}
                value={field.value || ''}
                disabled={isLocked}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* État physique - verrouillable */}
      <FormField
        control={form.control}
        name="physical_state"
        render={({ field }) => (
          <FormItem>
            <FormLabel>État physique</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value || ''}
              disabled={isLocked}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Comment vous sentiez-vous physiquement ?" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="fatigué">Fatigué</SelectItem>
                <SelectItem value="dormi">Bien reposé</SelectItem>
                <SelectItem value="énergique">Énergique</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* État mental - verrouillable */}
      <FormField
        control={form.control}
        name="mental_state"
        render={({ field }) => (
          <FormItem>
            <FormLabel>État mental</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              value={field.value || ''}
              disabled={isLocked}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Comment vous sentiez-vous mentalement ?" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="stressé">Stressé</SelectItem>
                <SelectItem value="calme">Calme</SelectItem>
                <SelectItem value="motivé">Motivé</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Personnes contactées - verrouillable */}
      <FormField
        control={form.control}
        name="contacted_people"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Personne avec qui j'ai bien échangé aujourd'hui</FormLabel>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Nom de la personne..."
                  value={newPerson}
                  onChange={(e) => setNewPerson(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPerson())}
                  disabled={isLocked}
                />
                <Button 
                  type="button" 
                  onClick={addPerson} 
                  size="sm"
                  disabled={isLocked}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(field.value || []).map((person: string, index: number) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {person}
                    {!isLocked && (
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removePerson(index)}
                      />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Réflexions - verrouillable */}
      <FormField
        control={form.control}
        name="reflections"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Réflexions</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Vos réflexions sur la journée..."
                {...field}
                value={field.value || ''}
                disabled={isLocked}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Désir du jour - verrouillable */}
      <FormField
        control={form.control}
        name="desire_of_day"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Désir/Envie du jour</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Qu'avez-vous envie de faire demain ?"
                {...field}
                value={field.value || ''}
                disabled={isLocked}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Objectifs - CORRECTION DU PROBLÈME DE TRONCATURE */}
      <FormField
        control={form.control}
        name="objectives"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Objectifs pour demain</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Quels sont vos objectifs pour demain ?"
                {...field}
                value={field.value || ''}
                disabled={isLocked}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Tags - verrouillable */}
      <FormField
        control={form.control}
        name="tags"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Mots-clés</FormLabel>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Ajouter un mot-clé..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  disabled={isLocked}
                />
                <Button 
                  type="button" 
                  onClick={addTag} 
                  size="sm"
                  disabled={isLocked}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(field.value || []).map((tag: string, index: number) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    #{tag}
                    {!isLocked && (
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTag(index)}
                      />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Média - verrouillable avec support HEIC */}
      {onMediaChange && (
        <ImageUploadField 
          form={form} 
          onMediaChange={onMediaChange}
          disabled={isLocked}
        />
      )}
    </div>
  );
};

export default DiaryFormFields;
