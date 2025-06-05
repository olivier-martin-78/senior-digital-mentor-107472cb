import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { uploadAlbumThumbnail } from '@/utils/thumbnailtUtils';
import { v4 as uuidv4 } from 'uuid';

const wishFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  content: z.string().min(1, 'Le contenu est requis'),
  first_name: z.string().optional(),
  location: z.string().optional(),
  request_type: z.string().optional(),
  custom_request_type: z.string().optional(),
  date: z.string().optional(),
  importance: z.string().optional(),
  needs: z.string().optional(),
  offering: z.string().optional(),
  attachment_url: z.string().optional(),
  cover_image: z.any().optional(),
});

type WishFormValues = z.infer<typeof wishFormSchema>;

const WishNew = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

  const form = useForm<WishFormValues>({
    resolver: zodResolver(wishFormSchema),
    defaultValues: {
      title: '',
      content: '',
      first_name: '',
      location: '',
      request_type: '',
      custom_request_type: '',
      date: '',
      importance: '',
      needs: '',
      offering: '',
      attachment_url: '',
    },
  });

  const watchRequestType = form.watch('request_type');

  const onSubmit = async (data: WishFormValues) => {
    if (!user) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour créer un souhait',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      let cover_image = null;

      // Upload cover image if exists
      if (coverImageFile) {
        try {
          console.log("Téléchargement de l'image de couverture...");
          const wishId = uuidv4();
          const fileExt = coverImageFile.name.split('.').pop();
          const fileName = `wish-${wishId}.${fileExt}`;
          
          // Upload directly to album-thumbnails bucket and store the filename
          const { error: uploadError } = await supabase.storage
            .from('album-thumbnails')
            .upload(fileName, coverImageFile);

          if (uploadError) {
            throw uploadError;
          }

          // Store just the filename, not the full URL
          cover_image = fileName;
          console.log("Image téléchargée avec succès:", cover_image);
        } catch (error) {
          console.error("Erreur lors du téléchargement de l'image:", error);
          toast({
            title: 'Erreur',
            description: 'Impossible de télécharger l\'image de couverture',
            variant: 'destructive',
          });
          return;
        }
      }

      console.log("Création du souhait avec cover_image:", cover_image);

      const { error } = await supabase
        .from('wish_posts')
        .insert({
          author_id: user.id,
          title: data.title,
          content: data.content,
          first_name: data.first_name || null,
          location: data.location || null,
          request_type: data.request_type || null,
          custom_request_type: data.custom_request_type || null,
          date: data.date ? new Date(data.date).toISOString() : null,
          importance: data.importance || null,
          needs: data.needs || null,
          offering: data.offering || null,
          attachment_url: data.attachment_url || null,
          cover_image,
          published: false, // Brouillon par défaut
        });

      if (error) {
        throw error;
      }

      toast({
        title: 'Succès',
        description: 'Votre souhait a été créé en brouillon',
      });

      navigate('/wishes');
    } catch (error: any) {
      console.error('Erreur lors de la création du souhait:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le souhait',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setCoverImageFile(file);
    console.log("Image de couverture sélectionnée:", file?.name);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-serif text-tranches-charcoal mb-8">Nouveau souhait</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre du souhait *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Entrez le titre de votre souhait" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description du souhait *</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Décrivez votre souhait en détail" rows={4} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cover_image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image de couverture</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverImageChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prénom</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Votre prénom" />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lieu où doit se dérouler le souhait</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Ex: Paris, 75001" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="request_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type de demande</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez le type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="aide">Aide</SelectItem>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="materiel">Matériel</SelectItem>
                            <SelectItem value="experience">Expérience</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date souhaitée</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                {watchRequestType === 'other' && (
                  <FormField
                    control={form.control}
                    name="custom_request_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Précisez le type de demande</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Décrivez votre type de demande" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="importance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pourquoi c'est important pour vous</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Expliquez pourquoi ce souhait est important" rows={3} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="needs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Besoins concrets</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Détaillez vos besoins concrets" rows={3} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="offering"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ce que vous pouvez offrir en retour</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Que pouvez-vous offrir en échange ?" rows={3} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="attachment_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documents ou liens</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="URL vers un document ou un lien utile" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="mr-2"
                    onClick={() => navigate('/wishes')}
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
                        Création...
                      </>
                    ) : (
                      'Créer le brouillon'
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

export default WishNew;
