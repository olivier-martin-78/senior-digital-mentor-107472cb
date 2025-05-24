
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

const Auth = () => {
  const { signIn, signUp, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const from = location.state?.from?.pathname || '/';

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  
  // Error states
  const [loginError, setLoginError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
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
      
      // Clean up auth state before login attempt
      cleanupAuthState();
      
      // Check connection first
      const connectionStatus = await checkConnection();
      if (!connectionStatus) {
        throw new Error("Problème de connexion au serveur. Veuillez vérifier votre connexion internet.");
      }
      
      // Attempt login with retry
      await retryWithBackoff(
        async () => await signIn(email, password),
        isMobileDevice ? 2 : 1, // More retries on mobile
        1000, // Start with 1s delay
        (attempt) => {
          if (attempt > 1) {
            toast({
              title: `Tentative ${attempt}`,
              description: "Reconnexion en cours..."
            });
          }
        }
      );
      
      // Navigation will happen in the useEffect when user state is updated
      toast({
        title: "Connexion en cours",
        description: "Vous allez être redirigé...",
        variant: "default"
      });
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue s'est produite";
      
      // Handle connection errors specifically
      if (errorMessage.includes('network') || 
          errorMessage.includes('connection') || 
          errorMessage.includes('internet') ||
          errorMessage.includes('failed') ||
          errorMessage.toLowerCase().includes('load')) {
        
        setConnectionError(`Erreur de connexion: ${errorMessage}`);
        
        // Show mobile-specific advice
        if (isMobileDevice) {
          toast({
            title: "Problème de connexion sur mobile",
            description: "Essayez de vider le cache de votre navigateur ou de désactiver le mode navigation privée.",
            variant: "destructive"
          });
          
          // Attempt connection check
          handleCheckConnection();
        } else {
          toast({
            title: "Problème de connexion",
            description: "Vérifiez votre connexion internet et réessayez.",
            variant: "destructive"
          });
        }
      } else {
        // Handle other errors
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
      
      // Clean up auth state before signup attempt
      cleanupAuthState();
      
      // Check connection first
      const connectionStatus = await checkConnection();
      if (!connectionStatus) {
        throw new Error("Problème de connexion au serveur. Veuillez vérifier votre connexion internet.");
      }
      
      // Attempt signup with retry for mobile devices
      await retryWithBackoff(
        async () => await signUp(email, password, displayName),
        isMobileDevice ? 2 : 1, // More retries on mobile
        1000, // Start with 1s delay
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
      
      // Handle connection errors specifically for signup
      if (errorMessage.includes('network') || 
          errorMessage.includes('connection') || 
          errorMessage.includes('internet') ||
          errorMessage.includes('failed')) {
        
        setConnectionError(`Erreur de connexion lors de l'inscription: ${errorMessage}`);
        
        // Show mobile-specific advice and check connection
        if (isMobileDevice) {
          toast({
            title: "Problème de connexion sur mobile",
            description: "Essayez de vider le cache de votre navigateur ou de désactiver le mode navigation privée.",
            variant: "destructive"
          });
          
          // Attempt connection check
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

  // Function to attempt connection recovery
  const handleRetryConnection = async () => {
    setConnectionError("Vérification de la connexion en cours...");
    
    try {
      // Clean up auth state
      cleanupAuthState();
      
      // Show recovery message
      toast({
        title: "Tentative de reconnexion",
        description: "Nous essayons de résoudre le problème de connexion...",
      });
      
      // Check connection
      await handleCheckConnection();
      
      // Try to recover auth state if connection is good
      if (connectionCheck.success) {
        const recovered = await attemptAuthRecovery();
        setRecoveryAttempted(true);
        
        if (!recovered) {
          // If no redirect happened, show success
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
            <CardTitle className="text-2xl font-serif text-center">Bienvenue sur le Blog</CardTitle>
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
                    
                    {isMobileDevice && (
                      <div className="text-xs font-medium">
                        Conseils:
                        <ul className="list-disc pl-5 mt-1">
                          <li>Essayez de désactiver le mode économie de données</li>
                          <li>Essayez un autre réseau (4G ou Wi-Fi)</li>
                          <li>Redémarrez votre navigateur</li>
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {isMobileDevice && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
           {/*   <p className="text-sm font-medium text-amber-800 mb-2">Appareil mobile détecté</p>*/}
                <ul className="list-disc text-left pl-5 text-sm text-amber-700">
           {/*    <li>Désactivez le mode de navigation privée</li>
                  <li>Videz le cache de votre navigateur</li>
                  <li>Désactivez le mode économie de données</li>*/}
                  {hasStorageRestrictions && <li className="font-medium">Attention: Des restrictions de stockage ont été détectées</li>}
                  {isPrivateBrowsing && <li className="font-medium">Navigation privée détectée - cela peut causer des problèmes</li>}
                  {!hasCookiesEnabled && <li className="font-medium">Cookies désactivés - veuillez les activer</li>}
                  {connectionInfo && !connectionInfo.online && <li className="font-medium text-red-600">Vous semblez être hors ligne</li>}
                  {connectionInfo && connectionInfo.effectiveType === 'slow-2g' && 
                    <li className="font-medium">Connexion très lente détectée</li>}
                </ul>
              </div>
            )}
            
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
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
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
