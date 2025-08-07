import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import EmailConfirmationHelp from '@/components/auth/EmailConfirmationHelp';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ResendConfirmation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Veuillez saisir une adresse email valide');
      setLoading(false);
      return;
    }

    try {
      // Essayer de renvoyer l'email de confirmation
      const { error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: 'temporary-password', // Mot de passe temporaire pour déclencher l'envoi
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (signUpError) {
        // Si l'utilisateur existe déjà, on peut utiliser resend
        const { error: resendError } = await supabase.auth.resend({
          type: 'signup',
          email: email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm`
          }
        });
        
        if (resendError) {
          throw resendError;
        }
      }

      setSuccess(true);
      toast({
        title: "Email envoyé",
        description: "Un nouveau lien de confirmation a été envoyé à votre adresse email.",
      });
      
    } catch (error: any) {
      console.error('Resend confirmation error:', error);
      const errorMessage = error.message || 'Une erreur est survenue lors de l\'envoi de l\'email';
      setError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle className="text-2xl font-serif text-center">Email envoyé !</CardTitle>
              <CardDescription className="text-center">
                Un nouveau lien de confirmation a été envoyé à votre adresse email
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <Mail className="h-4 w-4" />
                <AlertTitle>Vérifiez vos emails</AlertTitle>
                <AlertDescription>
                  Consultez votre boîte de réception et vos spams. Cliquez sur le lien dans l'email pour confirmer votre inscription.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => navigate('/auth')} 
                  className="w-full"
                  variant="outline"
                >
                  Retour à la connexion
                </Button>
                <Button 
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }} 
                  className="w-full"
                  variant="ghost"
                >
                  Renvoyer un autre email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Mail className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-serif text-center">Renvoyer l'email de confirmation</CardTitle>
            <CardDescription className="text-center">
              Saisissez votre adresse email pour recevoir un nouveau lien de confirmation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Alert className="mb-4">
              <Mail className="h-4 w-4" />
              <AlertTitle>Problème avec votre lien de confirmation ?</AlertTitle>
              <AlertDescription>
                Les liens de confirmation expirent après 24 heures. Utilisez ce formulaire pour en recevoir un nouveau.
              </AlertDescription>
            </Alert>
            
            <form onSubmit={handleResend} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Adresse email</label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="votre.email@exemple.com"
                  required
                  autoComplete="email"
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-tranches-sage hover:bg-tranches-sage/90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Envoi en cours...
                  </>
                ) : (
                  "Renvoyer l'email de confirmation"
                )}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600 text-center">
                Déjà confirmé votre email ?{' '}
                <button 
                  onClick={() => navigate('/auth')}
                  className="text-primary hover:underline"
                >
                  Se connecter
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
        
        {/* Section d'aide */}
        <div className="mt-8">
          <EmailConfirmationHelp />
        </div>
      </div>
    </div>
  );
};

export default ResendConfirmation;