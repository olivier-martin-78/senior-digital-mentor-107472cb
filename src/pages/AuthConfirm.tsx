
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, checkConnection } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, Wifi, WifiOff } from 'lucide-react';
import Header from '@/components/Header';

const AuthConfirm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'connectivity-check'>('connectivity-check');
  const [message, setMessage] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking');

  const checkConnectivityAndConfig = async () => {
    console.log('🔍 Vérification de la connectivité et configuration Supabase...');
    
    try {
      // Vérifier la configuration du client
      console.log('📋 Configuration Supabase:', {
        url: 'https://cvcebcisijjmmmwuedcv.supabase.co',
        keyPrefix: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        storageAvailable: typeof localStorage !== 'undefined'
      });

      // Test de connectivité basique
      const isConnected = await checkConnection();
      console.log('🌐 Test de connectivité:', isConnected);
      
      if (isConnected) {
        setConnectionStatus('connected');
        return true;
      } else {
        setConnectionStatus('failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors du test de connectivité:', error);
      setConnectionStatus('failed');
      return false;
    }
  };

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

      // Test de connectivité avant la tentative
      console.log('🔍 Test de connectivité avant confirmation...');
      const canConnect = await checkConnection();
      if (!canConnect) {
        throw new Error('Impossible de se connecter à Supabase. Vérifiez votre connexion internet.');
      }

      // Utiliser verifyOtp avec le bon format selon le type de token
      let confirmationResult;
      
      console.log('📝 Tentative de confirmation avec verifyOtp...');
      
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
          type: type === 'signup' ? 'signup' : 'email'
        });
      }

      console.log('📋 Résultat de la vérification:', confirmationResult);

      if (confirmationResult?.error) {
        console.error('❌ Erreur lors de la vérification:', confirmationResult.error);
        
        // Analyser le type d'erreur
        const errorMessage = confirmationResult.error.message || '';
        
        if (errorMessage.includes('Load failed') || 
            errorMessage.includes('fetch') ||
            errorMessage.includes('network') ||
            errorMessage.includes('Failed to fetch')) {
          
          if (retryCount < maxRetries - 1) {
            console.log(`🔄 Erreur réseau détectée, retry ${retryCount + 1}/${maxRetries}`);
            setRetryCount(prev => prev + 1);
            return confirmEmailWithRetry(maxRetries);
          } else {
            throw new Error('Problème de connexion persistant. Vérifiez votre connexion internet et les paramètres Supabase.');
          }
        }
        
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
      
      if (retryCount < maxRetries - 1) {
        console.log(`🔄 Retry global ${retryCount + 1}/${maxRetries}`);
        setRetryCount(prev => prev + 1);
        return confirmEmailWithRetry(maxRetries);
      }
      
      setStatus('error');
      setMessage(`Erreur lors de la confirmation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  useEffect(() => {
    const initializeConfirmation = async () => {
      // D'abord vérifier la connectivité
      const canConnect = await checkConnectivityAndConfig();
      
      if (!canConnect) {
        setStatus('error');
        setMessage('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
        return;
      }
      
      // Si la connectivité est OK, procéder à la confirmation
      setStatus('loading');
      await confirmEmailWithRetry();
    };

    initializeConfirmation();
  }, [searchParams, navigate]);

  const handleRetry = async () => {
    setStatus('connectivity-check');
    setConnectionStatus('checking');
    setRetryCount(0);
    
    const canConnect = await checkConnectivityAndConfig();
    if (canConnect) {
      setStatus('loading');
      await confirmEmailWithRetry();
    } else {
      setStatus('error');
      setMessage('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
    }
  };

  const handleReturnToAuth = () => {
    navigate('/auth');
  };

  const renderConnectionStatus = () => {
    switch (connectionStatus) {
      case 'checking':
        return (
          <div className="flex items-center gap-2 text-blue-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Vérification de la connexion...</span>
          </div>
        );
      case 'connected':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <Wifi className="h-4 w-4" />
            <span>Connexion établie</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <WifiOff className="h-4 w-4" />
            <span>Connexion échouée</span>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-center flex items-center justify-center gap-2">
              {status === 'connectivity-check' && <Loader2 className="h-6 w-6 animate-spin" />}
              {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
              {status === 'success' && <CheckCircle className="h-6 w-6 text-green-500" />}
              {status === 'error' && <XCircle className="h-6 w-6 text-red-500" />}
              Confirmation d'email
            </CardTitle>
          </CardHeader>
          <CardContent>
            {status === 'connectivity-check' && (
              <div className="text-center space-y-4">
                <p>Vérification de la connexion...</p>
                {renderConnectionStatus()}
              </div>
            )}

            {status === 'loading' && (
              <div className="text-center space-y-2">
                <p>Confirmation de votre email en cours...</p>
                {retryCount > 0 && (
                  <p className="text-sm text-gray-600">
                    Tentative {retryCount + 1}/3
                  </p>
                )}
                {renderConnectionStatus()}
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
                {renderConnectionStatus()}
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
