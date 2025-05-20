
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, cleanupAuthState } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { detectMobileDevice, hasRestrictedStorage, isLikelyInPrivateBrowsing, hasCookiesEnabled } from '@/hooks/use-mobile';
import { getEnvironmentInfo, attemptAuthRecovery } from '@/utils/authUtils';
import { isMobileClient } from '@/integrations/supabase/client';

const Auth = () => {
  const { signIn, signUp, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [hasStorageIssues, setHasStorageIssues] = useState(false);
  const [isPrivateBrowsing, setIsPrivateBrowsing] = useState(false);
  const [hasCookies, setHasCookies] = useState(true);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);

  // Check if user is on mobile
  useEffect(() => {
    // Get device information
    setIsMobile(detectMobileDevice());
    setHasStorageIssues(hasRestrictedStorage());
    setIsPrivateBrowsing(isLikelyInPrivateBrowsing());
    setHasCookies(hasCookiesEnabled());
    
    // Log environment info for debugging
    const envInfo = getEnvironmentInfo();
    console.log('Auth page - Environment info:', envInfo);
    
    // If already signed in, redirect
    if (user) {
      console.log('User already logged in, redirecting to:', from);
      navigate(from, { replace: true });
    } else {
      // Clean up any stale auth state when landing on the auth page
      cleanupAuthState();
      
      // If URL contains "connection_error" parameter, show specific error
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('connection_error')) {
        setConnectionError("Une erreur de connexion s'est produite. Veuillez réessayer.");
        
        // Attempt recovery if not already tried
        if (!recoveryAttempted) {
          attemptAuthRecovery().then(attempted => {
            setRecoveryAttempted(true);
          });
        }
      }
    }
  }, [user, navigate, from, recoveryAttempted]);

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
        isMobile,
        hasStorageIssues,
        isPrivateBrowsing,
        hasCookies,
        userAgent: navigator.userAgent
      });
      
      // Clean up auth state before login attempt
      cleanupAuthState();
      
      // Attempt login
      await signIn(email, password);
      
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
        if (isMobile) {
          toast({
            title: "Problème de connexion sur mobile",
            description: "Essayez de vider le cache de votre navigateur ou de désactiver le mode navigation privée.",
            variant: "destructive"
          });
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
        isMobile,
        hasStorageIssues,
        isPrivateBrowsing
      });
      
      // Clean up auth state before signup attempt
      cleanupAuthState();
      
      await signUp(email, password, displayName);
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
        
        if (isMobile) {
          toast({
            title: "Problème de connexion sur mobile",
            description: "Essayez de vider le cache de votre navigateur ou de désactiver le mode navigation privée.",
            variant: "destructive"
          });
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
    setConnectionError(null);
    
    try {
      // Clean up auth state
      cleanupAuthState();
      
      // Show recovery message
      toast({
        title: "Tentative de reconnexion",
        description: "Nous essayons de résoudre le problème de connexion...",
      });
      
      // Try to recover auth state
      const recovered = await attemptAuthRecovery();
      
      if (!recovered) {
        // If no redirect happened, show success
        toast({
          title: "Connexion rétablie",
          description: "Veuillez réessayer de vous connecter maintenant.",
        });
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
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRetryConnection}
                      className="mt-2"
                    >
                      Réessayer la connexion
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {isMobile && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm font-medium text-amber-800 mb-2">Appareil mobile détecté</p>
                <ul className="list-disc text-left pl-5 text-sm text-amber-700">
                  <li>Désactivez le mode de navigation privée</li>
                  <li>Videz le cache de votre navigateur</li>
                  {hasStorageIssues && <li className="font-medium">Attention: Des restrictions de stockage ont été détectées</li>}
                  {isPrivateBrowsing && <li className="font-medium">Navigation privée détectée - cela peut causer des problèmes</li>}
                  {!hasCookies && <li className="font-medium">Cookies désactivés - veuillez les activer</li>}
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
                    disabled={isLoading}
                  >
                    {isLoading ? "Connexion en cours..." : "Se connecter"}
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
                    disabled={isLoading}
                  >
                    {isLoading ? "Inscription en cours..." : "S'inscrire"}
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
