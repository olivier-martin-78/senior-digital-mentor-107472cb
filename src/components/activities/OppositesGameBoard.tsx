
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useOppositesGame } from '@/hooks/useOppositesGame';

const OppositesGameBoard = () => {
  const {
    words,
    userAnswers,
    gameState,
    errors,
    correctPairs,
    difficulty,
    generateNewGrid,
    setDifficulty,
    updateAnswer,
    checkAnswers,
    resetGame
  } = useOppositesGame();

  const getDifficultyLabel = (diff: string) => {
    switch (diff) {
      case 'easy': return 'Facile (6 paires)';
      case 'medium': return 'Moyen (10 paires)';
      case 'hard': return 'Difficile (15 paires)';
      default: return '';
    }
  };

  const handleAnswerChange = (wordIndex: number, value: string) => {
    // Permettre une chaîne vide ou un nombre positif
    if (value === '' || (!isNaN(Number(value)) && Number(value) > 0)) {
      updateAnswer(wordIndex, value);
    }
  };

  const handleDifficultyChange = (value: string) => {
    setDifficulty(value as 'easy' | 'medium' | 'hard');
  };

  const renderGrid = () => {
    const columns = 4;
    const rows = Math.ceil(words.length / columns);
    const grid = [];

    for (let row = 0; row < rows; row++) {
      const rowItems = [];
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        if (index < words.length) {
          const word = words[index];
          const isError = errors.includes(index);
          const isCorrect = gameState === 'completed' && !isError;
          
          rowItems.push(
            <div key={index} className="flex items-center space-x-2 p-2">
              <span className={`flex-1 text-sm font-medium ${
                isError ? 'text-red-600' : isCorrect ? 'text-green-600' : 'text-gray-800'
              }`}>
                {word}
              </span>
              <Input
                type="text"
                value={userAnswers[index] || ''}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                className={`w-16 text-center ${
                  isError ? 'border-red-500 bg-red-50' : 
                  isCorrect ? 'border-green-500 bg-green-50' : ''
                }`}
                placeholder="#"
                disabled={gameState === 'completed'}
              />
            </div>
          );
        } else {
          rowItems.push(<div key={index} className="p-2"></div>);
        }
      }
      grid.push(
        <div key={row} className="grid grid-cols-4 gap-2 border-b border-gray-100 last:border-b-0">
          {rowItems}
        </div>
      );
    }
    return grid;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Jeu des Contraires</h1>
          <p className="text-gray-600 mb-6">
            Associez les mots contraires en leur attribuant le même chiffre. 
            Chaque paire doit avoir un numéro unique.
          </p>
        </div>

        {/* Contrôles */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Paramètres du jeu</span>
              <Badge variant="outline">
                {getDifficultyLabel(difficulty)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Difficulté :</label>
                <Select value={difficulty} onValueChange={handleDifficultyChange}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Facile (6 paires)</SelectItem>
                    <SelectItem value="medium">Moyen (10 paires)</SelectItem>
                    <SelectItem value="hard">Difficile (15 paires)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={generateNewGrid} 
                variant="outline"
                className="flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Nouvelle grille</span>
              </Button>
            </div>

            <div className="flex items-center space-x-4">
              <Button 
                onClick={checkAnswers}
                disabled={gameState === 'completed' || Object.keys(userAnswers).length === 0}
                className="flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Vérifier les réponses</span>
              </Button>

              {gameState !== 'playing' && (
                <Button 
                  onClick={resetGame}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <span>Recommencer</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Grille de jeu */}
        <Card>
          <CardHeader>
            <CardTitle>Grille de mots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {renderGrid()}
            </div>
          </CardContent>
        </Card>

        {/* Messages de résultat */}
        {gameState === 'completed' && errors.length === 0 && (
          <Card className="mt-6 bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold text-green-800 mb-2">
                  Félicitations !
                </h2>
                <p className="text-green-700">
                  Vous avez trouvé toutes les paires de contraires correctement !
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {gameState === 'completed' && errors.length > 0 && (
          <Card className="mt-6 bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    Certaines associations sont incorrectes
                  </h3>
                  <p className="text-red-700 mb-3">
                    Les mots surlignés en rouge ne sont pas correctement associés. 
                    Vérifiez les paires suivantes :
                  </p>
                  <div className="space-y-1">
                    {correctPairs.map((pair, index) => (
                      <div key={index} className="text-sm text-red-600">
                        <strong>{pair.word1}</strong> ↔ <strong>{pair.word2}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>Attribuez le même chiffre aux mots qui sont contraires</li>
              <li>Chaque paire doit avoir un numéro unique (1, 2, 3, etc.)</li>
              <li>Utilisez le bouton "Nouvelle grille" pour changer les mots</li>
              <li>Changez la difficulté pour avoir plus ou moins de paires à trouver</li>
              <li>Cliquez sur "Vérifier les réponses" quand vous avez terminé</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OppositesGameBoard;
