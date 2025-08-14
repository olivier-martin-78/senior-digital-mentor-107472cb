import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClientsCaregivers, ClientCaregiverOption } from '@/hooks/useClientsCaregivers';
import { Mail, Send, Users, UserPlus } from 'lucide-react';

interface ReviewRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  reviewDate: string;
  selectedContact: ClientCaregiverOption | null;
  city: string;
  clientComment: string;
  contactMode: 'existing' | 'new';
  newContactEmail: string;
  newContactName: string;
  newContactCity: string;
}

export const ReviewRequestForm: React.FC<ReviewRequestFormProps> = ({
  isOpen,
  onClose
}) => {
  const { session } = useAuth();
  const { toast } = useToast();
  const { options, isLoading } = useClientsCaregivers();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    reviewDate: new Date().toISOString().split('T')[0],
    selectedContact: null,
    city: '',
    clientComment: '',
    contactMode: 'existing',
    newContactEmail: '',
    newContactName: '',
    newContactCity: ''
  });

  const handleContactChange = (contactId: string) => {
    const contact = options.find(opt => opt.id === contactId);
    if (contact) {
      setFormData(prev => ({
        ...prev,
        selectedContact: contact,
        city: contact.city || ''
      }));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Début de la soumission du formulaire');
    console.log('📋 Données du formulaire:', formData);
    console.log('👤 Session utilisateur:', session?.user?.id);
    
    // Validation selon le mode de contact
    if (formData.contactMode === 'existing') {
      if (!formData.selectedContact) {
        console.log('❌ Aucun contact sélectionné');
        toast({
          title: "Contact requis",
          description: "Veuillez sélectionner un contact",
          variant: "destructive"
        });
        return;
      }

      if (!formData.selectedContact.email) {
        console.log('❌ Pas d\'email pour le contact:', formData.selectedContact);
        toast({
          title: "Email manquant",
          description: "Le contact sélectionné n'a pas d'adresse email",
          variant: "destructive"
        });
        return;
      }
    } else {
      // Mode nouveau contact
      if (!formData.newContactName || !formData.newContactEmail || !formData.newContactCity) {
        toast({
          title: "Informations manquantes",
          description: "Veuillez renseigner le nom, l'email et la ville du contact",
          variant: "destructive"
        });
        return;
      }
    }

    console.log('✅ Validation passée, début de l\'insertion');
    setIsSubmitting(true);

    try {
      // Créer la demande d'avis
      const insertData: any = {
        professional_id: session?.user?.id,
        review_date: formData.reviewDate,
        satisfaction_rating: null, // Sera renseigné par le client
        city: formData.contactMode === 'existing' ? formData.city : formData.newContactCity,
        client_comment: formData.clientComment || null
      };

      // Gestion des contacts existants vs nouveaux
      if (formData.contactMode === 'existing' && formData.selectedContact) {
        if (formData.selectedContact.type === 'client') {
          insertData.client_id = formData.selectedContact.id;
        } else {
          insertData.caregiver_id = formData.selectedContact.id;
        }
      } else if (formData.contactMode === 'new') {
        // Pour les nouveaux clients, créer d'abord un client temporaire
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            first_name: formData.newContactName?.split(' ')[0] || 'Client',
            last_name: formData.newContactName?.split(' ').slice(1).join(' ') || 'Temporaire',
            email: formData.newContactEmail,
            address: 'Adresse temporaire',
            city: formData.newContactCity,
            created_by: session?.user?.id
          })
          .select()
          .single();

        if (clientError) {
          console.error('❌ Erreur lors de la création du client:', clientError);
          throw clientError;
        }

        insertData.client_id = newClient.id;
      }

      console.log('💾 Données à insérer:', insertData);

      const { data: reviewRequest, error: insertError } = await supabase
        .from('review_requests')
        .insert(insertData)
        .select()
        .single();

      console.log('📊 Résultat de l\'insertion:', { reviewRequest, insertError });

      if (insertError) {
        console.error('❌ Erreur lors de l\'insertion:', insertError);
        throw insertError;
      }

      if (!reviewRequest) {
        console.error('❌ Aucune donnée retournée après insertion');
        throw new Error('Aucune donnée retournée après insertion');
      }

      console.log('✅ Insertion réussie, reviewRequest:', reviewRequest);
      console.log('🔑 Token généré:', reviewRequest.token);

      // Récupérer le nom du professionnel
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', session?.user?.id)
        .single();

      const professionalName = profile?.display_name || 'Votre auxiliaire de vie';

      // Paramètres pour la fonction edge
      const edgeFunctionParams = {
        reviewRequestId: reviewRequest.id,
        contactEmail: formData.contactMode === 'existing' ? formData.selectedContact!.email : formData.newContactEmail,
        contactName: formData.contactMode === 'existing' ? formData.selectedContact!.name : formData.newContactName,
        contactType: formData.contactMode === 'existing' ? formData.selectedContact!.type : 'client',
        reviewDate: formData.reviewDate,
        city: formData.contactMode === 'existing' ? formData.city : formData.newContactCity,
        token: reviewRequest.token,
        professionalName: professionalName
      };

      console.log('📧 Appel de la fonction edge avec les paramètres:', edgeFunctionParams);

      // Envoyer l'email via l'edge function avec fetch direct
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cvcebcisijjmmmwuedcv.supabase.co';
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Y2ViY2lzaWpqbW1td3VlZGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTE5MTEsImV4cCI6MjA2MjcyNzkxMX0.ajg0CHVdVC6QenC9CVDN_5vikA6-JoUxXeX3yz64AUE';
      
      const response = await fetch(`${supabaseUrl}/functions/v1/send-review-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify(edgeFunctionParams)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const emailData = await response.json();

      console.log('📬 Résultat de l\'envoi d\'email:', emailData);

      if (!emailData.success) {
        console.error('❌ Erreur dans la réponse:', emailData);
        throw new Error(emailData.error || 'Erreur inconnue lors de l\'envoi');
      }

      // Mettre à jour la date d'envoi
      await supabase
        .from('review_requests')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('id', reviewRequest.id);

      const contactName = formData.contactMode === 'existing' 
        ? formData.selectedContact!.name 
        : formData.newContactName;
        
      toast({
        title: "Demande d'avis envoyée",
        description: `Un email a été envoyé à ${contactName}`,
      });

      // Réinitialiser le formulaire
      setFormData({
        reviewDate: new Date().toISOString().split('T')[0],
        selectedContact: null,
        city: '',
        clientComment: '',
        contactMode: 'existing',
        newContactEmail: '',
        newContactName: '',
        newContactCity: ''
      });

      onClose();
    } catch (error) {
      console.error('❌ ERREUR DÉTAILLÉE:', error);
      console.error('❌ Message d\'erreur:', error?.message);
      console.error('❌ Stack trace:', error?.stack);
      console.error('❌ Détails complets:', JSON.stringify(error, null, 2));
      
      let errorMessage = "Impossible d'envoyer la demande d'avis";
      if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Solliciter un avis client
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date de l'avis */}
          <div>
            <Label htmlFor="reviewDate">Date de l'avis *</Label>
            <Input
              id="reviewDate"
              type="date"
              value={formData.reviewDate}
              onChange={(e) => setFormData(prev => ({ ...prev, reviewDate: e.target.value }))}
              required
            />
          </div>

          {/* Mode de contact */}
          <div>
            <Label>Type de contact</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={formData.contactMode === 'existing' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, contactMode: 'existing' }))}
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Contact existant
              </Button>
              <Button
                type="button"
                variant={formData.contactMode === 'new' ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, contactMode: 'new' }))}
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Nouveau contact
              </Button>
            </div>
          </div>

          {formData.contactMode === 'existing' ? (
            <>
              {/* Sélecteur de contact existant */}
              <div>
                <Label>Nom du client ou aidant *</Label>
                <Select 
                  value={formData.selectedContact?.id || ""} 
                  onValueChange={handleContactChange}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoading ? "Chargement..." : "Sélectionner un contact"} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ville pour contact existant */}
              <div>
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  value={formData.city}
                  readOnly
                  className="bg-muted"
                  placeholder="Sélectionnez un contact pour voir la ville"
                />
              </div>
            </>
          ) : (
            <>
              {/* Nouveau contact */}
              <div>
                <Label htmlFor="newContactName">Nom et prénom du contact *</Label>
                <Input
                  id="newContactName"
                  value={formData.newContactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, newContactName: e.target.value }))}
                  placeholder="Ex: Jean Dupont"
                  required
                />
              </div>

              <div>
                <Label htmlFor="newContactEmail">Email du contact *</Label>
                <Input
                  id="newContactEmail"
                  type="email"
                  value={formData.newContactEmail}
                  onChange={(e) => setFormData(prev => ({ ...prev, newContactEmail: e.target.value }))}
                  placeholder="Ex: jean.dupont@email.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="newContactCity">Ville *</Label>
                <Input
                  id="newContactCity"
                  value={formData.newContactCity}
                  onChange={(e) => setFormData(prev => ({ ...prev, newContactCity: e.target.value }))}
                  placeholder="Ex: Paris"
                  required
                />
              </div>
            </>
          )}

          {/* Commentaire client */}
          <div>
            <Label htmlFor="clientComment">Commentaire client (optionnel)</Label>
            <textarea
              id="clientComment"
              value={formData.clientComment}
              onChange={(e) => setFormData(prev => ({ ...prev, clientComment: e.target.value }))}
              className="w-full px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md resize-none"
              rows={3}
              placeholder="Ajoutez un commentaire pour le client (visible dans l'email)"
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || (formData.contactMode === 'existing' ? !formData.selectedContact : (!formData.newContactName || !formData.newContactEmail || !formData.newContactCity))}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Envoi..." : "Envoyer demande d'avis"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};