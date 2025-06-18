
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Header from '@/components/Header';
import { v4 as uuidv4 } from 'uuid';

import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import DiaryFormFields from '@/components/DiaryFormFields';

const diaryFormSchema = z.object({
  entry_date: z.date(),
  title: z.string().min(1, 'Le titre est requis'),
  activities: z.string().optional().nullable(),
  mood_rating: z.number().min(1).max(5).nullable().optional(),
  positive_things: z.string().optional().nullable(),
  negative_things: z.string().optional().nullable(),
  physical_state: z.enum(['fatigué', 'dormi', 'énergique']).nullable().optional(),
  mental_state: z.enum(['stressé', 'calme', 'motivé']).nullable().optional(),
  contacted_people: z.array(z.string()).nullable().optional(),
  reflections: z.string().optional().nullable(),
  media: z.any().optional().nullable(),
  desire_of_day: z.string().optional().nullable(),
  tags: z.array(z.string()).nullable().optional(),
  private_notes: z.string().optional().nullable(),
  is_private_notes_locked: z.boolean().default(false),
  objectives: z.string().optional().nullable(),
});

type DiaryFormValues = z.infer<typeof diaryFormSchema>;

const DiaryNew = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);

  const form = useForm<DiaryFormValues>({
    resolver: zodResolver(diaryFormSchema),
    defaultValues: {
      entry_date: new Date(),
      title: '',
      activities: '',
      mood_rating: null,
      positive_things: '',
      negative_things: '',
      physical_state: null,
      mental_state: null,
      contacted_people: [],
      reflections: '',
      desire_of_day: '',
      tags: [],
      private_notes: '',
      is_private_notes_locked: false,
      objectives: '',
    },
  });

  const onSubmit = async (data: DiaryFormValues) => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour ajouter une entrée de journal',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload media file if exists
      let media_url = null;
      let media_type = null;
      
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const filePath = `${user.id}/${uuidv4()}.${fileExt}`;

        console.log("Téléchargement du média:", filePath);
        const { error: uploadError } = await supabase.storage
          .from('diary_media')
          .upload(filePath, mediaFile);

        if (uploadError) {
          throw uploadError;
        }

        // Store the relative path, not the full URL
        media_url = filePath;
        media_type = mediaFile.type;
        console.log("Média téléchargé avec succès:", media_url);
      }

      // Format the entry data - utiliser toISOString().split('T')[0] pour obtenir la date locale
      const localDate = new Date(data.entry_date.getTime() - data.entry_date.getTimezoneOffset() * 60000);
      const entryData = {
        user_id: user.id,
        entry_date: localDate.toISOString().split('T')[0],
        title: data.title,
        activities: data.activities || null,
        mood_rating: data.mood_rating,
        positive_things: data.positive_things || null,
        negative_things: data.negative_things || null,
        physical_state: data.physical_state,
        mental_state: data.mental_state,
        contacted_people: data.contacted_people || [],
        reflections: data.reflections || null,
        media_url,
        media_type,
        desire_of_day: data.desire_of_day || null,
        tags: data.tags || [],
        private_notes: data.private_notes || null,
        is_private_notes_locked: data.is_private_notes_locked,
        objectives: data.objectives || null,
      };

      console.log("Création de l'entrée avec les données:", entryData);

      // Insert entry into Supabase
      const { error } = await supabase
        .from('diary_entries')
        .insert(entryData);

      if (error) {
        throw error;
      }

      toast({
        title: 'Succès',
        description: 'Votre entrée de journal a été enregistrée',
      });

      navigate('/diary');
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout de l\'entrée:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ajouter l\'entrée de journal',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaChange = (file: File | null) => {
    setMediaFile(file);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-serif text-tranches-charcoal mb-8">Nouvelle entrée de journal</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <DiaryFormFields 
                  form={form} 
                  onMediaChange={handleMediaChange} 
                />
                
                <div className="flex justify-end pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="mr-2"
                    onClick={() => navigate('/diary')}
                  >
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-tranches-sage hover:bg-tranches-sage/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryNew;
