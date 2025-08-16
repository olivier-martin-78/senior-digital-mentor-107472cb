import React from 'react';
import { AdaptationChoice } from '@/types/cognitivePuzzle';
import { Button } from '@/components/ui/button';
import { VoiceHelpButton } from './VoiceHelpButton';

interface AdaptationChoicesProps {
  choices: AdaptationChoice[];
  onChoiceSelect: (choiceId: string) => void;
  onSpeak: (text: string) => void;
  accessibilityMode: boolean;
}

export const AdaptationChoices: React.FC<AdaptationChoicesProps> = ({
  choices,
  onChoiceSelect,
  onSpeak,
  accessibilityMode,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`
        bg-white rounded-3xl shadow-2xl border-4 border-white
        ${accessibilityMode ? 'max-w-4xl p-8' : 'max-w-2xl p-6'}
      `}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg animate-pulse w-16 h-16 text-3xl mb-4">
            🤔
          </div>
          <h2 className={`font-bold text-foreground mb-2 ${accessibilityMode ? 'text-3xl' : 'text-2xl'}`}>
            Comment réagissez-vous ?
          </h2>
          <p className={`text-muted-foreground ${accessibilityMode ? 'text-lg' : 'text-base'}`}>
            Choisissez votre stratégie d'adaptation
          </p>
        </div>

        {/* Voice Help */}
        <div className="text-center mb-6">
          <VoiceHelpButton
            onSpeak={onSpeak}
            helpText={`Choisissez comment vous voulez vous adapter à cette situation. ${choices.map(c => c.description).join(', ')}`}
            accessibilityMode={accessibilityMode}
          />
        </div>

        {/* Choices */}
        <div className="space-y-4 mb-6">
          {choices.map((choice, index) => (
            <Button
              key={choice.id}
              onClick={() => onChoiceSelect(choice.id)}
              variant="outline"
              size={accessibilityMode ? 'lg' : 'default'}
              className={`
                w-full text-left p-6 h-auto border-2 hover:bg-muted/50
                transform hover:scale-105 transition-all duration-200
                ${accessibilityMode ? 'text-lg' : 'text-base'}
              `}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0 mt-1">
                  {['🎯', '🤝', '🔍', '🏠'][index] || '✨'}
                </span>
                <span className="flex-1 leading-relaxed">
                  {choice.description}
                </span>
              </div>
            </Button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className={`text-muted-foreground font-medium ${accessibilityMode ? 'text-base' : 'text-sm'}`}>
            💡 Chaque choix vous mènera vers une solution adaptée
          </p>
        </div>
      </div>
    </div>
  );
};