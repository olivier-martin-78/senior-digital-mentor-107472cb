import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, cleanupAuthState } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  getEnvironmentInfo, 
  attemptAuthRecovery, 
  probeConnectivity, 
  checkSupabaseConnection,
  retryWithBackoff 
} from '@/utils/authUtils';
import { checkConnection, isMobileClient } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Auth = () => {
  const { signIn, signUp, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const from = location.state?.from?.pathname || '/';

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'reset' | 'update-password'>('login');
  
  // Error states
  const [loginError, setLoginError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  
  // Environment detection
  const { 
    isMobileViewport, 
    isMobileDevice, 
    hasStorageRestrictions, 
    isPrivateBrowsing, 
    hasCookiesEnabled,
    connectionInfo 
  } = useIsMobile();
  
  // Recovery and connection states
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionCheck, setConnectionCheck] = useState<{
    lastChecked: number | null,
    success: boolean | null,
    latency: number | null
  }>({ lastChecked: null, success: null, latency: null });

  // Check URL parameters for password reset
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isReset = urlParams.has('reset');
    const accessToken = urlParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token');
    
    if (isReset && accessToken && refreshToken) {
      // User clicked reset link in email
      setActiveTab('update-password');
      toast({
        title: "Réinitialisation du mot de passe",
        description: "Veuillez saisir votre nouveau mot de passe.",
      });
    }
  }, [toast]);

  // Check if user is on mobile
  useEffect(() => {
    // Get device information
    console.log('Auth page - Mobile detection:', { 
      isMobileViewport, 
      isMobileDevice, 
      hasStorageRestrictions, 
      isPrivateBrowsing,
      hasCookiesEnabled,
      connectionInfo
    });
    
    // Log environment info for debugging
    const envInfo = getEnvironmentInfo();
    console.log('Auth page - Detailed environment info:', envInfo);
    
    // If already signed in, redirect
    if (user) {
      console.log('User already logged in, redirecting to:', from);
      navigate(from, { replace: true });
    } else {
      // Clean up any stale auth state when landing on the auth page
      cleanupAuthState();
      
      // Check for connection issues from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('connection_error') || urlParams.has('recovery')) {
        setConnectionError("Une erreur de connexion s'est produite. Veuillez réessayer.");
        
        // Attempt connection check
        handleCheckConnection();
        
        // Attempt recovery if not already tried
        if (!recoveryAttempted) {
          attemptAuthRecovery().then(attempted => {
            setRecoveryAttempted(true);
          });
        }
      }
    }
  }, [user, navigate, from, recoveryAttempted, isMobileDevice, isMobileViewport]);

  // Function to check connection status
  const handleCheckConnection = useCallback(async () => {
    setIsCheckingConnection(true);

    try {
      // First test basic connectivity
      const probeResult = await probeConnectivity();

      // Then test Supabase connection if basic connectivity works
      let supabaseStatus: { success: boolean; error: string | null; duration: number } = {
        success: false,
        error: null,
        duration: 0,
      };
      if (probeResult.success) {
        supabaseStatus = await checkSupabaseConnection();
      }

      const success = probeResult.success && supabaseStatus.success;

      setConnectionCheck({
        lastChecked: Date.now(),
        success: success,
        latency: probeResult.latency,
      });

      if (success) {
        setConnectionError(null);
        toast({
          title: "Connexion rétablie",
          description: "Votre connexion à l'application fonctionne correctement.",
        });
      } else {
        // If still having connection issues, show detailed error
        const errorDetails = !probeResult.success
          ? "Problème de connexion internet"
          : `Problème de connexion au serveur: ${supabaseStatus.error || 'Erreur inconnue'}`;

        setConnectionError(`Une erreur de connexion persiste: ${errorDetails}`);

        toast({
          title: "Problème de connexion",
          description: errorDetails,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Connection check failed:", error);
      setConnectionCheck({
        lastChecked: Date.now(),
        success: false,
        latency: null,
      });
      setConnectionError(`Erreur lors de la vérification de connexion: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsCheckingConnection(false);
    }
  }, [toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setConnectionError(null);
    
    if (!email || !password) {
      setLoginError("Veuillez remplir tous les champs");
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Log detailed environment information
      console.log("Tentative de connexion avec:", { 
        email, 
        passwordLength: password.length, 
        isMobileDevice,
        isMobileViewport,
        hasStorageRestrictions,
        isPrivateBrowsing,
        hasCookiesEnabled,
        connectionInfo,
        userAgent: navigator.userAgent
      });
      
      cleanupAuthState();
      
      const connectionStatus = await checkConnection();
      if (!connectionStatus) {
        throw new Error("Problème de connexion au serveur. Veuillez vérifier votre connexion internet.");
      }
      
      await retryWithBackoff(
        async () => await signIn(email, password),
        isMobileDevice ? 2 : 1,
        1000,
        (attempt) => {
          if (attempt > 1) {
            toast({
              title: `Tentative ${attempt}`,
              description: "Reconnexion en cours..."
            });
          }
        }
      );
      
      toast({
        title: "Connexion en cours",
        description: "Vous allez être redirigé...",
        variant: "default"
      });
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue s'est produite";
      
      if (errorMessage.includes('network') || 
          errorMessage.includes('connection') || 
          errorMessage.includes('internet') ||
          errorMessage.includes('failed') ||
          errorMessage.toLowerCase().includes('load')) {
        
        setConnectionError(`Erreur de connexion: ${errorMessage}`);
        
        if (isMobileDevice) {
          toast({
            title: "Problème de connexion sur mobile",
            description: "Essayez de vérifier votre connexion réseau.",
            variant: "destructive"
          });
          
          handleCheckConnection();
        } else {
          toast({
            title: "Problème de connexion",
            description: "Vérifiez votre connexion internet et réessayez.",
            variant: "destructive"
          });
        }
      } else {
        setLoginError(errorMessage);
        toast({
          title: "Échec de la connexion",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setConnectionError(null);
    
    if (!email || !password) {
      setLoginError("Veuillez remplir tous les champs");
      toast({
        title: "Champs manquants",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }
    
    try {
      console.log("Tentative d'inscription avec:", { 
        email, 
        displayName, 
        passwordLength: password.length, 
        isMobileDevice,
        isMobileViewport,
        hasStorageRestrictions,
        isPrivateBrowsing,
        connectionInfo
      });
      
      cleanupAuthState();
      
      const connectionStatus = await checkConnection();
      if (!connectionStatus) {
        throw new Error("Problème de connexion au serveur. Veuillez vérifier votre connexion internet.");
      }
      
      await retryWithBackoff(
        async () => await signUp(email, password, displayName),
        isMobileDevice ? 2 : 1,
        1000,
        (attempt) => {
          if (attempt > 1) {
            toast({
              title: `Tentative ${attempt}`,
              description: "Inscription en cours..."
            });
          }
        }
      );
      
      setActiveTab('login');
      toast({
        title: "Inscription réussie",
        description: "Veuillez vérifier votre email pour confirmer votre compte.",
        variant: "default"
      });
    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue s'est produite";
      
      if (errorMessage.includes('network') || 
          errorMessage.includes('connection') || 
          errorMessage.includes('internet') ||
          errorMessage.includes('failed')) {
        
        setConnectionError(`Erreur de connexion lors de l'inscription: ${errorMessage}`);
        
        if (isMobileDevice) {
          toast({
            title: "Problème de connexion sur mobile",
            description: "Essayez de vérifier votre connexion réseau.",
            variant: "destructive"
          });
          
          handleCheckConnection();
        }
      } else {
        setLoginError(errorMessage);
        toast({
          title: "Échec de l'inscription",
          description: errorMessage,
          variant: "destructive"
        });
      }
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setLoginError(null);
    
    if (!email) {
      setLoginError("Veuillez saisir votre email");
      toast({
        title: "Email manquant",
        description: "Veuillez saisir votre email pour recevoir le lien de réinitialisation",
        variant: "destructive"
      });
      setResetLoading(false);
      return;
    }

    try {
      console.log("=== DÉBUT DE LA RÉINITIALISATION ===");
      console.log("Email:", email);
      console.log("Environnement:", { isMobileDevice, connectionInfo });
      
      // Méthode 1: Essayer la fonction Edge avec diagnostics détaillés
      try {
        console.log("Tentative 1: Appel de la fonction Edge send-password-reset");
        
        // Test direct sans vérification de connexion préalable
        const edgeResponse = await supabase.functions.invoke('send-password-reset', {
          body: { email },
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log("Réponse de la fonction Edge:", {
          data: edgeResponse.data,
          error: edgeResponse.error
        });

        if (edgeResponse.error) {
          console.error("Erreur de la fonction Edge:", edgeResponse.error);
          throw new Error(`Fonction Edge: ${edgeResponse.error.message || 'Erreur inconnue'}`);
        }

        if (edgeResponse.data?.error) {
          console.error("Erreur dans les données de la fonction Edge:", edgeResponse.data.error);
          throw new Error(`Données fonction Edge: ${edgeResponse.data.error}`);
        }

        console.log("✅ Fonction Edge réussie!");
        
        toast({
          title: "Email envoyé",
          description: "Un lien de réinitialisation a été envoyé à votre adresse email via notre fonction Edge.",
        });
        
        setActiveTab('login');
        setEmail('');
        return;
        
      } catch (edgeError: any) {
        console.error("❌ Échec de la fonction Edge:", {
          message: edgeError.message,
          name: edgeError.name,
          stack: edgeError.stack
        });
        
        // Si la fonction Edge échoue, essayer le fallback
        console.log("Tentative 2: Fallback vers la méthode native Supabase");
        
        try {
          const fallbackResponse = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth?reset=true`
          });

          console.log("Réponse du fallback Supabase:", {
            data: fallbackResponse.data,
            error: fallbackResponse.error
          });

          if (fallbackResponse.error) {
            throw new Error(`Fallback Supabase: ${fallbackResponse.error.message}`);
          }

          console.log("✅ Fallback Supabase réussi!");
          
          toast({
            title: "Email envoyé",
            description: "Un lien de réinitialisation a été envoyé à votre adresse email.",
          });
          
          setActiveTab('login');
          setEmail('');
          return;
          
        } catch (fallbackError: any) {
          console.error("❌ Échec du fallback Supabase:", fallbackError);
          
          // Les deux méthodes ont échoué
          throw new Error(`Toutes les méthodes ont échoué. Edge: ${edgeError.message}. Fallback: ${fallbackError.message}`);
        }
      }
      
    } catch (error: any) {
      console.error("=== ERREUR FINALE ===", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        cause: error.cause
      });
      
      let errorMessage = "Une erreur s'est produite lors de l'envoi de l'email";
      
      if (error.message?.includes('Failed to send a request')) {
        errorMessage = "Impossible de contacter le serveur. Vérifiez votre connexion internet.";
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        errorMessage = "Problème de réseau. Vérifiez votre connexion internet.";
      } else if (error.message?.includes('Edge') && error.message?.includes('Fallback')) {
        errorMessage = "Les services de réinitialisation sont temporairement indisponibles. Veuillez réessayer plus tard.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setLoginError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);
    setLoginError(null);
    
    if (!newPassword || !confirmPassword) {
      setLoginError("Veuillez remplir tous les champs");
      toast({
        title: "Champs manquants",
        description: "Veuillez saisir et confirmer votre nouveau mot de passe",
        variant: "destructive"
      });
      setUpdateLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setLoginError("Les mots de passe ne correspondent pas");
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      setUpdateLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setLoginError("Le mot de passe doit contenir au moins 6 caractères");
      toast({
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive"
      });
      setUpdateLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Mot de passe mis à jour",
        description: "Votre mot de passe a été mis à jour avec succès.",
      });
      
      // Redirect to main page
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error("Password update error:", error);
      const errorMessage = error.message || "Une erreur s'est produite lors de la mise à jour du mot de passe";
      setLoginError(errorMessage);
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  // Function to attempt connection recovery
  const handleRetryConnection = async () => {
    setConnectionError("Vérification de la connexion en cours...");
    
    try {
      cleanupAuthState();
      
      toast({
        title: "Tentative de reconnexion",
        description: "Nous essayons de résoudre le problème de connexion...",
      });
      
      await handleCheckConnection();
      
      if (connectionCheck.success) {
        const recovered = await attemptAuthRecovery();
        setRecoveryAttempted(true);
        
        if (!recovered) {
          toast({
            title: "Connexion rétablie",
            description: "Veuillez réessayer de vous connecter maintenant.",
          });
        }
      }
    } catch (e) {
      console.error("Recovery error:", e);
      toast({
        title: "Échec de la reconnexion",
        description: "Veuillez réessayer ultérieurement.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-center">Bienvenue sur l'application</CardTitle>
            <CardDescription className="text-center">
              Connectez-vous ou inscrivez-vous pour continuer
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loginError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}
            
            {connectionError && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Erreur de connexion</AlertTitle>
                <AlertDescription>
                  {connectionError}
                  <div className="mt-2 space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRetryConnection}
                      disabled={isCheckingConnection}
                      className="w-full"
                    >
                      {isCheckingConnection ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                          Vérification en cours...
                        </>
                      ) : (
                        'Vérifier la connexion'
                      )}
                    </Button>
                    
                    {connectionCheck.lastChecked && (
                      <div className="text-xs text-gray-500">
                        Dernière vérification: {new Date(connectionCheck.lastChecked).toLocaleTimeString()} 
                        {connectionCheck.success !== null && (
                          <> - Statut: <span className={connectionCheck.success ? "text-green-500" : "text-red-500"}>
                            {connectionCheck.success ? "Connecté" : "Déconnecté"}
                          </span></>
                        )}
                        {connectionCheck.latency && (
                          <> - Latence: {connectionCheck.latency}ms</>
                        )}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup' | 'reset' | 'update-password')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">Email</label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">Mot de passe</label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-tranches-sage hover:bg-tranches-sage/90"
                    disabled={isLoading || isCheckingConnection}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Connexion en cours...
                      </>
                    ) : (
                      "Se connecter"
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-tranches-sage hover:text-tranches-sage/80"
                      onClick={() => setActiveTab('reset')}
                    >
                      J'ai oublié mon mot de passe
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label htmlFor="display-name" className="text-sm font-medium">Nom d'affichage</label>
                    <Input
                      id="display-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Votre nom"
                      autoComplete="name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="signup-email" className="text-sm font-medium">Email</label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="signup-password" className="text-sm font-medium">Mot de passe</label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-tranches-charcoal hover:bg-tranches-charcoal/90"
                    disabled={isLoading || isCheckingConnection}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Inscription en cours...
                      </>
                    ) : (
                      "S'inscrire"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="reset">
                <form onSubmit={handlePasswordReset} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label htmlFor="reset-email" className="text-sm font-medium">Email</label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-tranches-sage hover:bg-tranches-sage/90"
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Envoi en cours...
                      </>
                    ) : (
                      "Envoyer le lien de réinitialisation"
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      className="text-sm text-gray-600 hover:text-gray-800"
                      onClick={() => setActiveTab('login')}
                    >
                      Retour à la connexion
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="update-password">
                <form onSubmit={handlePasswordUpdate} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <label htmlFor="new-password" className="text-sm font-medium">Nouveau mot de passe</label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="confirm-password" className="text-sm font-medium">Confirmer le mot de passe</label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-tranches-sage hover:bg-tranches-sage/90"
                    disabled={updateLoading}
                  >
                    {updateLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                        Mise à jour en cours...
                      </>
                    ) : (
                      "Mettre à jour le mot de passe"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
