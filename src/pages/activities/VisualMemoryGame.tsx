import React, { useEffect } from 'react';
import { useVisualMemoryGame } from '@/hooks/useVisualMemoryGame';
import { GameSetup } from '@/components/visual-memory-game/GameSetup';
import { GameDisplay } from '@/components/visual-memory-game/GameDisplay';
import { GameQuestion1 } from '@/components/visual-memory-game/GameQuestion1';
import { GameQuestion2 } from '@/components/visual-memory-game/GameQuestion2';
import { GameQuestion3 } from '@/components/visual-memory-game/GameQuestion3';
import { GameQuestion4 } from '@/components/visual-memory-game/GameQuestion4';
import { GameResults } from '@/components/visual-memory-game/GameResults';
import { UserActionsService } from '@/services/UserActionsService';

export const VisualMemoryGame: React.FC = () => {
  const {
    gameState,
    phase4TimeLeft,
    updateSettings,
    startGame,
    finishDisplay,
    answerQuestion1,
    answerQuestion2,
    answerQuestion3,
    handlePhase4ImageClick,
    removePhase4Image,
    verifyPhase4,
    resetGame,
    getGameResult
  } = useVisualMemoryGame();

  useEffect(() => {
    UserActionsService.trackView('activity', 'visual-memory-game', 'Mémoire Visuelle Inversée');
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

      case 'display':
        return (
          <GameDisplay
            imageSequence={gameState.imageSequence}
            displayDuration={gameState.settings.displayDuration}
            onFinish={finishDisplay}
          />
        );

      case 'question1':
        return (
          <GameQuestion1
            imageSequence={gameState.imageSequence}
            currentQuestionIndex={gameState.currentQuestionIndex}
            onAnswer={answerQuestion1}
          />
        );

      case 'question2':
        return (
          <GameQuestion2
            imageSequence={gameState.imageSequence}
            currentQuestionIndex={gameState.currentQuestionIndex}
            onAnswer={answerQuestion2}
          />
        );

      case 'question3':
        return (
          <GameQuestion3
            imageSequence={gameState.imageSequence}
            currentQuestionIndex={gameState.currentQuestionIndex}
            onAnswer={answerQuestion3}
          />
        );

      case 'question4':
        return (
          <GameQuestion4
            imageSequence={gameState.imageSequence}
            phase4Images={gameState.phase4Images}
            userSequence={gameState.userSequence}
            phase4TimeLeft={phase4TimeLeft}
            phase4Attempts={gameState.phase4Attempts}
            onImageClick={handlePhase4ImageClick}
            onRemoveImage={removePhase4Image}
            onVerify={verifyPhase4}
          />
        );

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

  return renderCurrentPhase();
};