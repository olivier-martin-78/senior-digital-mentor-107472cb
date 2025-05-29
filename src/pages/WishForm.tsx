import { useAuth } from '@/contexts/AuthContext';
import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon, Upload, Image, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { WishAlbum, WishPost } from '@/types/supabase';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import WishAlbumSelector from '@/components/WishAlbumSelector';
import { uploadAlbumThumbnail } from '@/utils/thumbnailtUtils';

// Props type for the WishForm component
interface WishFormProps {
  wishToEdit?: WishPost;
}

// Schéma de validation pour le formulaire - Ajout du champ thumbnail
const formSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  email: z.string().email("Email invalide").optional(),
  age: z.string().optional(),
  location: z.string().optional(),
  requestType: z.string().min(1, "Le type de demande est requis"),
  customRequestType: z.string().optional(),
  title: z.string().min(1, "Un titre pour votre demande est requis"),
  description: z.string().min(10, "Merci de décrire votre souhait (minimum 10 caractères)"),
  importance: z.string().min(10, "Merci d'expliquer pourquoi c'est important pour vous"),
  date: z.date().optional(),
  needs: z.string().min(5, "Précisez vos besoins concrets"),
  offering: z.string().optional(),
  attachmentUrl: z.string().optional(),
  albumId: z.string().optional(),
  published: z.boolean().default(false),
  thumbnail: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

const WishForm: React.FC<WishFormProps> = ({ wishToEdit }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [wishAlbums, setWishAlbums] = useState<WishAlbum[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  
  const fetchWishAlbums = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wish_albums')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      if (data) {
        const albumsWithProfiles = data.map(album => ({
          ...album,
          profiles: {
            id: '',
            email: '',
            display_name: null,
            avatar_url: null,
            created_at: ''
          }
        }));
        setWishAlbums(albumsWithProfiles as WishAlbum[]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des albums de souhaits:', error);
    }
  }, []);
  
  useEffect(() => {
    fetchWishAlbums();
  }, [fetchWishAlbums]);
  
  // Préparer les valeurs par défaut du formulaire
  const getDefaultValues = (): FormValues => {
    if (wishToEdit) {
      return {
        firstName: wishToEdit.first_name || '',
        email: wishToEdit.email || '',
        age: wishToEdit.age || '',
        location: wishToEdit.location || '',
        requestType: wishToEdit.request_type || '',
        customRequestType: wishToEdit.custom_request_type || '',
        title: wishToEdit.title || '',
        description: wishToEdit.content || '',
        importance: wishToEdit.importance || '',
        date: wishToEdit.date ? new Date(wishToEdit.date) : undefined,
        needs: wishToEdit.needs || '',
        offering: wishToEdit.offering || '',
        attachmentUrl: wishToEdit.attachment_url || '',
        albumId: wishToEdit.album_id || 'none',
        published: wishToEdit.published || false,
        thumbnail: wishToEdit.cover_image || ''
      };
    }
    
    return {
      firstName: '',
      email: '',
      age: '',
      location: '',
      requestType: '',
      customRequestType: '',
      title: '',
      description: '',
      importance: '',
      needs: '',
      offering: '',
      attachmentUrl: '',
      albumId: 'none',
      published: false,
      thumbnail: ''
    };
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues()
  });
  
  const watchRequestType = form.watch('requestType');
  const isAdmin = useAuth().hasRole('admin');
  const isEditor = useAuth().hasRole('editor');
  const canPublish = isAdmin || isEditor;
  
  // Gestionnaire pour le téléchargement de la vignette
  const handleThumbnailUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Veuillez sélectionner un fichier image.',
      });
      return;
    }

    try {
      setUploadingThumbnail(true);
      console.log('Début de l\'upload de la vignette...');
      
      const wishId = wishToEdit?.id || `wish-${Date.now()}`;
      const uploadedUrl = await uploadAlbumThumbnail(file, wishId);
      
      console.log('URL de la vignette uploadée:', uploadedUrl);
      
      // Utiliser directement l'URL permanente pour l'aperçu ET le formulaire
      setThumbnailUrl(uploadedUrl);
      form.setValue('thumbnail', uploadedUrl);
      
      console.log('Vignette uploadée et URL définie:', uploadedUrl);
      
      toast({
        title: 'Vignette téléchargée !',
        description: 'La vignette a été téléchargée avec succès.',
      });
    } catch (error: any) {
      console.error('Erreur lors du téléchargement de la vignette:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Erreur lors du téléchargement de la vignette.',
      });
    } finally {
      setUploadingThumbnail(false);
    }
  };

  // Gestionnaire pour supprimer la vignette
  const handleRemoveThumbnail = () => {
    setThumbnailUrl(null);
    form.setValue('thumbnail', '');
    console.log('Vignette supprimée');
  };

  // Effet pour charger la vignette existante
  useEffect(() => {
    if (wishToEdit?.cover_image) {
      console.log('Chargement de la vignette existante:', wishToEdit.cover_image);
      setThumbnailUrl(wishToEdit.cover_image);
    }
  }, [wishToEdit]);

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      // Vérification si l'utilisateur est connecté
      if (!user) {
        console.log('WishForm - No user authenticated');
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Vous devez être connecté pour soumettre un souhait.',
        });
        navigate('/auth');
        return;
      }

      const submissionData = {
        title: values.title,
        content: values.description,
        author_id: user.id,
        first_name: values.firstName,
        email: values.email || null,
        age: values.age || null,
        location: values.location || null,
        request_type: values.requestType,
        custom_request_type: values.requestType === 'other' ? values.customRequestType : null,
        importance: values.importance,
        date: values.date ? values.date.toISOString() : null,
        needs: values.needs,
        offering: values.offering || null,
        attachment_url: values.attachmentUrl || null,
        album_id: values.albumId === 'none' ? null : values.albumId || null,
        published: values.published,
        cover_image: thumbnailUrl || null
      };

      console.log('WishForm - Submitting data avec cover_image:', submissionData.cover_image);

      let data, error;
      
      if (wishToEdit) {
        // Mise à jour d'un souhait existant
        ({ data, error } = await supabase
          .from('wish_posts')
          .update(submissionData)
          .eq('id', wishToEdit.id)
          .select());
          
        if (error) throw error;
        
        toast({
          title: 'Souhait mis à jour !',
          description: 'Votre souhait a bien été modifié.',
        });
      } else {
        // Création d'un nouveau souhait
        ({ data, error } = await supabase
          .from('wish_posts')
          .insert([submissionData])
          .select());
          
        if (error) throw error;
        
        toast({
          title: 'Souhait enregistré !',
          description: 'Votre souhait a bien été reçu et sera examiné dans les meilleurs délais.',
        });
      }
      
      navigate('/wishes');
    } catch (error: any) {
      console.error('WishForm - Submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message && error.message.includes('permission denied')
          ? 'Vous n\'avez pas la permission d\'enregistrer un souhait.'
          : 'Une erreur est survenue lors de l\'enregistrement de votre souhait. Veuillez réessayer ultérieurement.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-serif text-tranches-charcoal mb-6">
            {wishToEdit ? 'Modifier un souhait' : 'Souhaits'}
          </h1>
          <p className="mb-8 text-gray-600">
            {wishToEdit 
              ? 'Modifiez votre souhait ci-dessous.' 
              : 'Partagez votre souhait avec nous. Qu\'il s\'agisse d\'une expérience que vous rêvez de vivre ou d\'un service dont vous avez besoin, nous sommes là pour vous aider à le réaliser.'}
          </p>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Section 1: Informations personnelles */}
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-tranches-charcoal flex items-center">
                    <span className="bg-tranches-sage/10 text-tranches-sage rounded-full w-8 h-8 inline-flex items-center justify-center mr-2">
                      🧑‍💼
                    </span>
                    Informations sur le demandeur
                  </h2>
                  <p className="text-sm text-gray-500">Ces informations sont facultatives mais permettent de personnaliser la relation.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prénom ou pseudo</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre prénom" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Adresse e-mail ou moyen de contact</FormLabel>
                          <FormControl>
                            <Input placeholder="exemple@email.com" {...field} />
                          </FormControl>
                          <FormDescription>
                            Facultatif, mais utile pour vous recontacter
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Âge</FormLabel>
                          <FormControl>
                            <Input placeholder="Votre âge" {...field} />
                          </FormControl>
                          <FormDescription>Facultatif</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ville / Pays</FormLabel>
                          <FormControl>
                            <Input placeholder="Paris, France" {...field} />
                          </FormControl>
                          <FormDescription>Facultatif</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Section 2: Nature de la demande avec vignette */}
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-tranches-charcoal flex items-center">
                    <span className="bg-tranches-sage/10 text-tranches-sage rounded-full w-8 h-8 inline-flex items-center justify-center mr-2">
                      💭
                    </span>
                    Nature de la demande
                  </h2>
                  
                  {/* Champ vignette */}
                  <FormField
                    control={form.control}
                    name="thumbnail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vignette du souhait (facultatif)</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            {thumbnailUrl && (
                              <div className="relative inline-block">
                                <img
                                  src={thumbnailUrl}
                                  alt="Aperçu de la vignette"
                                  className="w-32 h-32 object-cover rounded-lg border"
                                  onError={(e) => {
                                    console.error('Erreur de chargement de l\'image dans le formulaire:', thumbnailUrl);
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/placeholder.svg';
                                  }}
                                  onLoad={() => {
                                    console.log('Image chargée avec succès dans le formulaire:', thumbnailUrl);
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  className="absolute -top-2 -right-2"
                                  onClick={handleRemoveThumbnail}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleThumbnailUpload(file);
                                  }
                                }}
                                disabled={uploadingThumbnail}
                                className="hidden"
                                id="thumbnail-upload"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => document.getElementById('thumbnail-upload')?.click()}
                                disabled={uploadingThumbnail}
                              >
                                <Image className="h-4 w-4 mr-2" />
                                {uploadingThumbnail ? 'Téléchargement...' : 'Ajouter une vignette'}
                              </Button>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Ajoutez une image pour illustrer votre souhait (formats supportés: JPG, PNG, GIF)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="requestType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quel est le type de demande ?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionnez le type de demande" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="personal">Un souhait personnel</SelectItem>
                            <SelectItem value="experience">Une expérience que je rêve de vivre</SelectItem>
                            <SelectItem value="service">Un service que j'aimerais recevoir</SelectItem>
                            <SelectItem value="other">Autre</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {watchRequestType === 'other' && (
                    <FormField
                      control={form.control}
                      name="customRequestType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Précisez le type de demande</FormLabel>
                          <FormControl>
                            <Input placeholder="Précisez votre type de demande" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Donnez un titre ou une phrase résumant votre demande</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Rencontrer mon auteur préféré"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Section 3: Détails de la demande */}
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-tranches-charcoal flex items-center">
                    <span className="bg-tranches-sage/10 text-tranches-sage rounded-full w-8 h-8 inline-flex items-center justify-center mr-2">
                      ❤️
                    </span>
                    Détails de la demande
                  </h2>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Décrivez votre souhait / demande avec vos mots</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Ex: J'aimerais que quelqu'un m'accompagne pour faire le tour des brocantes de la région..."
                            className="min-h-[150px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          N'hésitez pas à être authentique et précis dans votre description
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="importance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pourquoi est-ce important pour vous ? Qu'est-ce que cela représente ?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Expliquez pourquoi ce souhait est important pour vous"
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Avez-vous une date, une période ou un moment précis en tête ?</FormLabel>
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
                                {field.value ? (
                                  format(field.value, "PP", { locale: fr })
                                ) : (
                                  <span>Choisir une date</span>
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
                              initialFocus
                              locale={fr}
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>Facultatif</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Section 4: Modalités et besoins pratiques */}
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-tranches-charcoal flex items-center">
                    <span className="bg-tranches-sage/10 text-tranches-sage rounded-full w-8 h-8 inline-flex items-center justify-center mr-2">
                      🌟
                    </span>
                    Modalités et besoins pratiques
                  </h2>
                  
                  <FormField
                    control={form.control}
                    name="needs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>De quoi auriez-vous besoin concrètement ?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Ex: un véhicule, une personne, un lieu, un savoir-faire particulier..."
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="offering"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Souhaitez-vous offrir quelque chose en retour ?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Ex: Je pourrais offrir un repas en remerciement, Je peux à mon tour rendre service..."
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>Facultatif</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Section 5: Fichiers ou liens */}
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-tranches-charcoal flex items-center">
                    <span className="bg-tranches-sage/10 text-tranches-sage rounded-full w-8 h-8 inline-flex items-center justify-center mr-2">
                      📎
                    </span>
                    Fichiers ou liens (facultatif)
                  </h2>
                  
                  <FormField
                    control={form.control}
                    name="attachmentUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Souhaitez-vous ajouter un lien en rapport avec votre demande ?</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Input 
                              placeholder="https://"
                              {...field} 
                            />
                            <Button type="button" variant="outline" className="shrink-0">
                              <Upload className="h-4 w-4 mr-2" />
                              Parcourir
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Vous pouvez ajouter un lien vers une photo, un document ou un site web
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Section 6: Album avec possibilité de création */}
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-tranches-charcoal flex items-center">
                    <span className="bg-tranches-sage/10 text-tranches-sage rounded-full w-8 h-8 inline-flex items-center justify-center mr-2">
                      📂
                    </span>
                    Catégorie (facultatif)
                  </h2>
                  
                  <FormField
                    control={form.control}
                    name="albumId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sélectionner une catégorie pour votre souhait</FormLabel>
                        <FormControl>
                          <WishAlbumSelector
                            wishAlbums={wishAlbums}
                            selectedAlbumId={field.value || 'none'}
                            onAlbumChange={field.onChange}
                            onAlbumsUpdate={fetchWishAlbums}
                          />
                        </FormControl>
                        <FormDescription>
                          Vous pouvez associer votre souhait à une catégorie spécifique ou en créer une nouvelle
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Section 7: Statut de publication (pour admin/editor seulement) */}
                {canPublish && (
                  <div className="space-y-6 pt-6 border-t">
                    <h2 className="text-xl font-medium text-tranches-charcoal flex items-center">
                      <span className="bg-tranches-sage/10 text-tranches-sage rounded-full w-8 h-8 inline-flex items-center justify-center mr-2">
                        📢
                      </span>
                      Statut de publication
                    </h2>
                    
                    <FormField
                      control={form.control}
                      name="published"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Publier ce souhait</FormLabel>
                            <FormDescription>
                              Lorsque publié, ce souhait sera visible par tous les utilisateurs.
                              En brouillon, seul vous, les éditeurs et les administrateurs peuvent le voir.
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
                )}
                
                <div className="pt-4 border-t">
                  <Button 
                    type="submit" 
                    className="w-full md:w-auto bg-tranches-sage hover:bg-tranches-sage/90"
                    disabled={isLoading}
                  >
                    {isLoading 
                      ? 'Envoi en cours...' 
                      : wishToEdit 
                        ? 'Mettre à jour le souhait' 
                        : 'Envoyer mon souhait'
                    }
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

export default WishForm;
