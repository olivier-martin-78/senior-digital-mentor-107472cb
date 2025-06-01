
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validToken, setValidToken] = useState<boolean | null>(null);

  // Récupérer les paramètres de l'URL
  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    // Vérifier si nous avons les paramètres nécessaires
    if (!token || type !== 'recovery') {
      setValidToken(false);
      setError("Lien de réinitialisation invalide ou expiré.");
      return;
    }

    // Vérifier la session pour s'assurer que le token est valide
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setValidToken(true);
      } else {
        // Essayer de récupérer la session avec le token
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'recovery'
        });
        
        if (error) {
          console.error("Erreur de vérification du token:", error);
          setValidToken(false);
          setError("Lien de réinitialisation invalide ou expiré.");
        } else {
          setValidToken(true);
        }
      }
    };

    checkSession();
  }, [token, type]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!newPassword || !confirmPassword) {
      setError("Veuillez remplir tous les champs");
      toast({
        title: "Champs manquants",
        description: "Veuillez saisir et confirmer votre nouveau mot de passe",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      toast({
        title: "Mot de passe trop court",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive"
      });
      setLoading(false);
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
      
      // Rediriger vers la page principale
      navigate('/', { replace: true });
    } catch (error: any) {
      console.error("Password update error:", error);
      const errorMessage = error.message || "Une erreur s'est produite lors de la mise à jour du mot de passe";
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

  if (validToken === null) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Vérification en cours...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (validToken === false) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-center">Lien invalide</CardTitle>
              <CardDescription className="text-center">
                Ce lien de réinitialisation est invalide ou a expiré
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="mt-4">
                <Button 
                  onClick={() => navigate('/auth')} 
                  className="w-full"
                >
                  Retour à la connexion
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
      <Header />
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-center">Nouveau mot de passe</CardTitle>
            <CardDescription className="text-center">
              Saisissez votre nouveau mot de passe
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
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
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Mise à jour en cours...
                  </>
                ) : (
                  "Mettre à jour le mot de passe"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
