import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Home, 
  RotateCcw, 
  Send, 
  Star, 
  Target,
  CheckCircle,
  Clock,
  Trophy
} from 'lucide-react';
import { WordMagicLevel, GameStats, SelectedLetter } from '@/types/wordMagicGame';
import CrosswordGrid from './CrosswordGrid';
import LetterCircle from './LetterCircle';

interface GamePlayProps {
  level: WordMagicLevel;
  gameStats: GameStats;
  foundWords: string[];
  currentWord: string;
  selectedLetters: SelectedLetter[];
  availableLetters: string[];
  remainingWords: string[];
  progressPercentage: number;
  onSelectLetter: (letter: string, index: number) => void;
  onDeselectLetter: (index: number) => void;
  onClearSelection: () => void;
  onSubmitWord: () => void;
  onResetGame: () => void;
}

const GamePlay: React.FC<GamePlayProps> = ({
  level,
  gameStats,
  foundWords,
  currentWord,
  selectedLetters,
  availableLetters,
  remainingWords,
  progressPercentage,
  onSelectLetter,
  onDeselectLetter,
  onClearSelection,
  onSubmitWord,
  onResetGame
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile': return 'bg-green-100 text-green-800 border-green-200';
      case 'moyen': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'difficile': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with game info and controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle className="text-2xl">Niveau {level.level_number}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getDifficultyColor(level.difficulty)}>
                    {level.difficulty}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Lettres : {level.letters.split(',').join(', ')}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onResetGame}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Retour
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* Progress and Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Score</span>
              </div>
              <p className="text-2xl font-bold text-primary">{gameStats.score}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Trouvés</span>
              </div>
              <p className="text-2xl font-bold">{gameStats.words_found}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Total</span>
              </div>
              <p className="text-2xl font-bold">{gameStats.total_words}</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Star className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">Bonus</span>
              </div>
              <p className="text-2xl font-bold">{gameStats.bonus_words_found}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progression</span>
              <span className="font-medium">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Crossword Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Grille des mots</CardTitle>
            </CardHeader>
            <CardContent>
              <CrosswordGrid 
                level={level}
                foundWords={foundWords}
              />
            </CardContent>
          </Card>
        </div>

        {/* Found Words & Word Input */}
        <div className="space-y-6">
          {/* Current Word Input */}
          <Card>
            <CardHeader>
              <CardTitle>Mot en cours</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-center text-2xl font-mono font-bold min-h-[2rem]">
                  {currentWord || "..."}
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={onClearSelection}
                  variant="outline" 
                  size="sm"
                  className="flex-1 gap-1"
                  disabled={!currentWord}
                >
                  <RotateCcw className="h-4 w-4" />
                  Effacer
                </Button>
                
                <Button 
                  onClick={onSubmitWord}
                  size="sm"
                  className="flex-1 gap-1"
                  disabled={!currentWord || currentWord.length < 3}
                >
                  <Send className="h-4 w-4" />
                  Valider
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Found Words */}
          <Card>
            <CardHeader>
              <CardTitle>Mots trouvés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {foundWords.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    Aucun mot trouvé
                  </p>
                ) : (
                  foundWords.map((word, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded"
                    >
                      <span className="font-mono font-medium">{word}</span>
                      {level.bonus_words.includes(word) && (
                        <Star className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Letter Selection Circle */}
      <Card>
        <CardContent className="py-6">
          <LetterCircle
            availableLetters={availableLetters}
            selectedLetters={selectedLetters}
            onSelectLetter={onSelectLetter}
            onDeselectLetter={onDeselectLetter}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default GamePlay;