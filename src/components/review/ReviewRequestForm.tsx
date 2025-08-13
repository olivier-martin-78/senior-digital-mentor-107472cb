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
  satisfactionRating: number;
  city: string;
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
    satisfactionRating: 0,
    city: ''
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

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, satisfactionRating: rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.selectedContact || formData.satisfactionRating === 0) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }

    if (!formData.selectedContact.email) {
      toast({
        title: "Email manquant",
        description: "Le contact sélectionné n'a pas d'adresse email",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Créer la demande d'avis
      const insertData: any = {
        professional_id: session?.user?.id,
        review_date: formData.reviewDate,
        satisfaction_rating: formData.satisfactionRating,
        city: formData.city
      };

      // Ajouter soit client_id soit caregiver_id
      if (formData.selectedContact.type === 'client') {
        insertData.client_id = formData.selectedContact.id;
      } else {
        insertData.caregiver_id = formData.selectedContact.id;
      }

      const { data: reviewRequest, error: insertError } = await supabase
        .from('review_requests')
        .insert(insertData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Envoyer l'email via l'edge function
      const { error: emailError } = await supabase.functions.invoke('send-review-request', {
        body: {
          reviewRequestId: reviewRequest.id,
          contactEmail: formData.selectedContact.email,
          contactName: formData.selectedContact.name,
          contactType: formData.selectedContact.type,
          reviewDate: formData.reviewDate,
          city: formData.city,
          token: reviewRequest.token
        }
      });

      if (emailError) throw emailError;

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
        satisfactionRating: 0,
        city: ''
      });

      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande d\'avis:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la demande d'avis",
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

          {/* Note de satisfaction */}
          <div>
            <Label>Note de satisfaction *</Label>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(star)}
                  className={`text-2xl transition-colors ${
                    star <= formData.satisfactionRating 
                      ? 'text-yellow-500 hover:text-yellow-600' 
                      : 'text-gray-300 hover:text-gray-400'
                  }`}
                >
                  ★
                </button>
              ))}
              {formData.satisfactionRating > 0 && (
                <span className="text-sm text-muted-foreground ml-2">
                  {formData.satisfactionRating}/5 étoile{formData.satisfactionRating > 1 ? 's' : ''}
                </span>
              )}
            </div>
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

          {/* Boutons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.selectedContact || formData.satisfactionRating === 0}
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