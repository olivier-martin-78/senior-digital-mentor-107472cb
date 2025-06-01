
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  const token = searchParams.get('token');
  const type = searchParams.get('type');

  useEffect(() => {
    // Verify token validity on component mount
    if (!token || !type || type !== 'recovery') {
      setIsValidToken(false);
      setError('Lien de réinitialisation invalide ou expiré');
    } else {
      setIsValidToken(true);
    }
  }, [token, type]);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // Verify the token and update password
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token!,
        type: 'recovery',
      });

      if (verifyError) {
        throw new Error('Token invalide ou expiré');
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw new Error(updateError.message);
      }

      toast({
        title: 'Mot de passe mis à jour',
        description: 'Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé.',
      });

      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 2000);

    } catch (error: any) {
      console.error('Password reset error:', error);
      setError(error.message || 'Une erreur est survenue lors de la mise à jour du mot de passe');
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isValidToken === null) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
                <label htmlFor="new-password" className="text-sm font-medium">
                  Nouveau mot de passe
                </label>
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
                <label htmlFor="confirm-password" className="text-sm font-medium">
                  Confirmer le mot de passe
                </label>
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
