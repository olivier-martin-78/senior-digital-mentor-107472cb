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
import { Mail, Send } from 'lucide-react';

interface ReviewRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  reviewDate: string;
  selectedContact: ClientCaregiverOption | null;
  city: string;
  clientComment: string;
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
    clientComment: ''
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

    console.log('✅ Validation passée, début de l\'insertion');
    setIsSubmitting(true);

    try {
      // Créer la demande d'avis
      const insertData: any = {
        professional_id: session?.user?.id,
        review_date: formData.reviewDate,
        satisfaction_rating: null, // Sera renseigné par le client
        city: formData.city,
        client_comment: formData.clientComment || null
      };

      // Ajouter soit client_id soit caregiver_id
      if (formData.selectedContact.type === 'client') {
        insertData.client_id = formData.selectedContact.id;
      } else {
        insertData.caregiver_id = formData.selectedContact.id;
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

      // Paramètres pour la fonction edge
      const edgeFunctionParams = {
        reviewRequestId: reviewRequest.id,
        contactEmail: formData.selectedContact.email,
        contactName: formData.selectedContact.name,
        contactType: formData.selectedContact.type,
        reviewDate: formData.reviewDate,
        city: formData.city,
        token: reviewRequest.token
      };

      console.log('📧 Appel de la fonction edge avec les paramètres:', edgeFunctionParams);

      // Envoyer l'email via l'edge function
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-review-request', {
        body: edgeFunctionParams
      });

      console.log('📬 Résultat de l\'envoi d\'email:', { emailData, emailError });

      if (emailError) {
        console.error('❌ Erreur lors de l\'envoi d\'email:', emailError);
        throw emailError;
      }

      // Mettre à jour la date d'envoi
      await supabase
        .from('review_requests')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('id', reviewRequest.id);

      toast({
        title: "Demande d'avis envoyée",
        description: `Un email a été envoyé à ${formData.selectedContact.name}`,
      });

      // Réinitialiser le formulaire
      setFormData({
        reviewDate: new Date().toISOString().split('T')[0],
        selectedContact: null,
        city: '',
        clientComment: ''
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

          {/* Sélecteur de contact */}
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


          {/* Ville */}
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
              disabled={isSubmitting || !formData.selectedContact}
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