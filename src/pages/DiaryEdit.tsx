
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Header from '@/components/Header';
import { v4 as uuidv4 } from 'uuid';
import { parseISO } from 'date-fns';
import { DiaryEntry } from '@/types/diary';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import DiaryFormFields from '@/components/DiaryFormFields';
import { ArrowLeft } from 'lucide-react';
import { getPublicUrl, getPathFromUrl, DIARY_MEDIA_BUCKET } from '@/utils/storageUtils';
import { getThumbnailUrl } from '@/utils/thumbnailtUtils';

const diaryFormSchema = z.object({
  entry_date: z.date(),
  title: z.string().min(1, 'Le titre est requis'),
  activities: z.string().optional().nullable(),
  mood_rating: z.number().min(1).max(5).nullable().optional(),
  positive_things: z.string().optional().nullable(),
  negative_things: z.string().optional().nullable(),
  physical_state: z.string().nullable().optional(),
  mental_state: z.string().nullable().optional(),
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

const DiaryEdit = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [entry, setEntry] = useState<DiaryEntry | null>(null);
  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);

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

  useEffect(() => {
    const fetchEntry = async () => {
      if (!id || !user) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('diary_entries')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          const entryData = data as DiaryEntry;
          
          // Vérifier les permissions de modification
          const canEdit = entryData.user_id === user.id || hasRole('admin');
          
          if (!canEdit) {
            toast({
              title: 'Accès refusé',
              description: "Vous n'avez pas les permissions pour modifier cette entrée.",
              variant: 'destructive',
            });
            navigate(`/diary/${id}`);
            return;
          }
          
          setEntry(entryData);
          
          // Créer la date en ajoutant l'heure pour éviter les problèmes de fuseau horaire
          const entryDate = entryData.entry_date ? new Date(entryData.entry_date + 'T12:00:00') : new Date();
          
          // Set form values
          form.reset({
            entry_date: entryDate,
            title: entryData.title || '',
            activities: entryData.activities || '',
            mood_rating: entryData.mood_rating || null,
            positive_things: entryData.positive_things || '',
            negative_things: entryData.negative_things || '',
            physical_state: entryData.physical_state || null,
            mental_state: entryData.mental_state || null,
            contacted_people: entryData.contacted_people || [],
            reflections: entryData.reflections || '',
            desire_of_day: entryData.desire_of_day || '',
            tags: entryData.tags || [],
            private_notes: entryData.private_notes || '',
            is_private_notes_locked: entryData.is_private_notes_locked || false,
            objectives: entryData.objectives || '',
          });
          
          console.log("Entrée chargée avec succès:", entryData);
          if (entryData.media_url) {
            console.log("URL du média existant:", entryData.media_url);
            console.log("Type du média existant:", entryData.media_type);
            
            // Charger l'URL du media pour la prévisualisation
            try {
              const url = await getThumbnailUrl(entryData.media_url, DIARY_MEDIA_BUCKET);
              setMediaPreviewUrl(url);
            } catch (error) {
              console.error("Erreur lors de la récupération de l'URL du média:", error);
            }
          }
        }
      } catch (error: any) {
        console.error('Erreur lors de la récupération de l\'entrée:', error);
        toast({
          title: 'Erreur',
          description: "Impossible de récupérer cette entrée de journal.",
          variant: 'destructive',
        });
        navigate('/diary');
      } finally {
        setLoading(false);
      }
    };

    fetchEntry();
  }, [id, user, hasRole, toast, navigate, form]);

  const onSubmit = async (data: DiaryFormValues) => {
    if (!user || !id || !entry) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour modifier une entrée de journal',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload new media file if exists
      let media_url = entry?.media_url || null;
      let media_type = entry?.media_type || null;
      
      if (mediaFile) {
        // Delete old media if exists
        if (entry?.media_url) {
          console.log("Suppression de l'ancien média:", entry.media_url);
          const mediaPath = getPathFromUrl(entry.media_url);
          if (mediaPath) {
            await supabase.storage
              .from(DIARY_MEDIA_BUCKET)
              .remove([mediaPath]);
          }
        }

        // Upload new media
        const fileExt = mediaFile.name.split('.').pop();
        const filePath = `${user.id}/${uuidv4()}.${fileExt}`;

        console.log("Téléchargement du nouveau média:", filePath);
        const { error: uploadError } = await supabase.storage
          .from(DIARY_MEDIA_BUCKET)
          .upload(filePath, mediaFile);

        if (uploadError) {
          throw uploadError;
        }

        // Get public URL
        media_url = filePath; // Stocke le chemin relatif, pas l'URL complète
        media_type = mediaFile.type;
      }
      
      // Format the entry data - utiliser toISOString().split('T')[0] pour obtenir la date locale
      const localDate = new Date(data.entry_date.getTime() - data.entry_date.getTimezoneOffset() * 60000);
      const entryData = {
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
        updated_at: new Date().toISOString(),
      };

      console.log("Mise à jour de l'entrée avec les données:", entryData);
      
      // Update entry in Supabase
      const { error } = await supabase
        .from('diary_entries')
        .update(entryData)
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: 'Succès',
        description: 'L\'entrée de journal a été mise à jour',
      });

      navigate(`/diary/${id}`);
    } catch (error: any) {
      console.error('Erreur lors de la modification de l\'entrée:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de modifier l\'entrée de journal',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMediaChange = (file: File | null) => {
    setMediaFile(file);
    console.log("Nouveau fichier sélectionné:", file?.name);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <Button 
              variant="outline"
              onClick={() => navigate(`/diary/${id}`)}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Retour
            </Button>
            <h1 className="text-2xl sm:text-3xl font-serif text-tranches-charcoal">Modifier l'entrée</h1>
          </div>
          
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
            {entry && (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <DiaryFormFields 
                    form={form} 
                    onMediaChange={handleMediaChange}
                    existingMediaUrl={entry.media_url}
                    existingMediaType={entry.media_type}
                  />
                  
                  {entry.media_url && !mediaFile && mediaPreviewUrl && (
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <h3 className="text-sm font-medium mb-2">Média actuel</h3>
                      {entry.media_type?.startsWith('image/') ? (
                        <div className="bg-gray-100 rounded-lg overflow-hidden">
                          <img 
                            src={mediaPreviewUrl} 
                            alt="Média existant" 
                            className="h-32 w-auto object-contain" 
                            onError={(e) => {
                              console.error("Erreur de chargement d'image:", entry.media_url);
                              const target = e.target as HTMLImageElement;
                              console.log("URL calculée:", target.src);
                              target.src = '/placeholder.svg';
                              target.className = "h-32 w-auto object-contain opacity-50";
                            }}
                            onLoad={() => console.log("Image existante chargée avec succès")}
                          />
                        </div>
                      ) : entry.media_type?.startsWith('video/') ? (
                        <video 
                          src={mediaPreviewUrl} 
                          className="h-32 w-auto" 
                          controls
                          onError={(e) => console.error("Erreur de chargement vidéo:", entry.media_url)}
                        />
                      ) : entry.media_type?.startsWith('audio/') ? (
                        <audio 
                          src={mediaPreviewUrl} 
                          controls
                          onError={(e) => console.error("Erreur de chargement audio:", entry.media_url)}
                        />
                      ) : (
                        <p>Un média est déjà attaché. Sélectionnez un nouveau fichier pour le remplacer.</p>
                      )}
                      
                      <div className="mt-4">
                        <p className="text-sm text-gray-500">
                          Pour remplacer ce média, sélectionnez un nouveau fichier ci-dessus.
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="w-full sm:w-auto order-2 sm:order-1"
                      onClick={() => navigate(`/diary/${id}`)}
                    >
                      Annuler
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-tranches-sage hover:bg-tranches-sage/90 w-full sm:w-auto order-1 sm:order-2"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                          Enregistrement...
                        </>
                      ) : (
                        'Enregistrer les modifications'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiaryEdit;
