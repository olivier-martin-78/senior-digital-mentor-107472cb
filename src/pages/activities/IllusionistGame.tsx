import { useIllusionistGame } from '@/hooks/useIllusionistGame';
import { GameLoading } from '@/components/illusionist-game/GameLoading';
import { GameSetup } from '@/components/illusionist-game/GameSetup';
import { GamePlay } from '@/components/illusionist-game/GamePlay';
import { GameBonus } from '@/components/illusionist-game/GameBonus';
import { GameResults } from '@/components/illusionist-game/GameResults';

const IllusionistGame = () => {
  const {
    gameState,
    timeLeft,
    initializeGame,
    selectAnswer,
    answerBonus,
    restartGame,
    resetToSetup
  } = useIllusionistGame();

  if (gameState.phase === 'setup') {
    return (
      <div className="container mx-auto px-4 py-8">
        <GameSetup onStartGame={initializeGame} />
      </div>
    );
  }

  if (gameState.phase === 'playing') {
    return (
      <div className="container mx-auto px-4 py-8">
        <GamePlay 
          gameState={gameState}
          timeLeft={timeLeft}
          onSelectAnswer={selectAnswer}
        />
      </div>
    );
  }

  if (gameState.phase === 'bonus') {
    return (
      <div className="container mx-auto px-4 py-8">
        <GameBonus 
          gameState={gameState}
          onAnswerBonus={answerBonus}
        />
      </div>
    );
  }

  if (gameState.phase === 'results') {
    const result = {
      totalScore: gameState.score,
      correctAnswers: gameState.answers.filter(Boolean).length,
      bonusCorrect: gameState.bonusCorrect,
      maxScore: gameState.config.totalWords + 4
    };

    return (
      <div className="container mx-auto px-4 py-8">
        <GameResults 
          result={result}
          onRestart={restartGame}
          onBackToSetup={resetToSetup}
        />
      </div>
    );
  }

  return <GameLoading />;
};

export default IllusionistGame;