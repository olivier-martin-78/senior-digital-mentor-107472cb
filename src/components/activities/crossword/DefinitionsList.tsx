
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, ArrowDown, HelpCircle } from 'lucide-react';
import { PlacedWord } from './types';

interface DefinitionsListProps {
  words: PlacedWord[];
  selectedWord: number | null;
  onWordSelect: (wordId: number) => void;
}

const DefinitionsList: React.FC<DefinitionsListProps> = ({
  words,
  selectedWord,
  onWordSelect
}) => {
  const horizontalWords = words.filter(w => w.direction === 'horizontal');
  const verticalWords = words.filter(w => w.direction === 'vertical');

  return (
    <Card className="shadow-2xl">
      <CardHeader className="bg-gradient-to-r from-indigo-100 to-purple-100">
        <CardTitle className="text-xl flex items-center">
          <HelpCircle className="w-5 h-5 mr-2" />
          Définitions ({words.length} mots)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 max-h-96 overflow-y-auto">
        <div className="space-y-4">
          {horizontalWords.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-2 flex items-center">
                <ArrowRight className="w-4 h-4 mr-1" />
                Horizontaux ({horizontalWords.length})
              </h3>
              <div className="space-y-2">
                {horizontalWords.map((word) => (
                  <div
                    key={word.id}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedWord === word.id ? 'bg-yellow-100' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onWordSelect(word.id)}
                  >
                    <span className="font-bold text-blue-600">{word.id}.</span> {word.clue}
                    <span className="text-xs text-gray-500 ml-2">({word.length} lettres)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {verticalWords.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-2 flex items-center">
                <ArrowDown className="w-4 h-4 mr-1" />
                Verticaux ({verticalWords.length})
              </h3>
              <div className="space-y-2">
                {verticalWords.map((word) => (
                  <div
                    key={word.id}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedWord === word.id ? 'bg-yellow-100' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onWordSelect(word.id)}
                  >
                    <span className="font-bold text-blue-600">{word.id}.</span> {word.clue}
                    <span className="text-xs text-gray-500 ml-2">({word.length} lettres)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DefinitionsList;
