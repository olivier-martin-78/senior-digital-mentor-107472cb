import React from 'react';
import { useEmotionGame } from '@/hooks/useEmotionGame';
import { GameSetup } from '@/components/games/emotion-palette/GameSetup';
import { GamePlay } from '@/components/games/emotion-palette/GamePlay';
import { GameResults } from '@/components/games/emotion-palette/GameResults';

const EmotionPalettePage = () => {
  const {
    gamePhase,
    currentQuestion,
    currentQuestionIndex,
    shuffledLabels,
    selectedEmotion,
    selectedIntensity,
    showIntensityQuestion,
    gameStats,
    isLoading,
    leaderboard,
    progress,
    totalQuestions,
    initializeGame,
    startGame,
    handleEmotionSelect,
    handleIntensitySelect,
    resetGame,
    fetchLeaderboard
  } = useEmotionGame();

  console.log('🎮 [EMOTION_PAGE_DEBUG] Current state:', {
    gamePhase,
    hasCurrentQuestion: !!currentQuestion,
    isLoading
  });

  if (gamePhase === 'setup') {
    return (
      <div className="container mx-auto px-6 py-8">
        <GameSetup
          onStartGame={startGame}
          onInitializeGame={initializeGame}
          leaderboard={leaderboard}
          isLoading={isLoading}
        />
      </div>
    );
  }

  if (gamePhase === 'playing' && currentQuestion) {
    return (
      <div className="container mx-auto px-6 py-8">
        <GamePlay
          currentQuestion={currentQuestion}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestions={totalQuestions}
          shuffledLabels={shuffledLabels}
          selectedEmotion={selectedEmotion}
          selectedIntensity={selectedIntensity}
          showIntensityQuestion={showIntensityQuestion}
          gameStats={gameStats}
          progress={progress}
          onEmotionSelect={handleEmotionSelect}
          onIntensitySelect={handleIntensitySelect}
        />
      </div>
    );
  }

  if (gamePhase === 'results') {
    return (
      <div className="container mx-auto px-6 py-8">
        <GameResults
          gameStats={gameStats}
          leaderboard={leaderboard}
          onResetGame={resetGame}
          onFetchLeaderboard={fetchLeaderboard}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="text-center">
        <p>Chargement du jeu...</p>
      </div>
    </div>
  );
};

export default EmotionPalettePage;