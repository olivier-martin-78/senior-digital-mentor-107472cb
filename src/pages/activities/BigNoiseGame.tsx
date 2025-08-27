import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBigNoiseGame } from '@/hooks/useBigNoiseGame';
import { GameSetup } from '@/components/big-noise-game/GameSetup';
import { GamePlay } from '@/components/big-noise-game/GamePlay';
import { GameResults } from '@/components/big-noise-game/GameResults';

export default function BigNoiseGame() {
  const {
    gameState,
    leaderboard,
    isLoading,
    hasSounds,
    soundsCount,
    startGame,
    playCurrentSound,
    submitUserInput,
    selectLabel,
    resetGame,
    setUserInput,
  } = useBigNoiseGame();

  const handleBackToGames = () => {
    window.location.href = '/activities/games';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button 
          onClick={handleBackToGames} 
          variant="ghost" 
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux jeux
        </Button>
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold gradient-text">
            Le jeu qui fait grand bruit
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Écoutez attentivement chaque bruitage et identifiez-le. 
            Tapez le bon mot pour 2 points ou choisissez parmi les options pour 0,5 point !
          </p>
        </div>
      </div>

      {gameState.phase === 'setup' && (
        <GameSetup
          leaderboard={leaderboard}
          onStartGame={startGame}
          hasSounds={hasSounds}
          soundsCount={soundsCount}
          isLoading={isLoading}
        />
      )}

      {(gameState.phase === 'playing' || gameState.phase === 'input' || gameState.phase === 'selection') && (
        <GamePlay
          gameState={gameState}
          onPlaySound={playCurrentSound}
          onSubmitInput={submitUserInput}
          onSelectLabel={selectLabel}
          onInputChange={setUserInput}
        />
      )}

      {gameState.phase === 'results' && (
        <GameResults
          gameState={gameState}
          onRestart={resetGame}
          onBackToMenu={resetGame}
        />
      )}
    </div>
  );
}