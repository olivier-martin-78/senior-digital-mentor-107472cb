
import React from 'react';

interface MoodDisplayProps {
  rating: number | null;
  size?: 'sm' | 'md' | 'lg';
}

const MoodDisplay: React.FC<MoodDisplayProps> = ({ rating, size = 'md' }) => {
  if (!rating) return null;

  const moodOptions = {
    1: { emoji: '😢', label: 'Très difficile' },
    2: { emoji: '😔', label: 'Difficile' },
    3: { emoji: '😐', label: 'Neutre' },
    4: { emoji: '😊', label: 'Bonne' },
    5: { emoji: '😄', label: 'Excellente' }
  };

  const mood = moodOptions[rating as keyof typeof moodOptions];
  if (!mood) return null;

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl'
  };

  return (
    <div className="flex items-center gap-3">
      <span className={sizeClasses[size]}>{mood.emoji}</span>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-600">Humeur</span>
        <span className="text-gray-900">{mood.label}</span>
      </div>
    </div>
  );
};

export default MoodDisplay;
