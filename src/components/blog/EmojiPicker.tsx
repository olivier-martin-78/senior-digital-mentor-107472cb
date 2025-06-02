
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Smile } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Liste d'émojis populaires organisés par catégories
  const emojiCategories = {
    'Visages souriants': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😗'],
    'Émotions': ['😢', '😭', '😤', '😠', '🤬', '😡', '🤯', '😳', '🥺', '😰', '😨', '😱', '😍', '🤩', '🥳', '😎'],
    'Gestes': ['👍', '👎', '👌', '🤝', '👏', '🙌', '👐', '🤲', '🙏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉'],
    'Cœurs': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
    'Activités': ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃'],
    'Nourriture': ['🍎', '🍌', '🍇', '🍓', '🫐', '🍈', '🍉', '🍊', '🍋', '🍍', '🥭', '🍑', '🍒', '🍞', '🥐', '🧀']
  };

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-500 hover:text-gray-700"
          type="button"
        >
          <Smile className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="max-h-64 overflow-y-auto">
          {Object.entries(emojiCategories).map(([category, emojis]) => (
            <div key={category} className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
              <div className="grid grid-cols-8 gap-1">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleEmojiClick(emoji)}
                    className="w-8 h-8 text-lg hover:bg-gray-100 rounded flex items-center justify-center transition-colors"
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;
