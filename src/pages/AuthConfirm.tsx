
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
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        const redirectTo = searchParams.get('redirect_to');

        console.log('Confirmation params:', { token, type, redirectTo });

        if (!token) {
          setStatus('error');
          setMessage('Token de confirmation manquant');
          return;
        }

        // Essayer d'abord avec le token hash (format Supabase standard)
        let confirmationResult = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email'
        });

        // Si ça échoue, essayer avec le token direct en utilisant la bonne signature
        if (confirmationResult.error) {
          console.log('Tentative avec token direct...');
          
          // Pour verifyOtp avec type "email", nous devons fournir l'email
          // Essayons d'obtenir l'email depuis les paramètres ou utiliser une approche différente
          const email = searchParams.get('email');
          if (email) {
            confirmationResult = await supabase.auth.verifyOtp({
              email: email,
              token: token,
              type: 'email'
            });
          }
        }

        // Si les deux échouent, essayer la méthode manuelle avec les bonnes constantes
        if (confirmationResult.error) {
          console.log('Tentative de confirmation manuelle...');
          
          // Utiliser les constantes publiques directement
          const SUPABASE_URL = "https://cvcebcisijjmmmwuedcv.supabase.co";
          const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Y2ViY2lzaWpqbW1td3VlZGN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNTE5MTEsImV4cCI6MjA2MjcyNzkxMX0.ajg0CHVdVC6QenC9CVDN_5vikA6-JoUxXeX3yz64AUE";
          
          const response = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_KEY
            },
            body: JSON.stringify({
              token: token,
              type: 'signup'
            })
          });

          if (!response.ok) {
            throw new Error(`Erreur de confirmation: ${response.statusText}`);
          }

          const data = await response.json();
          console.log('Confirmation manuelle réussie:', data);
        } else {
          console.log('Confirmation réussie:', confirmationResult.data);
        }

        setStatus('success');
        setMessage('Votre email a été confirmé avec succès !');

        // Rediriger après 3 secondes
        setTimeout(() => {
          if (redirectTo) {
            window.location.href = redirectTo;
          } else {
            navigate('/auth');
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
