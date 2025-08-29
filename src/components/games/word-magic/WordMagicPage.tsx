import React, { useState, useEffect } from 'react';
import { useWordMagicGame } from '@/hooks/useWordMagicGame';
import { useWordMagicDB } from '@/hooks/useWordMagicDB';
import { useAuth } from '@/contexts/AuthContext';
import { WordMagicLevel } from '@/types/wordMagicGame';
import GameSetup from './GameSetup';
import GamePlay from './GamePlay';
import GameResults from './GameResults';
import { Loader2 } from 'lucide-react';

const WordMagicPage: React.FC = () => {
  const { user } = useAuth();
  const { levels, leaderboard, isLoading, hasLevels } = useWordMagicDB();
  const [selectedLevel, setSelectedLevel] = useState<WordMagicLevel | null>(null);
  
  const {
    gamePhase,
    currentLevel,
    gameStats,
    foundWords,
    currentWord,
    selectedLetters,
    isSubmitting,
    initializeGame,
    selectLetter,
    deselectLetter,
    clearSelection,
    submitWord,
    resetGame,
    getAvailableLetters,
    getRemainingWords,
    getProgressPercentage
  } = useWordMagicGame();

  // Auto-select first level if available
  useEffect(() => {
    if (!selectedLevel && levels.length > 0) {
      setSelectedLevel(levels[0]);
    }
  }, [levels, selectedLevel]);

  const handleStartGame = (level: WordMagicLevel) => {
    setSelectedLevel(level);
    initializeGame(level);
  };

  const handleResetGame = () => {
    resetGame();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Chargement du jeu...</p>
        </div>
      </div>
    );
  }

  if (!hasLevels) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <h2 className="text-2xl font-bold text-foreground">Aucun niveau disponible</h2>
          <p className="text-muted-foreground">
            Les niveaux du jeu ne sont pas encore configurés.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {gamePhase === 'setup' && (
          <GameSetup
            levels={levels}
            leaderboard={leaderboard}
            onStartGame={handleStartGame}
            selectedLevel={selectedLevel}
            onLevelSelect={setSelectedLevel}
          />
        )}

        {gamePhase === 'playing' && currentLevel && (
          <GamePlay
            level={currentLevel}
            gameStats={gameStats}
            foundWords={foundWords}
            currentWord={currentWord}
            selectedLetters={selectedLetters}
            availableLetters={getAvailableLetters()}
            remainingWords={getRemainingWords()}
            progressPercentage={getProgressPercentage()}
            onSelectLetter={selectLetter}
            onDeselectLetter={deselectLetter}
            onClearSelection={clearSelection}
            onSubmitWord={submitWord}
            onResetGame={handleResetGame}
          />
        )}

        {gamePhase === 'results' && (
          <GameResults
            gameStats={gameStats}
            foundWords={foundWords}
            level={currentLevel}
            leaderboard={leaderboard}
            onResetGame={handleResetGame}
            onNextLevel={() => {
              if (currentLevel && levels.length > currentLevel.level_number) {
                const nextLevel = levels.find(l => l.level_number === currentLevel.level_number + 1);
                if (nextLevel) {
                  handleStartGame(nextLevel);
                }
              }
            }}
          />
        )}
      </div>
    </div>
  );
};

export default WordMagicPage;