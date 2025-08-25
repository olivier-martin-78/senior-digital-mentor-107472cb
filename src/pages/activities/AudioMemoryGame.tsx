import React, { useEffect } from 'react';
import { useAudioMemoryGame } from '@/hooks/useAudioMemoryGame';
import { GameSetup } from '@/components/audio-memory-game/GameSetup';
import { GameDisplay } from '@/components/audio-memory-game/GameDisplay';
import { GameQuestion1 } from '@/components/audio-memory-game/GameQuestion1';
import { GameQuestion2 } from '@/components/audio-memory-game/GameQuestion2';
import { GameQuestion3 } from '@/components/audio-memory-game/GameQuestion3';
import { GameQuestion4 } from '@/components/audio-memory-game/GameQuestion4';
import { GameResults } from '@/components/audio-memory-game/GameResults';
import { UserActionsService } from '@/services/UserActionsService';
import { useNavigate } from 'react-router-dom';

export const AudioMemoryGame: React.FC = () => {
  const navigate = useNavigate();
  const {
    gameState,
    phase4TimeLeft,
    updateSettings,
    startGame,
    finishDisplay,
    answerQuestion1,
    answerQuestion2,
    answerQuestion3,
    handlePhase4SoundClick,
    removePhase4Sound,
    verifyPhase4,
    resetGame,
    getGameResult
  } = useAudioMemoryGame();

  useEffect(() => {
    UserActionsService.trackView('activity', 'audio_memory_game', 'Mémoire Auditive Inversée');
  }, []);

  const handleExit = () => {
    navigate('/activities/games');
  };

  const renderCurrentPhase = () => {
    switch (gameState.phase) {
      case 'setup':
        return (
          <GameSetup
            difficulty={gameState.settings.difficulty}
            onDifficultyChange={(difficulty) => updateSettings({ difficulty })}
            onStartGame={startGame}
          />
        );
      
      case 'display':
        return (
          <GameDisplay
            soundSequence={gameState.soundSequence}
            onFinishDisplay={finishDisplay}
          />
        );
      
      case 'question1':
        return (
          <GameQuestion1
            soundSequence={gameState.soundSequence.map(s => s.sound)}
            onAnswer={answerQuestion1}
            score={gameState.score}
          />
        );
      
      case 'question2':
        return (
          <GameQuestion2
            soundSequence={gameState.soundSequence.map(s => s.sound)}
            onAnswer={answerQuestion2}
            score={gameState.score}
          />
        );
      
      case 'question3':
        return (
          <GameQuestion3
            soundSequence={gameState.soundSequence}
            onAnswer={answerQuestion3}
            score={gameState.score}
          />
        );
      
      case 'question4':
        return (
          <GameQuestion4
            soundSequence={gameState.soundSequence}
            phase4Sounds={gameState.phase4Sounds}
            userSequence={gameState.userSequence}
            timeLeft={phase4TimeLeft}
            attempts={gameState.phase4Attempts}
            onSoundClick={handlePhase4SoundClick}
            onRemoveSound={removePhase4Sound}
            onVerify={verifyPhase4}
            score={gameState.score}
          />
        );
      
      case 'results':
        return (
          <GameResults
            gameResult={getGameResult()}
            onPlayAgain={resetGame}
            onExit={handleExit}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {renderCurrentPhase()}
      </div>
    </div>
  );
};