import React from 'react';
import { TimeSlot, PlacedItem, ActivityItem } from '@/types/cognitivePuzzle';
import { formatTextWithLineBreaks } from '@/lib/utils';

interface TimelineProps {
  timeSlots: TimeSlot[];
  placedItems: PlacedItem[];
  activities: ActivityItem[];
  selectedActivity: string | null;
  accessibilityMode: boolean;
  onDrop: (timeSlotId: string, activityId: string) => void;
  onPlaceSelected: (timeSlotId: string) => void;
  onRemove: (activityId: string) => void;
  onSpeak: (text: string) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  timeSlots,
  placedItems,
  activities,
  selectedActivity,
  accessibilityMode,
  onDrop,
  onPlaceSelected,
  onRemove,
  onSpeak,
}) => {
  const [dragOver, setDragOver] = React.useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    setDragOver(slotId);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    const activityId = e.dataTransfer.getData('activityId');
    if (activityId) {
      onDrop(slotId, activityId);
      // Removed automatic speech - now only on demand
    }
    setDragOver(null);
  };

  const getPlacedActivity = (slotId: string) => {
    const placement = placedItems.find(item => item.timeSlotId === slotId);
    if (!placement) return null;
    return activities.find(activity => activity.id === placement.activityId);
  };

  if (timeSlots.length === 0) return null;

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
      <div className="flex items-center gap-4 mb-6">
        <div className="text-3xl">⏰</div>
        <h3 className={`font-bold text-foreground ${accessibilityMode ? 'text-2xl' : 'text-xl'}`}>
          Organisez votre temps
        </h3>
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        {timeSlots.map((slot) => {
          const placedActivity = getPlacedActivity(slot.id);
          const isDraggedOver = dragOver === slot.id;

          return (
            <div
              key={slot.id}
              className={`
                relative flex-1 min-w-[150px] transition-all duration-300
                ${accessibilityMode ? 'min-w-[200px] min-h-[150px]' : 'min-h-[120px]'}
              `}
              onDragOver={(e) => handleDragOver(e, slot.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, slot.id)}
              onClick={() => {
                if (selectedActivity && !placedActivity) {
                  onPlaceSelected(slot.id);
                } else {
                  // Removed automatic speech - now only on demand
                }
              }}
            >
              {/* Time Slot */}
              <div className={`
                h-full bg-gradient-to-br from-blue-50 to-purple-50 
                rounded-2xl border-2 border-dashed transition-all duration-300
                flex flex-col items-center justify-center p-4
                hover:shadow-lg hover:scale-105
                ${isDraggedOver ? 'border-primary bg-primary/10 scale-105' : 'border-blue-200'}
                ${placedActivity ? 'border-solid border-green-400 bg-green-50' : ''}
                ${selectedActivity && !placedActivity ? 'border-primary bg-primary/5 ring-2 ring-primary ring-opacity-30' : ''}
              `}>
                {/* Time Icon & Label */}
                <div className={`text-center mb-3 ${accessibilityMode ? 'mb-4' : ''}`}>
                  <div className={`${accessibilityMode ? 'text-4xl mb-2' : 'text-3xl mb-1'}`}>
                    {slot.icon}
                  </div>
                  <p className={`font-semibold text-foreground whitespace-pre-line text-center ${accessibilityMode ? 'text-lg' : 'text-sm'}`}>
                    {formatTextWithLineBreaks(slot.label)}
                  </p>
                </div>

                {/* Placed Activity */}
                {placedActivity ? (
                  <div 
                    className={`
                      bg-white rounded-xl shadow-md p-3 cursor-pointer transition-transform duration-200
                      hover:scale-105 flex flex-col items-center gap-2
                      ${accessibilityMode ? 'p-4' : ''}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(placedActivity.id);
                      // Removed automatic speech - now only on demand
                    }}
                  >
                    <div className={accessibilityMode ? 'text-2xl' : 'text-xl'}>
                      {placedActivity.icon}
                    </div>
                    <p className={`text-center font-medium text-foreground leading-tight whitespace-pre-line ${accessibilityMode ? 'text-base' : 'text-xs'}`}>
                      {formatTextWithLineBreaks(placedActivity.name)}
                    </p>
                    <div className="text-red-500 text-xs opacity-70">
                      Cliquez pour retirer
                    </div>
                  </div>
                ) : (
                  <div className={`text-center text-muted-foreground ${accessibilityMode ? 'text-base' : 'text-sm'}`}>
                    {selectedActivity ? 'Cliquez pour placer!' : 'Glissez une activité ici'}
                  </div>
                )}

                {/* Drop Zone Animation */}
                {isDraggedOver && (
                  <div className="absolute inset-0 bg-primary/10 rounded-2xl animate-pulse pointer-events-none" />
                )}

                {/* Success Glow */}
                {placedActivity && (
                  <div className="absolute inset-0 bg-green-400/20 rounded-2xl animate-pulse pointer-events-none" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Indicator */}
      <div className="mt-6 flex justify-center">
        <div className="flex gap-2">
          {timeSlots.map((slot) => {
            const hasActivity = getPlacedActivity(slot.id);
            return (
              <div
                key={slot.id}
                className={`
                  w-3 h-3 rounded-full transition-colors duration-300
                  ${hasActivity ? 'bg-green-500' : 'bg-gray-200'}
                `}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};