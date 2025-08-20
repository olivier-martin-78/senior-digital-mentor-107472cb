import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Volume2, Eye, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useObjectAssemblyGame } from '@/hooks/useObjectAssemblyGame';
import { GameBoard } from '@/components/object-assembly/GameBoard';
import { VictoryScreen } from '@/components/object-assembly/VictoryScreen';
import { GameHUD } from '@/components/object-assembly/GameHUD';
import { ScenarioSelector } from '@/components/object-assembly/ScenarioSelector';

export default function ObjectAssemblyGame() {
  const navigate = useNavigate();
  const {
    gameState,
    scenarios,
    loading,
    selectScenario,
    startLevel,
    resetGame,
    toggleAccessibility,
    toggleVoice,
    speak
  } = useObjectAssemblyGame();

  React.useEffect(() => {
    document.title = 'Assemblage d\'Objets dans l\'Espace et le Temps';
    speak('Bienvenue dans le jeu Assemblage d\'Objets. Choisissez un scénario pour commencer.');
  }, [speak]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Chargement du jeu...</p>
        </div>
      </div>
    );
  }

  const renderGameContent = () => {
    switch (gameState.gamePhase) {
      case 'menu':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold text-primary">
                Assemblage d'Objets dans l'Espace et le Temps
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Stimulez votre mémoire spatiale et temporelle en organisant des objets familiers 
                dans votre maison selon les bonnes séquences.
              </p>
            </div>
            
            <ScenarioSelector 
              scenarios={scenarios}
              onSelectScenario={selectScenario}
              gameState={gameState}
            />
          </div>
        );

      case 'playing':
        return (
          <GameBoard />
        );

      case 'success':
        return (
          <VictoryScreen 
            onNext={startLevel}
            onMenu={resetGame}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/activities')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour aux activités
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => speak('Cliquez sur les objets pour les faire glisser vers les zones appropriées.')}
              className="gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Aide
            </Button>
            
            <Button
              variant={gameState.voiceEnabled ? "default" : "ghost"}
              size="sm"
              onClick={toggleVoice}
              className="gap-2"
            >
              <Volume2 className="h-4 w-4" />
              Voix
            </Button>

            <Button
              variant={gameState.accessibilityMode ? "default" : "ghost"}
              size="sm"
              onClick={toggleAccessibility}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Accessibilité
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {gameState.gamePhase === 'playing' && (
          <GameHUD 
            score={gameState.score}
            level={gameState.currentLevel}
            errors={gameState.currentErrors}
            hintsUsed={gameState.hintsUsed}
          />
        )}
        
        <Card className="p-8">
          {renderGameContent()}
        </Card>
      </main>
    </div>
  );
}