
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Eye } from 'lucide-react';
import { Difficulty } from './types';
import { getWordsForLevel } from './crosswordGenerator';

interface CrosswordControlsProps {
  difficulty: Difficulty;
  wordsCount: number;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onNewGame: () => void;
  onRevealSolution: () => void;
}

const CrosswordControls: React.FC<CrosswordControlsProps> = ({
  difficulty,
  wordsCount,
  onDifficultyChange,
  onNewGame,
  onRevealSolution
}) => {
  return (
    <Card className="mb-8 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100">
        <CardTitle className="text-2xl text-gray-800 flex items-center justify-between">
          <span>Contrôles</span>
          <Badge variant="outline" className="text-lg px-4 py-2">
            Niveau {difficulty} - {wordsCount} mots
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-3">
            <label className="text-sm font-bold text-gray-700">Difficulté :</label>
            <Select value={difficulty.toString()} onValueChange={(value) => onDifficultyChange(parseInt(value) as Difficulty)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Niveau 1 - Très facile</SelectItem>
                <SelectItem value="2">Niveau 2 - Facile</SelectItem>
                <SelectItem value="3">Niveau 3 - Moyen</SelectItem>
                <SelectItem value="4">Niveau 4 - Difficile</SelectItem>
                <SelectItem value="5">Niveau 5 - Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={onNewGame} className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Nouveau jeu</span>
          </Button>

          <Button onClick={onRevealSolution} variant="outline" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Afficher solution</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CrosswordControls;
