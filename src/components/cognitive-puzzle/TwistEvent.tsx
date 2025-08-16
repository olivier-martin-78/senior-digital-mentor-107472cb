import React, { useEffect, useState } from 'react';
import { TwistEvent as TwistEventType } from '@/types/cognitivePuzzle';
import { Button } from '@/components/ui/button';
import { VoiceHelpButton } from './VoiceHelpButton';
import { AdaptationChoices } from './AdaptationChoices';

interface TwistEventProps {
  twist: TwistEventType;
  onAccept: () => void;
  onReject: () => void;
  onChoiceSelect: (choiceId: string) => void;
  onSpeak: (text: string) => void;
  accessibilityMode: boolean;
  showChoices: boolean;
}

export const TwistEvent: React.FC<TwistEventProps> = ({
  twist,
  onAccept,
  onReject,
  onChoiceSelect,
  onSpeak,
  accessibilityMode,
  showChoices,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Show adaptation choices if needed
  if (showChoices && twist.adaptationChoices) {
    return (
      <AdaptationChoices
        choices={twist.adaptationChoices}
        onChoiceSelect={onChoiceSelect}
        onSpeak={onSpeak}
        accessibilityMode={accessibilityMode}
      />
    );
  }

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);

    // Removed auto-speak - now only on demand

    return () => {
      clearTimeout(timer);
    };
  }, [twist.description]);

  const getIcon = () => {
    switch (twist.type) {
      case 'call':
        return '📞';
      case 'visitor':
        return '👥';
      case 'rain':
        return '🌧️';
      case 'traffic':
        return '🚗';
      case 'meeting':
        return '🤝';
      default:
        return '✨';
    }
  };

  const getBackgroundColor = () => {
    switch (twist.type) {
      case 'call':
        return 'from-blue-500 to-indigo-600';
      case 'visitor':
        return 'from-purple-500 to-pink-600';
      case 'rain':
        return 'from-gray-500 to-blue-600';
      case 'traffic':
        return 'from-red-500 to-orange-600';
      case 'meeting':
        return 'from-green-500 to-teal-600';
      default:
        return 'from-amber-500 to-yellow-600';
    }
  };

  return (
    <div className={`
      fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4
      transition-opacity duration-500
      ${isVisible ? 'opacity-100' : 'opacity-0'}
    `}>
      <div className={`
        bg-white rounded-3xl shadow-2xl border-4 border-white
        transform transition-all duration-500
        ${isVisible ? 'scale-100 rotate-0' : 'scale-50 rotate-12'}
        ${accessibilityMode ? 'max-w-2xl p-8' : 'max-w-lg p-6'}
      `}>
        {/* Twist Header */}
        <div className="text-center mb-6">
          <div className={`
            inline-flex items-center justify-center rounded-full
            bg-gradient-to-r ${getBackgroundColor()} text-white shadow-lg
            animate-bounce
            ${accessibilityMode ? 'w-20 h-20 text-4xl mb-4' : 'w-16 h-16 text-3xl mb-3'}
          `}>
            {getIcon()}
          </div>
          
          <h2 className={`
            font-bold text-foreground mb-2
            ${accessibilityMode ? 'text-3xl' : 'text-2xl'}
          `}>
            Événement Imprévu !
          </h2>
          
          <div className="flex justify-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>

        {/* Twist Description */}
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-6 mb-6">
          <p className={`
            text-center font-medium text-foreground leading-relaxed
            ${accessibilityMode ? 'text-xl' : 'text-lg'}
          `}>
            {twist.description}
          </p>
          
          {/* Effect Description */}
          {twist.effect && (
            <div className="mt-4 text-center">
              <p className={`
                text-muted-foreground font-medium
                ${accessibilityMode ? 'text-base' : 'text-sm'}
              `}>
                💡 Adaptation nécessaire !
              </p>
            </div>
          )}
        </div>

        {/* Voice Help Button */}
        <div className="text-center mb-6">
          <VoiceHelpButton
            onSpeak={onSpeak}
            helpText={`Événement imprévu ! ${twist.description} Vous pouvez soit accepter ce défi pour gagner des points bonus, soit le refuser et continuer normalement. Que choisissez-vous ?`}
            accessibilityMode={accessibilityMode}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
            <Button
              onClick={() => {
                onAccept();
                // Removed automatic speech - now only on demand
              }}
              size={accessibilityMode ? 'lg' : 'default'}
            className={`
              bg-gradient-to-r ${getBackgroundColor()} hover:shadow-lg
              transform hover:scale-105 transition-all duration-200
              ${accessibilityMode ? 'px-8 py-4 text-lg' : 'px-6 py-3'}
            `}
          >
            <span className="mr-2">🎯</span>
            J'accepte le défi !
          </Button>
          
            <Button
              onClick={() => {
                onReject();
                // Removed automatic speech - now only on demand
              }}
              variant="outline"
              size={accessibilityMode ? 'lg' : 'default'}
            className={`
              border-2 hover:bg-muted
              transform hover:scale-105 transition-all duration-200
              ${accessibilityMode ? 'px-8 py-4 text-lg' : 'px-6 py-3'}
            `}
          >
            <span className="mr-2">❌</span>
            Non merci
          </Button>
        </div>

        {/* Encouraging Message */}
        <div className="text-center mt-6">
          <p className={`
            text-muted-foreground font-medium
            ${accessibilityMode ? 'text-base' : 'text-sm'}
          `}>
            ✨ Les imprévus rendent la vie plus intéressante ! ✨
          </p>
        </div>

        {/* Floating Decorations */}
        <div className="absolute -top-2 -left-2 text-2xl animate-spin">
          ⭐
        </div>
        <div className="absolute -top-2 -right-2 text-2xl animate-bounce">
          🌟
        </div>
        <div className="absolute -bottom-2 -left-2 text-2xl animate-pulse">
          💫
        </div>
        <div className="absolute -bottom-2 -right-2 text-2xl animate-ping">
          ✨
        </div>
      </div>
    </div>
  );
};