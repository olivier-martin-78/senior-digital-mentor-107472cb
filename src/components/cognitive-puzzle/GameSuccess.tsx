import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { GameLevel } from '@/types/cognitivePuzzle';

interface GameSuccessProps {
  level: GameLevel;
  score: number;
  hadTwist: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onMenu: () => void;
  onSpeak: (text: string) => void;
  accessibilityMode: boolean;
  isLastLevel: boolean;
}

export const GameSuccess: React.FC<GameSuccessProps> = ({
  level,
  score,
  hadTwist,
  onNextLevel,
  onReplay,
  onMenu,
  onSpeak,
  accessibilityMode,
  isLastLevel,
}) => {
  useEffect(() => {
    const message = isLastLevel 
      ? `Félicitations ! Vous avez terminé le scénario ! Score final : ${score} points`
      : `Bravo ! Niveau ${level.id} réussi ! Score : ${score} points`;
    
    onSpeak(message);
  }, [level.id, score, isLastLevel, onSpeak]);

  const getEncouragementMessage = () => {
    if (hadTwist) {
      return "Excellent ! Vous avez brillamment géré l'imprévu ! 🌟";
    }
    return "Parfait ! Votre organisation est impeccable ! ✨";
  };

  const getScoreMessage = () => {
    if (score >= 150) return "Performance exceptionnelle ! 🏆";
    if (score >= 100) return "Très bien joué ! 🎯";
    return "Bon travail ! 👍";
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-400/20 to-blue-400/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`
        bg-white rounded-3xl shadow-2xl border-4 border-green-200
        transform animate-scale-in
        ${accessibilityMode ? 'max-w-3xl p-10' : 'max-w-2xl p-8'}
      `}>
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="animate-bounce mb-4">
            <div className={`
              inline-flex items-center justify-center rounded-full
              bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg
              ${accessibilityMode ? 'w-24 h-24 text-5xl' : 'w-20 h-20 text-4xl'}
            `}>
              🎉
            </div>
          </div>
          
          <h2 className={`
            font-bold text-foreground mb-4
            ${accessibilityMode ? 'text-4xl' : 'text-3xl'}
          `}>
            {isLastLevel ? 'Scénario Terminé !' : 'Niveau Réussi !'}
          </h2>
          
          <p className={`
            text-green-600 font-semibold mb-2
            ${accessibilityMode ? 'text-xl' : 'text-lg'}
          `}>
            {getEncouragementMessage()}
          </p>
          
          <p className={`
            text-muted-foreground
            ${accessibilityMode ? 'text-lg' : 'text-base'}
          `}>
            {getScoreMessage()}
          </p>
        </div>

        {/* Score Display */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 mb-8">
          <div className="text-center">
            <div className={`
              font-bold text-green-600 mb-2
              ${accessibilityMode ? 'text-3xl' : 'text-2xl'}
            `}>
              {score} points
            </div>
            
            {hadTwist && (
              <div className="flex items-center justify-center gap-2 text-amber-600">
                <span className="text-xl">⭐</span>
                <span className={accessibilityMode ? 'text-base' : 'text-sm'}>
                  Bonus adaptation : +50 points
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Level Summary */}
        <div className="text-center mb-8">
          <h3 className={`
            font-semibold text-foreground mb-3
            ${accessibilityMode ? 'text-xl' : 'text-lg'}
          `}>
            {level.name}
          </h3>
          <p className={`
            text-muted-foreground
            ${accessibilityMode ? 'text-base' : 'text-sm'}
          `}>
            {level.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          {!isLastLevel && (
            <Button
              onClick={() => {
                onNextLevel();
                onSpeak('Passage au niveau suivant');
              }}
              size={accessibilityMode ? 'lg' : 'default'}
              className={`
                bg-gradient-to-r from-blue-500 to-indigo-600 hover:shadow-lg
                transform hover:scale-105 transition-all duration-200
                ${accessibilityMode ? 'px-8 py-4 text-lg' : 'px-6 py-3'}
              `}
            >
              <span className="mr-2">➡️</span>
              Niveau Suivant
            </Button>
          )}
          
          <Button
            onClick={() => {
              onReplay();
              onSpeak('Redémarrage du niveau');
            }}
            variant="outline"
            size={accessibilityMode ? 'lg' : 'default'}
            className={`
              hover:shadow-lg transform hover:scale-105 transition-all duration-200
              ${accessibilityMode ? 'px-8 py-4 text-lg' : 'px-6 py-3'}
            `}
          >
            <span className="mr-2">🔄</span>
            Rejouer
          </Button>
          
          <Button
            onClick={() => {
              onMenu();
              onSpeak('Retour au menu principal');
            }}
            variant="outline"
            size={accessibilityMode ? 'lg' : 'default'}
            className={`
              hover:shadow-lg transform hover:scale-105 transition-all duration-200
              ${accessibilityMode ? 'px-8 py-4 text-lg' : 'px-6 py-3'}
            `}
          >
            <span className="mr-2">🏠</span>
            Menu Principal
          </Button>
        </div>

        {/* Celebration Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};