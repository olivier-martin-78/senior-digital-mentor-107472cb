
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon, Upload } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Schéma de validation pour le formulaire
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
  albumId: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

const WishForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
      albumId: ''
    }
  });
  
  const watchRequestType = form.watch('requestType');
  
  const onSubmit = async (values: FormValues) => {
    try {
      console.log("Données du formulaire:", values);
      
      // Préparation du message pour l'email
      const requestTypeText = values.requestType === 'other' && values.customRequestType 
        ? values.customRequestType 
        : {
            'personal': 'Un souhait personnel',
            'experience': 'Une expérience à vivre',
            'service': 'Un service à recevoir',
            'other': 'Autre type de demande'
          }[values.requestType] || values.requestType;
      
      // Formatage du contenu du message pour l'email
      let messageContent = `
**Nouveau souhait: ${values.title}**

**Type de demande:** ${requestTypeText}

**Description:**
${values.description}

**Importance pour la personne:**
${values.importance}

**Besoins concrets:**
${values.needs}`;

      if (values.offering) {
        messageContent += `\n\n**Ce que la personne propose en retour:**\n${values.offering}`;
      }

      if (values.date) {
        const dateStr = format(values.date, "PPP", { locale: fr });
        messageContent += `\n\n**Date souhaitée:** ${dateStr}`;
      }

      if (values.age || values.location) {
        messageContent += "\n\n**Informations complémentaires:**";
        if (values.age) messageContent += `\nÂge: ${values.age} ans`;
        if (values.location) messageContent += `\nLieu: ${values.location}`;
      }

      if (values.attachmentUrl) {
        messageContent += `\n\n**Lien fourni:** ${values.attachmentUrl}`;
      }
      
      // Envoi du message via la fonction Edge de Supabase
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: values.firstName,
          email: values.email || 'non.specifie@tranches-de-vie.com',
          message: messageContent,
          attachmentUrl: values.attachmentUrl
        }
      });
      
      if (error) {
        throw new Error(`Erreur lors de l'envoi: ${error.message}`);
      }
      
      toast({
        title: "Souhait envoyé !",
        description: "Nous avons bien reçu votre souhait et le traiterons dans les meilleurs délais.",
      });
      
      // Rediriger vers la page d'accueil après soumission
      navigate('/');
    } catch (error) {
      console.error("Erreur lors de l'envoi du formulaire:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de votre souhait. Veuillez réessayer ultérieurement.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-serif text-tranches-charcoal mb-6">Souhaits</h1>
          <p className="mb-8 text-gray-600">
            Partagez votre souhait avec nous. Qu'il s'agisse d'une expérience que vous rêvez de vivre ou d'un service dont vous avez besoin, nous sommes là pour vous aider à le réaliser.
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
                
                {/* Section 2: Nature de la demande */}
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-tranches-charcoal flex items-center">
                    <span className="bg-tranches-sage/10 text-tranches-sage rounded-full w-8 h-8 inline-flex items-center justify-center mr-2">
                      💭
                    </span>
                    Nature de la demande
                  </h2>
                  
                  <FormField
                    control={form.control}
                    name="requestType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quel est le type de demande ?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
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
                
                <div className="pt-4 border-t">
                  <Button type="submit" className="w-full md:w-auto bg-tranches-sage hover:bg-tranches-sage/90">
                    Envoyer mon souhait
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
