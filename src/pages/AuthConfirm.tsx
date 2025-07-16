
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, checkAuthConnection } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Header from '@/components/Header';

const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const confirmEmailWithRetry = async (maxRetries = 3) => {
    try {
      console.log('🔍 Début de la confirmation d\'email - tentative', retryCount + 1);
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

      // Attendre un délai progressif entre les tentatives
      if (retryCount > 0) {
        const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
        console.log(`⏱️ Attente de ${delay}ms avant la tentative ${retryCount + 1}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Utiliser verifyOtp avec les bons paramètres
      let confirmationResult;
      
      console.log('📝 Tentative de confirmation avec verifyOtp...');
      
      if (tokenHash) {
        // Nouveau format avec token_hash - généralement pour la confirmation d'email
        console.log('📝 Utilisation du nouveau format token_hash');
        confirmationResult = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'email'
        });
      } else if (type === 'signup') {
        // Format signup - utiliser le token directement
        console.log('📝 Utilisation du format signup');
        confirmationResult = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup'
        });
      } else {
        // Format par défaut pour email
        console.log('📝 Utilisation du format email par défaut');
        confirmationResult = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email'
        });
      }

      console.log('📋 Résultat de la vérification:', confirmationResult);

      if (confirmationResult?.error) {
        console.error('❌ Erreur lors de la vérification:', confirmationResult.error);
        
        // Analyser le type d'erreur - ne retry que pour les vraies erreurs réseau
        const errorMessage = confirmationResult.error.message || '';
        
        if ((errorMessage.includes('Load failed') || 
             errorMessage.includes('fetch') ||
             errorMessage.includes('network')) && 
            retryCount < maxRetries - 1) {
          
          console.log(`🔄 Erreur réseau détectée, retry ${retryCount + 1}/${maxRetries}`);
          setRetryCount(prev => prev + 1);
          return confirmEmailWithRetry(maxRetries);
        }
        
        // Pour les liens expirés, proposer de renvoyer l'email
        if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
          throw new Error('EXPIRED_LINK');
        }
        
        // Pour les autres erreurs, ne pas retry
        throw new Error(confirmationResult.error.message);
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
      
      // Ne retry que pour les vraies erreurs réseau
      if (error instanceof Error && 
          error.message.includes('Load failed') && 
          retryCount < maxRetries - 1) {
        console.log(`🔄 Retry global ${retryCount + 1}/${maxRetries}`);
        setRetryCount(prev => prev + 1);
        return confirmEmailWithRetry(maxRetries);
      }
      
      // Gérer le cas du lien expiré
      if (error instanceof Error && error.message === 'EXPIRED_LINK') {
        setStatus('expired');
        setMessage('Ce lien de confirmation a expiré. Vous pouvez demander un nouveau lien.');
        return;
      }
      
      setStatus('error');
      setMessage(`Erreur lors de la confirmation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  useEffect(() => {
    const initializeConfirmation = async () => {
      // Test de connectivité optionnel
      console.log('🔍 Test de connectivité pour authentification...');
      const canConnect = await checkAuthConnection();
      
      if (!canConnect) {
        console.log('⚠️ Test de connectivité échoué, mais on continue quand même...');
      }
      
      // Procéder à la confirmation directement
      await confirmEmailWithRetry();
    };

    initializeConfirmation();
  }, [searchParams, navigate]);

  const handleRetry = async () => {
    setStatus('loading');
    setRetryCount(0);
    await confirmEmailWithRetry();
  };

  const handleReturnToAuth = () => {
    navigate('/auth');
  };

  const handleResendConfirmation = async () => {
    setIsResending(true);
    try {
      // Extraire l'email du token si possible, sinon demander à l'utilisateur
      const email = searchParams.get('email');
      if (!email) {
        setMessage('Impossible de récupérer l\'email. Veuillez retourner à la page de connexion pour créer un nouveau compte.');
        setIsResending(false);
        return;
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (error) {
        throw error;
      }

      setMessage('Un nouveau lien de confirmation a été envoyé à votre adresse email.');
    } catch (error) {
      console.error('Erreur lors du renvoi:', error);
      setMessage('Impossible de renvoyer l\'email. Veuillez retourner à la page de connexion.');
    } finally {
      setIsResending(false);
    }
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
              {(status === 'error' || status === 'expired') && <XCircle className="h-6 w-6 text-red-500" />}
              Confirmation d'email
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status === 'loading' && (
              <div className="text-center space-y-2">
                <p>Confirmation de votre email en cours...</p>
                {retryCount > 0 && (
                  <p className="text-sm text-gray-600">
                    Tentative {retryCount + 1}/3
                  </p>
                )}
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
            
            {status === 'expired' && (
              <div className="text-center space-y-4">
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {message}
                  </AlertDescription>
                </Alert>
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handleResendConfirmation}
                    disabled={isResending}
                    className="w-full bg-tranches-sage hover:bg-tranches-sage/90"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Envoi en cours...
                      </>
                    ) : (
                      'Renvoyer l\'email de confirmation'
                    )}
                  </Button>
                  <Button 
                    onClick={handleReturnToAuth}
                    variant="outline"
                    className="w-full"
                  >
                    Retour à la page de connexion
                  </Button>
                </div>
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
                <div className="flex flex-col gap-2">
                  <Button 
                    onClick={handleRetry}
                    className="w-full bg-tranches-sage hover:bg-tranches-sage/90"
                  >
                    Réessayer
                  </Button>
                  <Button 
                    onClick={handleReturnToAuth}
                    variant="outline"
                    className="w-full"
                  >
                    Retour à la page de connexion
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthConfirm;
