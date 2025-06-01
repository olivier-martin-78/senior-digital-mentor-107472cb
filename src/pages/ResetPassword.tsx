
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    console.log('ResetPassword - Params reçus:', { token, type });
    
    // Vérifier la validité du token à l'arrivée sur la page
    if (!token || !type || type !== 'recovery') {
      console.error('ResetPassword - Token ou type invalide');
      setIsValidToken(false);
      setError('Lien de réinitialisation invalide ou expiré');
    } else {
      console.log('ResetPassword - Token valide, vérification avec Supabase...');
      verifyToken();
    }
  }, [token, type]);

  const verifyToken = async () => {
    if (!token) return;
    
    try {
      // Tenter de vérifier le token avec Supabase
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
      });

      if (verifyError) {
        console.error('ResetPassword - Erreur de vérification:', verifyError);
        setIsValidToken(false);
        setError('Token invalide ou expiré');
      } else {
        console.log('ResetPassword - Token vérifié avec succès');
        setIsValidToken(true);
      }
    } catch (error) {
      console.error('ResetPassword - Erreur lors de la vérification:', error);
      setIsValidToken(false);
      setError('Erreur lors de la vérification du token');
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Token manquant');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      setIsLoading(false);
      return;
    }

    try {
      console.log('ResetPassword - Mise à jour du mot de passe...');
      
      // Vérifier le token et mettre à jour le mot de passe
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery',
      });

      if (verifyError) {
        console.error('ResetPassword - Erreur de vérification finale:', verifyError);
        throw new Error('Token invalide ou expiré');
      }

      // Mettre à jour le mot de passe
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error('ResetPassword - Erreur de mise à jour:', updateError);
        throw new Error(updateError.message);
      }

      console.log('ResetPassword - Mot de passe mis à jour avec succès');
      setIsSuccess(true);

      toast({
        title: 'Mot de passe mis à jour',
        description: 'Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé.',
      });

      // Rediriger vers la page de connexion après un court délai
      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 3000);

    } catch (error: any) {
      console.error('ResetPassword - Erreur:', error);
      setError(error.message || 'Une erreur est survenue lors de la mise à jour du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

  // Page d'erreur pour token invalide
  if (isValidToken === false) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-center text-red-600">
                Lien invalide
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>
                  Ce lien de réinitialisation est invalide ou a expiré. 
                  Veuillez demander un nouveau lien de réinitialisation.
                </AlertDescription>
              </Alert>
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full mt-4"
                variant="outline"
              >
                Retour à la connexion
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Page de chargement
  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Vérification du lien de réinitialisation...</p>
        </div>
      </div>
    );
  }

  // Page de succès
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-2xl font-serif text-center text-green-600">
                Mot de passe mis à jour
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <p className="text-gray-700 mb-4">
                Votre mot de passe a été mis à jour avec succès.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Redirection vers la page de connexion...
              </p>
              <Button 
                onClick={() => navigate('/auth')} 
                className="w-full"
              >
                Aller à la connexion
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Page principale de réinitialisation
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-serif text-center">
              Nouveau mot de passe
            </CardTitle>
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
                <Label htmlFor="new-password">
                  Nouveau mot de passe
                </Label>
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
                <Label htmlFor="confirm-password">
                  Confirmer le mot de passe
                </Label>
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                    Mise à jour en cours...
                  </>
                ) : (
                  'Mettre à jour le mot de passe'
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
