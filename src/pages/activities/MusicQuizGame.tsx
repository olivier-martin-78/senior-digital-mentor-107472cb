import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MusicQuizGame: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const quizData = location.state?.quizData;

  const handleExit = () => {
    navigate('/activities');
  };

  if (!quizData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Erreur</h1>
          <p className="text-muted-foreground mb-6">Aucune donnée de quiz musical trouvée</p>
          <Button onClick={handleExit} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button onClick={handleExit} variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux activités
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              {quizData.title || "Quiz Musical"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-muted-foreground mb-4">
                Quiz musical en cours de développement
              </p>
              <p className="text-sm text-muted-foreground">
                Cette fonctionnalité sera bientôt disponible.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MusicQuizGame;