
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Header from '@/components/Header';

const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Récupérer TOUS les paramètres de l'URL
        const urlParams = Object.fromEntries(searchParams.entries());
        console.log('TOUS les paramètres URL reçus:', urlParams);
        console.log('URL complète:', window.location.href);

        // Récupérer tous les paramètres possibles
        const token = searchParams.get('token');
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        const redirectTo = searchParams.get('redirect_to');

        console.log('Paramètres individuels:', { 
          token, 
          tokenHash, 
          type, 
          redirectTo
        });

        // Vérifier si nous avons un token (soit token soit token_hash)
        const confirmationToken = token || tokenHash;
        
        if (!confirmationToken) {
          console.error('AUCUN TOKEN TROUVÉ !');
          console.error('URL actuelle:', window.location.href);
          console.error('SearchParams:', Array.from(searchParams.entries()));
          setStatus('error');
          setMessage(`Token de confirmation manquant. URL reçue: ${window.location.href}`);
          return;
        }

        console.log('Token trouvé:', confirmationToken);
        console.log('Type de token:', tokenHash ? 'token_hash' : 'token');

        // Essayer la vérification avec le token approprié
        let confirmationResult;
        
        if (tokenHash) {
          console.log('Utilisation de verifyOtp avec token_hash:', tokenHash);
          confirmationResult = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'email'
          });
        } else if (token) {
          console.log('Utilisation de verifyOtp avec token:', token);
          confirmationResult = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email'
          });
        }

        console.log('Résultat de la confirmation:', confirmationResult);

        if (confirmationResult?.error) {
          console.error('Erreur de confirmation:', confirmationResult.error);
          throw new Error(confirmationResult.error.message);
        }

        console.log('Confirmation réussie:', confirmationResult?.data);

        setStatus('success');
        setMessage('Votre email a été confirmé avec succès !');

        // Rediriger après 3 secondes
        setTimeout(() => {
          if (redirectTo) {
            window.location.href = redirectTo;
          } else {
            navigate('/');
          }
        }, 3000);

      } catch (error) {
        console.error('Erreur lors de la confirmation:', error);
        setStatus('error');
        setMessage(`Erreur lors de la confirmation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  const handleReturnToAuth = () => {
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-center flex items-center justify-center gap-2">
              {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
              {status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
              {status === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
              Confirmation d'email
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status === 'loading' && (
              <div className="text-center">
                <p>Confirmation de votre email en cours...</p>
              </div>
            )}
            
            {status === 'success' && (
              <div className="text-center space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-700">
                    {message}
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-gray-600">
                  Vous allez être redirigé automatiquement dans quelques secondes...
                </p>
                <Button 
                  onClick={handleReturnToAuth}
                  className="w-full bg-tranches-sage hover:bg-tranches-sage/90"
                >
                  Aller à la page de connexion
                </Button>
              </div>
            )}
            
            {status === 'error' && (
              <div className="text-center space-y-4">
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {message}
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={handleReturnToAuth}
                  variant="outline"
                  className="w-full"
                >
                  Retour à la page de connexion
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthConfirm;
