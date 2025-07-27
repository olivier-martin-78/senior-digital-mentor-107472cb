
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, AlertCircle, Star, Zap, Heart } from 'lucide-react';
import { useOppositesGame } from '@/hooks/useOppositesGame';
import { UserActionsService } from '@/services/UserActionsService';

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

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-gradient-to-r from-green-400 to-emerald-500';
      case 'medium': return 'bg-gradient-to-r from-amber-400 to-orange-500';
      case 'hard': return 'bg-gradient-to-r from-red-400 to-pink-500';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-500';
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

  // Tracker le démarrage du jeu une seule fois
  React.useEffect(() => {
    UserActionsService.trackView('activity', 'opposites-game', 'Jeu des Contraires');
  }, []);

  const handleCheckAnswers = async () => {
    checkAnswers();
    
    // Tracker la vérification des réponses
    await UserActionsService.trackUserAction(
      'view',
      'activity',
      'opposites-game-check',
      'Vérification Jeu des Contraires',
      { difficulty, wordCount: words.length }
    );
  };

  const handleGenerateNewGrid = async () => {
    generateNewGrid();
    
    // Tracker la génération d'une nouvelle grille
    await UserActionsService.trackUserAction(
      'view', 
      'activity',
      'opposites-game-new',
      'Nouvelle grille Jeu des Contraires',
      { difficulty }
    );
  };

  const renderGrid = () => {
    const columns = 4;
    const rows = Math.ceil(words.length / columns);
    const grid = [];

    const wordColors = [
      'bg-gradient-to-br from-purple-100 to-purple-200',
      'bg-gradient-to-br from-blue-100 to-blue-200',
      'bg-gradient-to-br from-green-100 to-green-200',
      'bg-gradient-to-br from-yellow-100 to-yellow-200',
      'bg-gradient-to-br from-pink-100 to-pink-200',
      'bg-gradient-to-br from-indigo-100 to-indigo-200',
      'bg-gradient-to-br from-teal-100 to-teal-200',
      'bg-gradient-to-br from-orange-100 to-orange-200'
    ];

    for (let row = 0; row < rows; row++) {
      const rowItems = [];
      for (let col = 0; col < columns; col++) {
        const index = row * columns + col;
        if (index < words.length) {
          const word = words[index];
          const isError = errors.includes(index);
          const isCorrect = gameState === 'completed' && !isError;
          const colorClass = wordColors[index % wordColors.length];
          
          rowItems.push(
            <div key={index} className={`relative p-4 rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg ${colorClass} ${
              isError ? 'ring-2 ring-red-400 bg-gradient-to-br from-red-100 to-red-200' : 
              isCorrect ? 'ring-2 ring-green-400 bg-gradient-to-br from-green-100 to-green-200' : ''
            }`}>
              <div className="flex items-center justify-between space-x-3">
                <span className={`flex-1 text-sm font-bold ${
                  isError ? 'text-red-700' : isCorrect ? 'text-green-700' : 'text-gray-800'
                }`}>
                  {word}
                </span>
                <div className="flex items-center space-x-2">
                  <Input
                    type="text"
                    value={userAnswers[index] || ''}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className={`w-16 text-center font-bold transition-all duration-200 ${
                      isError ? 'border-red-500 bg-red-50 text-red-700' : 
                      isCorrect ? 'border-green-500 bg-green-50 text-green-700' : 
                      'border-gray-300 bg-white hover:border-purple-400 focus:border-purple-500'
                    }`}
                    placeholder="#"
                    disabled={gameState === 'completed'}
                  />
                  {isCorrect && <Star className="w-4 h-4 text-yellow-500" />}
                  {isError && <AlertCircle className="w-4 h-4 text-red-500" />}
                </div>
              </div>
            </div>
          );
        } else {
          rowItems.push(<div key={index} className="p-4"></div>);
        }
      }
      grid.push(
        <div key={row} className="grid grid-cols-4 gap-4">
          {rowItems}
        </div>
      );
    }
    return grid;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* En-tête avec style amélioré */}
          <div className="text-center mb-8 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-3xl opacity-10 blur-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20">
              <div className="flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-purple-600 mr-3" />
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
                  Jeu des Contraires
                </h1>
                <Heart className="w-8 h-8 text-pink-500 ml-3" />
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Associez les mots contraires en leur attribuant le même chiffre. 
                <br />
                <span className="font-semibold text-purple-700">Chaque paire doit avoir un numéro unique !</span>
              </p>
            </div>
          </div>

          {/* Contrôles avec design amélioré */}
          <Card className="mb-8 overflow-hidden shadow-2xl border-0">
            <div className={`h-2 ${getDifficultyColor(difficulty)}`}></div>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className="flex items-center justify-between text-2xl">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-gray-800">Paramètres du jeu</span>
                </div>
                <Badge className={`${getDifficultyColor(difficulty)} text-white border-0 px-4 py-2 text-sm font-bold shadow-lg`}>
                  {getDifficultyLabel(difficulty)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-white">
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-bold text-gray-700">Difficulté :</label>
                  <Select value={difficulty} onValueChange={handleDifficultyChange}>
                    <SelectTrigger className="w-48 border-2 border-purple-200 hover:border-purple-400 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">🟢 Facile (6 paires)</SelectItem>
                      <SelectItem value="medium">🟡 Moyen (10 paires)</SelectItem>
                      <SelectItem value="hard">🔴 Difficile (15 paires)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleGenerateNewGrid} 
                  variant="outline"
                  className="flex items-center space-x-2 border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Nouvelle grille</span>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <Button 
                  onClick={handleCheckAnswers}
                  disabled={gameState === 'completed' || Object.keys(userAnswers).length === 0}
                  className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Vérifier les réponses</span>
                </Button>

                {gameState !== 'playing' && (
                  <Button 
                    onClick={resetGame}
                    variant="outline"
                    className="flex items-center space-x-2 border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50 transition-all duration-200"
                  >
                    <span>Recommencer</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Grille de jeu avec design amélioré */}
          <Card className="shadow-2xl border-0 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100">
              <CardTitle className="text-2xl text-gray-800 flex items-center">
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse mr-3"></div>
                Grille de mots
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 bg-gradient-to-br from-gray-50 to-white">
              <div className="space-y-4">
                {renderGrid()}
              </div>
            </CardContent>
          </Card>

          {/* Messages de résultat avec animations */}
          {gameState === 'completed' && errors.length === 0 && (
            <Card className="mt-8 bg-gradient-to-r from-green-100 via-emerald-100 to-teal-100 border-0 shadow-2xl animate-scale-in">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <div className="text-8xl mb-6 animate-bounce">🎉</div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                    Félicitations !
                  </h2>
                  <p className="text-green-700 text-lg font-medium">
                    Vous avez trouvé toutes les paires de contraires correctement !
                  </p>
                  <div className="flex justify-center mt-6 space-x-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-8 h-8 text-yellow-500 animate-pulse" style={{animationDelay: `${i * 0.1}s`}} />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {gameState === 'completed' && errors.length > 0 && (
            <Card className="mt-8 bg-gradient-to-r from-red-100 via-pink-100 to-orange-100 border-0 shadow-2xl">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-start space-x-4">
                  <AlertCircle className="h-8 w-8 text-red-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold text-red-800 mb-3">
                      Certaines associations sont incorrectes
                    </h3>
                    <p className="text-red-700 mb-4 text-base">
                      Les mots surlignés en rouge ne sont pas correctement associés. 
                      Voici les bonnes paires :
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {correctPairs.map((pair, index) => (
                        <div key={index} className="bg-white/70 rounded-lg p-3 text-sm text-red-700 font-medium">
                          <strong className="text-red-800">{pair.word1}</strong> ↔ <strong className="text-red-800">{pair.word2}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions avec design amélioré */}
          <Card className="mt-8 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl text-gray-800 flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse mr-3"></div>
                Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Attribuez le même chiffre aux mots qui sont contraires",
                  "Chaque paire doit avoir un numéro unique (1, 2, 3, etc.)",
                  "Utilisez le bouton 'Nouvelle grille' pour changer les mots",
                  "Changez la difficulté pour avoir plus ou moins de paires à trouver",
                  "Cliquez sur 'Vérifier les réponses' quand vous avez terminé"
                ].map((instruction, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-white/70 rounded-lg">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{instruction}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OppositesGameBoard;
