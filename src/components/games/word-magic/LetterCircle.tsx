import React from 'react';
import { Button } from '@/components/ui/button';
import { SelectedLetter } from '@/types/wordMagicGame';

interface LetterCircleProps {
  availableLetters: string[];
  selectedLetters: SelectedLetter[];
  onSelectLetter: (letter: string, index: number) => void;
  onDeselectLetter: (index: number) => void;
}

const LetterCircle: React.FC<LetterCircleProps> = ({
  availableLetters,
  selectedLetters,
  onSelectLetter,
  onDeselectLetter
}) => {
  const isLetterSelected = (index: number) => {
    return selectedLetters.some(selected => selected.index === index);
  };

  const getSelectionOrder = (index: number) => {
    const selectedIndex = selectedLetters.findIndex(selected => selected.index === index);
    return selectedIndex >= 0 ? selectedIndex + 1 : null;
  };

  const handleLetterClick = (letter: string, index: number) => {
    if (isLetterSelected(index)) {
      onDeselectLetter(index);
    } else {
      onSelectLetter(letter, index);
    }
  };

  // Calculate circle positioning
  const getLetterPosition = (index: number, total: number) => {
    const angle = (index * 2 * Math.PI) / total;
    const radius = 120; // Base radius in pixels
    const x = Math.cos(angle - Math.PI / 2) * radius;
    const y = Math.sin(angle - Math.PI / 2) * radius;
    return { x, y };
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <h3 className="text-lg font-semibold">Sélectionnez les lettres</h3>
      
      {/* Letter circle container */}
      <div className="relative">
        <div 
          className="relative mx-auto"
          style={{ width: '280px', height: '280px' }}
        >
          {/* Center circle */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 flex items-center justify-center">
              <span className="text-xs text-primary font-medium">Lettres</span>
            </div>
          </div>
          
          {/* Letter buttons positioned in circle */}
          {availableLetters.map((letter, index) => {
            const position = getLetterPosition(index, availableLetters.length);
            const selected = isLetterSelected(index);
            const order = getSelectionOrder(index);
            
            return (
              <Button
                key={`${letter}-${index}`}
                onClick={() => handleLetterClick(letter, index)}
                className={`
                  absolute w-12 h-12 rounded-full transform -translate-x-1/2 -translate-y-1/2 
                  text-lg font-bold transition-all duration-200 hover:scale-110
                  ${selected 
                    ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/50' 
                    : 'bg-background text-foreground border-2 border-border hover:border-primary/50'
                  }
                `}
                style={{
                  left: `${140 + position.x}px`,
                  top: `${140 + position.y}px`,
                }}
              >
                <div className="relative">
                  {letter}
                  {order && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-accent-foreground rounded-full text-xs flex items-center justify-center">
                      {order}
                    </div>
                  )}
                </div>
              </Button>
            );
          })}
        </div>
      </div>
      
      {/* Instructions */}
      <div className="text-center text-sm text-muted-foreground max-w-md">
        <p>Cliquez sur les lettres dans l'ordre pour former un mot.</p>
        <p>Cliquez à nouveau sur une lettre pour la désélectionner.</p>
      </div>
      
      {/* Selected letters indicator */}
      {selectedLetters.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap justify-center">
          <span className="text-sm text-muted-foreground">Sélectionnées :</span>
          {selectedLetters.map((selected, index) => (
            <span key={index} className="text-sm font-mono font-bold text-primary">
              {selected.letter}
              {index < selectedLetters.length - 1 && '-'}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default LetterCircle;