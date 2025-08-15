import React, { useEffect } from 'react';
import { useMemoryCountGame } from '@/hooks/useMemoryCountGame';
import { GameSetup } from '@/components/memory-count-game/GameSetup';
import { GamePlay } from '@/components/memory-count-game/GamePlay';
import { GameQuestions } from '@/components/memory-count-game/GameQuestions';
import { GameBonus } from '@/components/memory-count-game/GameBonus';
import { GameResults } from '@/components/memory-count-game/GameResults';
import { UserActionsService } from '@/services/UserActionsService';

export const MemoryCountGame: React.FC = () => {
  const {
    gameState,
    updateSettings,
    startGame,
    finishPlaying,
    answerQuestion,
    answerBonusQuestion,
    resetGame,
    getGameResult
  } = useMemoryCountGame();

  useEffect(() => {
    // Track page view when component mounts
    UserActionsService.trackView('activity', 'memory-count-game', 'Combien de fois...');
  }, []);

  const renderCurrentPhase = () => {
    switch (gameState.phase) {
      case 'setup':
        return (
          <GameSetup
            settings={gameState.settings}
            onUpdateSettings={updateSettings}
            onStartGame={startGame}
          />
        );

      case 'playing':
        return (
          <GamePlay
            imageSequence={gameState.imageSequence}
            displayDuration={gameState.settings.displayDuration}
            onFinish={finishPlaying}
          />
        );

      case 'questions':
        return (
          <GameQuestions
            selectedImages={gameState.selectedImages}
            currentQuestionIndex={gameState.currentQuestionIndex}
            onAnswer={answerQuestion}
          />
        );

      case 'bonus':
        return gameState.bonusQuestion ? (
          <GameBonus
            selectedImages={gameState.selectedImages}
            bonusQuestion={gameState.bonusQuestion}
            onAnswer={answerBonusQuestion}
          />
        ) : null;

      case 'results':
        return (
          <GameResults
            result={getGameResult()}
            onPlayAgain={resetGame}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
      {renderCurrentPhase()}
    </div>
  );
};