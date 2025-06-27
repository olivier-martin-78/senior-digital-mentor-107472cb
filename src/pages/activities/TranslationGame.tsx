
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslationGame } from '@/hooks/useTranslationGame';
import { GameLoading } from '@/components/translation-game/GameLoading';
import { GameModeSelection } from '@/components/translation-game/GameModeSelection';
import { GamePlay } from '@/components/translation-game/GamePlay';
import { GameResults } from '@/components/translation-game/GameResults';

const TranslationGame = () => {
  const {
    gameWords,
    currentQuestionIndex,
    gameMode,
    userAnswer,
    score,
    gameStarted,
    gameFinished,
    showResult,
    isCorrect,
    loading,
    gameHistory,
    TOTAL_QUESTIONS,
    setUserAnswer,
    startGame,
    replayWithWords, // Nouvelle fonction
    getCurrentWord,
    getCorrectAnswer,
    checkAnswer,
    nextQuestion,
    resetGame,
  } = useTranslationGame();

  if (loading) {
    return <GameLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/activities" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
            <ArrowLeft className="w-5 h-5" />
            <span>Retour aux activités</span>
          </Link>
          
          {gameStarted && !gameFinished && (
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} / {TOTAL_QUESTIONS}
              </div>
              <div className="text-sm font-semibold text-blue-600">
                Score: {score} / {TOTAL_QUESTIONS}
              </div>
            </div>
          )}
        </div>

        {/* Écran de sélection du mode */}
        {!gameStarted && !gameFinished && (
          <GameModeSelection
            gameWords={gameWords}
            gameHistory={gameHistory}
            onStartGame={startGame}
            onReplayGame={replayWithWords} // Passer la fonction de rejeu
            totalQuestions={TOTAL_QUESTIONS}
          />
        )}

        {/* Jeu en cours */}
        {gameStarted && !gameFinished && (
          <GamePlay
            gameMode={gameMode}
            currentWord={getCurrentWord()}
            correctAnswer={getCorrectAnswer()}
            userAnswer={userAnswer}
            showResult={showResult}
            isCorrect={isCorrect}
            totalQuestions={TOTAL_QUESTIONS}
            currentQuestionIndex={currentQuestionIndex}
            onAnswerChange={setUserAnswer}
            onCheckAnswer={checkAnswer}
            onNextQuestion={nextQuestion}
          />
        )}

        {/* Résultats finaux */}
        {gameFinished && (
          <GameResults
            score={score}
            totalQuestions={TOTAL_QUESTIONS}
            onResetGame={resetGame}
          />
        )}
      </div>
    </div>
  );
};

export default TranslationGame;
