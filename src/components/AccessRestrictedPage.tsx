
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Crown, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAccountAccess } from '@/hooks/useAccountAccess';

interface AccessRestrictedPageProps {
  children: React.ReactNode;
}

const AccessRestrictedPage: React.FC<AccessRestrictedPageProps> = ({ children }) => {
  const navigate = useNavigate();
  const { hasAccess, accountStatus, freeTrialEnd, isLoading } = useAccountAccess();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  const getTimeRemaining = () => {
    if (!freeTrialEnd) return null;
    const end = new Date(freeTrialEnd);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}min`;
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            {accountStatus === 'trial' ? (
              <Clock className="w-12 h-12 text-orange-500" />
            ) : (
              <Lock className="w-12 h-12 text-red-500" />
            )}
          </div>
          <CardTitle className="text-2xl font-serif text-tranches-charcoal">
            {accountStatus === 'trial' ? 'Période d\'essai' : 'Accès restreint'}
          </CardTitle>
          {accountStatus === 'trial' && timeRemaining && (
            <Badge variant="outline" className="mx-auto mt-2">
              Temps restant: {timeRemaining}
            </Badge>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {accountStatus === 'trial' ? (
            <div className="text-center space-y-4">
              <p className="text-tranches-charcoal/80">
                Votre période d'essai gratuite se termine bientôt. 
                Choisissez un plan pour continuer à utiliser toutes les fonctionnalités.
              </p>
              <Button
                className="w-full bg-tranches-dustyblue hover:bg-tranches-dustyblue/90 text-white"
                onClick={() => navigate('/subscription')}
              >
                <Crown className="w-4 h-4 mr-2" />
                Choisir un plan
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <p className="text-tranches-charcoal/80">
                Votre accès a expiré. Veuillez choisir un plan pour continuer à utiliser l'application.
              </p>
              <Button
                className="w-full bg-tranches-dustyblue hover:bg-tranches-dustyblue/90 text-white"
                onClick={() => navigate('/subscription')}
              >
                <Crown className="w-4 h-4 mr-2" />
                Voir les plans d'abonnement
              </Button>
            </div>
          )}
          
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 text-center">
              Besoin d'aide ? Contactez notre support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessRestrictedPage;
