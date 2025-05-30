
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

const wishFormSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  content: z.string().min(1, 'Le contenu est requis'),
  first_name: z.string().optional(),
  age: z.string().optional(),
  location: z.string().optional(),
  request_type: z.string().optional(),
  importance: z.string().optional(),
  needs: z.string().optional(),
  offering: z.string().optional(),
});

type WishFormValues = z.infer<typeof wishFormSchema>;

const WishNew = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WishFormValues>({
    resolver: zodResolver(wishFormSchema),
    defaultValues: {
      title: '',
      content: '',
      first_name: '',
      age: '',
      location: '',
      request_type: '',
      importance: '',
      needs: '',
      offering: '',
    },
  });

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

      const { error } = await supabase
        .from('wish_posts')
        .insert({
          author_id: user.id,
          title: data.title,
          content: data.content,
          first_name: data.first_name || null,
          age: data.age || null,
          location: data.location || null,
          request_type: data.request_type || null,
          importance: data.importance || null,
          needs: data.needs || null,
          offering: data.offering || null,
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
                      <FormLabel>Titre du souhait</FormLabel>
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Décrivez votre souhait" rows={4} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom (optionnel)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Votre prénom" />
                      </FormControl>
                    </FormItem>
                  )}
                />

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
                          <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                      </Select>
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
