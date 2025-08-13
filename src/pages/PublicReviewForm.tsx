import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Star, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ReviewRequest {
  id: string;
  professional_id: string;
  client_id?: string;
  caregiver_id?: string;
  review_date: string;
  satisfaction_rating: number;
  city: string;
  status: string;
  expires_at: string;
  professional_name: string;
  client_name?: string;
  caregiver_name?: string;
}

interface ReviewFormData {
  rating: number;
  comments: string;
  reviewer_name: string;
}

export const PublicReviewForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [reviewRequest, setReviewRequest] = useState<ReviewRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 0,
    comments: '',
    reviewer_name: ''
  });

  useEffect(() => {
    if (token) {
      loadReviewRequest();
    }
  }, [token]);

  const loadReviewRequest = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Appeler la fonction pour récupérer la demande d'avis
      const { data, error } = await supabase.rpc('get_review_request_by_token', {
        token_param: token
      });

      if (error) throw error;

      if (!data || data.length === 0) {
        setError('Ce lien d\'avis n\'est plus valide ou a expiré.');
        return;
      }

      const request = data[0] as ReviewRequest;
      setReviewRequest(request);

      // Pré-remplir le nom si disponible
      if (request.client_name || request.caregiver_name) {
        setFormData(prev => ({
          ...prev,
          reviewer_name: request.client_name || request.caregiver_name || ''
        }));
      }

    } catch (error) {
      console.error('Erreur lors du chargement de la demande d\'avis:', error);
      setError('Impossible de charger la demande d\'avis.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRatingChange = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      toast({
        title: "Note requise",
        description: "Veuillez sélectionner une note",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Sauvegarder l'avis
      const { error: insertError } = await supabase
        .from('client_reviews')
        .insert({
          review_request_id: reviewRequest!.id,
          rating: formData.rating,
          comments: formData.comments.trim() || null,
          reviewer_name: formData.reviewer_name.trim() || null
        });

      if (insertError) throw insertError;

      setIsSubmitted(true);
      toast({
        title: "Avis envoyé",
        description: "Merci pour votre retour !",
      });

    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'avis:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer l'avis",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-4 text-muted-foreground animate-spin" />
            <p>Chargement...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Lien non valide</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')} variant="outline">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold mb-2">Avis envoyé !</h2>
            <p className="text-muted-foreground mb-4">
              Merci pour votre retour. Votre avis a été transmis au professionnel.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Évaluation de prestation</CardTitle>
            <p className="text-muted-foreground">
              Votre avis nous aide à améliorer nos services
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Informations de l'intervention */}
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Détails de l'intervention</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <p><strong>Professionnel :</strong> {reviewRequest?.professional_name}</p>
                <p><strong>Date :</strong> {new Date(reviewRequest?.review_date || '').toLocaleDateString('fr-FR')}</p>
                <p><strong>Ville :</strong> {reviewRequest?.city}</p>
                <p><strong>Note initiale :</strong> {reviewRequest?.satisfaction_rating}/5 ⭐</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Note de satisfaction */}
              <div>
                <Label className="text-base font-semibold">Note de satisfaction *</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Comment évaluez-vous cette prestation ?
                </p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(star)}
                      className={`text-3xl transition-colors ${
                        star <= formData.rating 
                          ? 'text-yellow-500 hover:text-yellow-600' 
                          : 'text-gray-300 hover:text-gray-400'
                      }`}
                    >
                      ⭐
                    </button>
                  ))}
                  {formData.rating > 0 && (
                    <span className="text-sm text-muted-foreground ml-2">
                      {formData.rating}/5 étoile{formData.rating > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Commentaires */}
              <div>
                <Label htmlFor="comments" className="text-base font-semibold">
                  Commentaires (optionnel)
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Partagez votre expérience en quelques mots
                </p>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Votre commentaire sur la prestation..."
                  rows={4}
                />
              </div>

              {/* Nom du répondant */}
              <div>
                <Label htmlFor="reviewer_name" className="text-base font-semibold">
                  Votre nom (optionnel)
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Pour personnaliser votre avis
                </p>
                <Input
                  id="reviewer_name"
                  value={formData.reviewer_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, reviewer_name: e.target.value }))}
                  placeholder="Votre prénom et nom"
                />
              </div>

              {/* Bouton de soumission */}
              <div className="flex justify-center pt-4">
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={isSubmitting || formData.rating === 0}
                  className="min-w-[200px] flex items-center gap-2"
                >
                  <Star className="h-4 w-4" />
                  {isSubmitting ? "Envoi en cours..." : "Envoyer mon avis"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};