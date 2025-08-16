import React from 'react';
import { ActivityItem as ActivityItemType } from '@/types/cognitivePuzzle';

interface ActivityItemProps {
  activity: ActivityItemType;
  isPlaced: boolean;
  isDragging: boolean;
  accessibilityMode: boolean;
  onDragStart: (e: React.DragEvent, activity: ActivityItemType) => void;
  onDragEnd: () => void;
  onSpeak: (text: string) => void;
}

export const ActivityItem: React.FC<ActivityItemProps> = ({
  activity,
  isPlaced,
  isDragging,
  accessibilityMode,
  onDragStart,
  onDragEnd,
  onSpeak,
}) => {
  const handleClick = () => {
    onSpeak(`${activity.name}. ${isPlaced ? 'Déjà placé' : 'À placer'}`);
  };

  return (
    <div
      className={`
        relative group cursor-grab active:cursor-grabbing
        transition-all duration-300 transform
        ${isDragging ? 'scale-110 rotate-2 z-50' : 'hover:scale-105'}
        ${isPlaced ? 'opacity-50 pointer-events-none' : ''}
        ${accessibilityMode ? 'min-w-[120px] min-h-[120px]' : 'min-w-[80px] min-h-[80px]'}
      `}
      draggable={!isPlaced}
      onDragStart={(e) => onDragStart(e, activity)}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      tabIndex={0}
      role="button"
      aria-label={`${activity.name} - ${isPlaced ? 'déjà placé' : 'glissez pour placer'}`}
    >
      {/* Item Card */}
      <div className={`
        bg-white rounded-2xl shadow-lg border-2 border-primary/20
        p-4 text-center transition-all duration-300
        hover:shadow-xl hover:border-primary/40
        ${isDragging ? 'shadow-2xl border-primary' : ''}
        ${accessibilityMode ? 'p-6' : ''}
      `}>
        {/* Icon */}
        <div className={`
          text-center mb-2 transition-transform duration-200
          ${isDragging ? 'animate-bounce' : 'group-hover:scale-110'}
          ${accessibilityMode ? 'text-6xl mb-3' : 'text-4xl'}
        `}>
          {activity.icon}
        </div>
        
        {/* Name */}
        <p className={`
          font-semibold text-foreground leading-tight
          ${accessibilityMode ? 'text-lg' : 'text-sm'}
        `}>
          {activity.name}
        </p>

        {/* Category Badge */}
        {activity.category === 'twist' && (
          <div className="absolute -top-2 -right-2 bg-amber-500 text-white rounded-full p-1">
            <span className="text-xs font-bold">✨</span>
          </div>
        )}
      </div>

      {/* Drag Helper */}
      {!isPlaced && (
        <div className={`
          absolute -bottom-8 left-1/2 transform -translate-x-1/2
          text-xs text-muted-foreground opacity-0 group-hover:opacity-100
          transition-opacity duration-200 pointer-events-none
          ${accessibilityMode ? 'text-sm -bottom-10' : ''}
        `}>
          Glissez-moi !
        </div>
      )}

      {/* Success Animation */}
      {isPlaced && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-green-400/20 rounded-2xl animate-pulse" />
          <div className="absolute top-1 right-1 text-green-500 animate-bounce">
            ✓
          </div>
        </div>
      )}
    </div>
  );
};