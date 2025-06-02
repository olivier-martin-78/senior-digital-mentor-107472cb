
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useDisplayNameValidation } from '@/hooks/useDisplayNameValidation';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkDisplayNameUniqueness, isChecking } = useDisplayNameValidation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isSignUp) {
        // Vérifier que le nom public est fourni
        if (!displayName || displayName.trim().length === 0) {
          setIsLoading(false);
          return;
        }
        
        // Vérifier l'unicité du nom public avant l'inscription
        const isUnique = await checkDisplayNameUniqueness(displayName);
        if (!isUnique) {
          setIsLoading(false);
          return; // Arrêter si le nom n'est pas unique
        }
        
        await signUp(email, password, displayName);
      } else {
        await signIn(email, password);
        navigate('/');
      }
    } catch (error) {
      console.error('Erreur d\'authentification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const recovery = searchParams.get('recovery');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {isSignUp ? 'Créer un compte' : 'Se connecter'}
          </CardTitle>
          <CardDescription>
            {recovery && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  Reconnexion requise suite à un problème d'authentification.
                </p>
              </div>
            )}
            {isSignUp 
              ? 'Créez votre compte pour accéder à vos tranches de vie' 
              : 'Connectez-vous à votre compte'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="votre.email@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
            
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  Nom public <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  placeholder="Votre nom d'affichage"
                />
                <p className="text-sm text-gray-600">
                  Ce nom sera visible par les autres utilisateurs
                </p>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || isChecking || (isSignUp && !displayName.trim())}
            >
              {isLoading || isChecking
                ? (isChecking ? 'Vérification...' : 'Chargement...') 
                : (isSignUp ? 'Créer le compte' : 'Se connecter')
              }
            </Button>
          </form>
          
          <Separator className="my-6" />
          
          <div className="text-center space-y-4">
            <Button
              variant="ghost"
              onClick={() => setIsSignUp(!isSignUp)}
              className="w-full"
            >
              {isSignUp 
                ? 'Déjà un compte ? Se connecter' 
                : 'Pas de compte ? S\'inscrire'
              }
            </Button>
            
            {!isSignUp && (
              <Link to="/reset-password" className="text-sm text-blue-600 hover:text-blue-800">
                Mot de passe oublié ?
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
