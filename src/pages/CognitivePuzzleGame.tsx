import React from 'react';
import { Button } from '@/components/ui/button';
import { useCognitivePuzzle } from '@/hooks/useCognitivePuzzle';
import { homeScenario, cityScenario } from '@/data/cognitivePuzzleData';
import { HomeScenario } from '@/components/cognitive-puzzle/HomeScenario';
import { CityScenario } from '@/components/cognitive-puzzle/CityScenario';
import { TwistEvent } from '@/components/cognitive-puzzle/TwistEvent';
import { ArrowLeft, Volume2, VolumeX, Accessibility } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CognitivePuzzleGame: React.FC = () => {
  const navigate = useNavigate();
  const {
    gameState,
    selectScenario,
    startLevel,
    placeItem,
    removeItem,
    checkLevelCompletion,
    completeLevel,
    nextLevel,
    resetGame,
    toggleAccessibility,
    toggleVoice,
    speak,
    acceptTwist,
    rejectTwist,
    selectActivity,
    placeSelectedActivity,
  } = useCognitivePuzzle();

  React.useEffect(() => {
    document.title = 'Puzzle de Connexions Spatio-Temporelles';
    speak('Bienvenue dans le jeu Puzzle de Connexions Spatio-Temporelles');
  }, [speak]);

  const renderMenu = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-4 mb-6">
            <Button
              onClick={() => navigate('/activities')}
              variant="outline"
              size={gameState.accessibilityMode ? 'lg' : 'default'}
              className="transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            
            <div className="flex gap-2">
              <Button
                onClick={toggleVoice}
                variant={gameState.voiceEnabled ? 'default' : 'outline'}
                size={gameState.accessibilityMode ? 'lg' : 'default'}
                className="transition-all duration-200 hover:scale-105"
              >
                {gameState.voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              
              <Button
                onClick={toggleAccessibility}
                variant={gameState.accessibilityMode ? 'default' : 'outline'}
                size={gameState.accessibilityMode ? 'lg' : 'default'}
                className="transition-all duration-200 hover:scale-105"
              >
                <Accessibility className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <h1 className={`
            font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 
            bg-clip-text text-transparent mb-4
            ${gameState.accessibilityMode ? 'text-5xl' : 'text-4xl'}
          `}>
            🧩 Puzzle de Connexions Spatio-Temporelles
          </h1>
          
          <p className={`
            text-muted-foreground max-w-3xl mx-auto leading-relaxed
            ${gameState.accessibilityMode ? 'text-xl' : 'text-lg'}
          `}>
            Stimulez vos capacités cognitives en organisant vos activités dans l'espace et le temps. 
            Gérez les imprévus avec sérénité !
          </p>
        </div>

        {/* Scenario Selection */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Home Scenario */}
          <div 
            className={`
              bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl 
              border-2 border-transparent hover:border-amber-200
              transition-all duration-300 cursor-pointer group
              hover:shadow-2xl hover:scale-105
              ${gameState.accessibilityMode ? 'p-10' : ''}
            `}
            onClick={() => {
              selectScenario('home');
              speak('Scénario Journée à la Maison sélectionné');
            }}
          >
            <div className="text-center">
              <div className={`
                text-amber-600 group-hover:animate-bounce mb-6
                ${gameState.accessibilityMode ? 'text-8xl' : 'text-6xl'}
              `}>
                🏠
              </div>
              
              <h2 className={`
                font-bold text-foreground mb-4
                ${gameState.accessibilityMode ? 'text-2xl' : 'text-xl'}
              `}>
                Journée à la Maison
              </h2>
              
              <p className={`
                text-muted-foreground mb-6 leading-relaxed
                ${gameState.accessibilityMode ? 'text-base' : 'text-sm'}
              `}>
                Organisez votre journée à domicile : petit-déjeuner, lecture, sieste...
                Adaptez-vous aux appels imprévus et aux visiteurs !
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-amber-600">
                  <span>📍</span>
                  <span className={gameState.accessibilityMode ? 'text-sm' : 'text-xs'}>
                    3 niveaux progressifs
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-amber-600">
                  <span>🏆</span>
                  <span className={gameState.accessibilityMode ? 'text-sm' : 'text-xs'}>
                    Défis d'adaptation
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* City Scenario */}
          <div 
            className={`
              bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl 
              border-2 border-transparent hover:border-sky-200
              transition-all duration-300 cursor-pointer group
              hover:shadow-2xl hover:scale-105
              ${gameState.accessibilityMode ? 'p-10' : ''}
            `}
            onClick={() => {
              selectScenario('city');
              speak('Scénario Sortie en Ville sélectionné');
            }}
          >
            <div className="text-center">
              <div className={`
                text-sky-600 group-hover:animate-bounce mb-6
                ${gameState.accessibilityMode ? 'text-8xl' : 'text-6xl'}
              `}>
                🏙️
              </div>
              
              <h2 className={`
                font-bold text-foreground mb-4
                ${gameState.accessibilityMode ? 'text-2xl' : 'text-xl'}
              `}>
                Sortie en Ville
              </h2>
              
              <p className={`
                text-muted-foreground mb-6 leading-relaxed
                ${gameState.accessibilityMode ? 'text-base' : 'text-sm'}
              `}>
                Planifiez votre sortie : marché, café, promenade...
                Gérez les embouteillages et la pluie avec souplesse !
              </p>
              
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2 text-sky-600">
                  <span>🗺️</span>
                  <span className={gameState.accessibilityMode ? 'text-sm' : 'text-xs'}>
                    3 niveaux progressifs
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 text-sky-600">
                  <span>⚡</span>
                  <span className={gameState.accessibilityMode ? 'text-sm' : 'text-xs'}>
                    Imprévus urbains
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Game Features */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className={`
            text-center font-bold text-foreground mb-8
            ${gameState.accessibilityMode ? 'text-2xl' : 'text-xl'}
          `}>
            ✨ Fonctionnalités du Jeu
          </h3>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🎯', title: 'Glisser-Déposer', desc: 'Interface intuitive' },
              { icon: '🔊', title: 'Voix Off', desc: 'Aide vocale complète' },
              { icon: '⚡', title: 'Événements Surprises', desc: 'Adaptabilité cognitive' },
              { icon: '🏆', title: 'Feedback Positif', desc: 'Encouragements constants' },
            ].map((feature, index) => (
              <div key={index} className="text-center p-4 bg-white/60 rounded-2xl">
                <div className={`text-3xl mb-2 ${gameState.accessibilityMode ? 'text-4xl mb-3' : ''}`}>
                  {feature.icon}
                </div>
                <h4 className={`font-semibold text-foreground mb-1 ${gameState.accessibilityMode ? 'text-base' : 'text-sm'}`}>
                  {feature.title}
                </h4>
                <p className={`text-muted-foreground ${gameState.accessibilityMode ? 'text-sm' : 'text-xs'}`}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Progress Display */}
        {gameState.completedLevels.length > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto">
              <h4 className={`font-bold text-foreground mb-3 ${gameState.accessibilityMode ? 'text-lg' : 'text-base'}`}>
                🏆 Vos Réussites
              </h4>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className={`font-bold text-green-600 ${gameState.accessibilityMode ? 'text-xl' : 'text-lg'}`}>
                    {gameState.completedLevels.length}
                  </div>
                  <div className={`text-muted-foreground ${gameState.accessibilityMode ? 'text-sm' : 'text-xs'}`}>
                    Niveaux réussis
                  </div>
                </div>
                <div className="text-center">
                  <div className={`font-bold text-blue-600 ${gameState.accessibilityMode ? 'text-xl' : 'text-lg'}`}>
                    {gameState.score}
                  </div>
                  <div className={`text-muted-foreground ${gameState.accessibilityMode ? 'text-sm' : 'text-xs'}`}>
                    Points totaux
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render appropriate scenario or menu
  if (gameState.gamePhase === 'menu') {
    return renderMenu();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50">
      {/* Twist Event Overlay */}
      {gameState.activeTwist && (
        <TwistEvent
          twist={gameState.activeTwist}
          onAccept={acceptTwist}
          onReject={rejectTwist}
          onSpeak={speak}
          accessibilityMode={gameState.accessibilityMode}
        />
      )}

      {/* Render Current Scenario */}
      {gameState.currentScenario === 'home' && (
        <HomeScenario
          gameState={gameState}
          onPlaceItem={placeItem}
          onRemoveItem={removeItem}
          onCheckCompletion={checkLevelCompletion}
          onCompleteLevel={completeLevel}
          onNextLevel={nextLevel}
          onStartLevel={startLevel}
          onBackToMenu={() => {
            resetGame();
            speak('Retour au menu principal');
          }}
          onSpeak={speak}
        />
      )}

      {gameState.currentScenario === 'city' && (
        <CityScenario
          gameState={gameState}
          onPlaceItem={placeItem}
          onRemoveItem={removeItem}
          onCheckCompletion={checkLevelCompletion}
          onCompleteLevel={completeLevel}
          onNextLevel={nextLevel}
          onStartLevel={startLevel}
          onBackToMenu={() => {
            resetGame();
            speak('Retour au menu principal');
          }}
          onSpeak={speak}
        />
      )}
    </div>
  );
};

export default CognitivePuzzleGame;