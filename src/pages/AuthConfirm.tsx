
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
        console.log('🔍 Début de la confirmation d\'email');
        console.log('URL complète:', window.location.href);
        console.log('Paramètres URL:', Object.fromEntries(searchParams.entries()));

        // Récupérer tous les paramètres possibles
        const token = searchParams.get('token');
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        console.log('Paramètres extraits:', { token, tokenHash, type });

        // Vérifier si nous avons un token (soit token soit token_hash)
        const confirmationToken = tokenHash || token;
        
        if (!confirmationToken) {
          console.error('❌ Aucun token de confirmation trouvé');
          setStatus('error');
          setMessage('Token de confirmation manquant dans l\'URL');
          return;
        }

        console.log('✅ Token de confirmation trouvé:', confirmationToken.substring(0, 10) + '...');

        // Utiliser verifyOtp avec le bon format selon le type de token
        let confirmationResult;
        
        if (tokenHash) {
          // Nouveau format avec token_hash
          console.log('📝 Utilisation du nouveau format token_hash');
          confirmationResult = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'email'
          });
        } else {
          // Ancien format avec token simple
          console.log('📝 Utilisation de l\'ancien format token');
          confirmationResult = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'email'
          });
        }

        console.log('📋 Résultat de la vérification:', confirmationResult);

        if (confirmationResult?.error) {
          console.error('❌ Erreur lors de la vérification:', confirmationResult.error);
          
          // Essayer une approche alternative si la première échoue
          if (!tokenHash && token) {
            console.log('🔄 Tentative avec approche alternative...');
            try {
              const alternativeResult = await supabase.auth.verifyOtp({
                token_hash: token,
                type: 'signup'
              });
              
              if (alternativeResult?.error) {
                throw new Error(alternativeResult.error.message);
              }
              
              console.log('✅ Confirmation réussie avec approche alternative');
              confirmationResult = alternativeResult;
            } catch (altError) {
              console.error('❌ Approche alternative échouée:', altError);
              throw new Error(confirmationResult.error.message);
            }
          } else {
            throw new Error(confirmationResult.error.message);
          }
        }

        console.log('✅ Email confirmé avec succès:', confirmationResult?.data?.user?.email);

        setStatus('success');
        setMessage('Votre email a été confirmé avec succès !');

        // Rediriger après 3 secondes
        setTimeout(() => {
          navigate('/');
        }, 3000);

      } catch (error) {
        console.error('❌ Erreur globale lors de la confirmation:', error);
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
                  onClick={() => navigate('/')}
                  className="w-full bg-tranches-sage hover:bg-tranches-sage/90"
                >
                  Aller à l'application
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
