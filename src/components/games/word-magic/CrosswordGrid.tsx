import React from 'react';
import { WordMagicLevel } from '@/types/wordMagicGame';

interface CrosswordGridProps {
  level: WordMagicLevel;
  foundWords: string[];
}

const CrosswordGrid: React.FC<CrosswordGridProps> = ({ level, foundWords }) => {
  // This is a simplified crossword grid implementation
  // In a full implementation, you would need more sophisticated 
  // grid layout logic based on the level.grid_layout
  
  const renderSimpleGrid = () => {
    // For now, show a simple representation
    const maxWordLength = Math.max(...level.solutions.map(word => word.length));
    const gridSize = Math.max(8, Math.min(12, maxWordLength + 2));
    
    return (
      <div className="space-y-6">
        {/* Grid placeholder */}
        <div 
          className="grid gap-1 mx-auto w-fit"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, index) => {
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;
            
            // Simple pattern: show some cells as active/inactive
            const isActive = (row + col) % 3 === 0 || row === Math.floor(gridSize / 2) || col === Math.floor(gridSize / 2);
            
            return (
              <div
                key={index}
                className={`
                  w-8 h-8 border border-border flex items-center justify-center text-sm font-bold
                  ${isActive 
                    ? 'bg-background border-2 border-primary/20' 
                    : 'bg-muted/30 border-muted'
                  }
                `}
              >
                {isActive && ''}
              </div>
            );
          })}
        </div>
        
        {/* Words list as fallback */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="font-semibold mb-3 text-center">Mots à trouver</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {level.solutions.map((word) => (
              <div
                key={word}
                className={`
                  p-2 rounded text-center font-mono text-sm transition-colors
                  ${foundWords.includes(word) 
                    ? 'bg-green-100 text-green-800 line-through border border-green-200' 
                    : 'bg-background border border-border'
                  }
                `}
              >
                {foundWords.includes(word) ? word : '???'}
              </div>
            ))}
          </div>
          
          {level.bonus_words.length > 0 && (
            <>
              <h4 className="font-semibold mb-3 text-center mt-6">Mots bonus ⭐</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {level.bonus_words.map((word) => (
                  <div
                    key={word}
                    className={`
                      p-2 rounded text-center font-mono text-sm transition-colors
                      ${foundWords.includes(word) 
                        ? 'bg-yellow-100 text-yellow-800 line-through border border-yellow-200' 
                        : 'bg-background border border-dashed border-yellow-300'
                      }
                    `}
                  >
                    {foundWords.includes(word) ? word : '???'}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderSimpleGrid()}
    </div>
  );
};

export default CrosswordGrid;