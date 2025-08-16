import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume2 } from 'lucide-react';

interface VoiceHelpButtonProps {
  onSpeak: (text: string, forceSpeak?: boolean) => void;
  helpText: string;
  accessibilityMode: boolean;
  className?: string;
}

export const VoiceHelpButton: React.FC<VoiceHelpButtonProps> = ({
  onSpeak,
  helpText,
  accessibilityMode,
  className = '',
}) => {
  const handleClick = () => {
    onSpeak(helpText, true); // Force speak even if voice is disabled
  };

  return (
    <Button
      onClick={handleClick}
      variant="outline"
      size={accessibilityMode ? 'lg' : 'default'}
      className={`
        bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700
        transition-all duration-200 hover:scale-105
        ${accessibilityMode ? 'px-6 py-3 text-lg' : 'px-4 py-2'}
        ${className}
      `}
    >
      <Volume2 className={`${accessibilityMode ? 'w-5 h-5' : 'w-4 h-4'} mr-2`} />
      Écouter explication
    </Button>
  );
};