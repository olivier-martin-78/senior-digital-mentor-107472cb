import React from 'react';
import { SpatialSlot, PlacedItem, ActivityItem } from '@/types/cognitivePuzzle';

interface SpatialMapProps {
  spatialSlots: SpatialSlot[];
  placedItems: PlacedItem[];
  activities: ActivityItem[];
  selectedActivity: string | null;
  accessibilityMode: boolean;
  scenario: 'home' | 'city';
  onDrop: (spatialSlotId: string, activityId: string) => void;
  onPlaceSelected: (spatialSlotId: string) => void;
  onRemove: (activityId: string) => void;
  onSpeak: (text: string) => void;
}

export const SpatialMap: React.FC<SpatialMapProps> = ({
  spatialSlots,
  placedItems,
  activities,
  selectedActivity,
  accessibilityMode,
  scenario,
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
    const placement = placedItems.find(item => item.spatialSlotId === slotId);
    if (!placement) return null;
    return activities.find(activity => activity.id === placement.activityId);
  };

  const getBackgroundStyle = () => {
    return scenario === 'home' 
      ? 'bg-gradient-to-br from-amber-50 to-orange-50' 
      : 'bg-gradient-to-br from-sky-50 to-blue-50';
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/20">
      <div className="flex items-center gap-4 mb-6">
        <div className="text-3xl">{scenario === 'home' ? '🏠' : '🏙️'}</div>
        <h3 className={`font-bold text-foreground ${accessibilityMode ? 'text-2xl' : 'text-xl'}`}>
          {scenario === 'home' ? 'Plan de la maison' : 'Plan du quartier'}
        </h3>
      </div>

      {/* Interactive Map */}
      <div className={`
        relative ${getBackgroundStyle()} rounded-2xl border-2 border-dashed border-primary/20
        transition-all duration-300 overflow-hidden
        ${accessibilityMode ? 'min-h-[500px]' : 'min-h-[400px]'}
      `}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-grid-pattern" />
        </div>

        {/* Spatial Slots */}
        {spatialSlots.map((slot) => {
          const placedActivity = getPlacedActivity(slot.id);
          const isDraggedOver = dragOver === slot.id;

          return (
            <div
              key={slot.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${slot.x}%`,
                top: `${slot.y}%`,
              }}
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
              <div className={`
                bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg 
                border-2 border-dashed transition-all duration-300
                flex flex-col items-center justify-center cursor-pointer
                hover:shadow-xl hover:scale-105 hover:bg-white/90
                ${isDraggedOver ? 'border-primary bg-primary/10 scale-110' : 'border-gray-300'}
                ${placedActivity ? 'border-solid border-green-400 bg-green-50/90' : ''}
                ${selectedActivity && !placedActivity ? 'border-primary bg-primary/5 ring-2 ring-primary ring-opacity-30' : ''}
                ${accessibilityMode ? 'min-w-[140px] min-h-[120px] p-4' : 'min-w-[120px] min-h-[100px] p-3'}
              `}>
                {/* Location Icon & Label */}
                <div className="text-center mb-2">
                  <div className={`${accessibilityMode ? 'text-3xl mb-2' : 'text-2xl mb-1'}`}>
                    {slot.icon}
                  </div>
                  <p className={`font-semibold text-foreground leading-tight ${accessibilityMode ? 'text-sm' : 'text-xs'}`}>
                    {slot.label}
                  </p>
                </div>

                {/* Placed Activity */}
                {placedActivity ? (
                  <div 
                    className={`
                      bg-white rounded-lg shadow-sm p-2 cursor-pointer transition-transform duration-200
                      hover:scale-105 flex flex-col items-center gap-1
                      ${accessibilityMode ? 'p-3' : ''}
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(placedActivity.id);
                      // Removed automatic speech - now only on demand
                    }}
                  >
                    <div className={accessibilityMode ? 'text-lg' : 'text-base'}>
                      {placedActivity.icon}
                    </div>
                    <p className={`text-center font-medium text-foreground leading-tight ${accessibilityMode ? 'text-xs' : 'text-[10px]'}`}>
                      {placedActivity.name.split(' ')[0]}
                    </p>
                  </div>
                ) : (
                  <div className={`text-center text-muted-foreground ${accessibilityMode ? 'text-xs' : 'text-[10px]'}`}>
                    {selectedActivity ? 'Cliquez pour placer!' : 'Zone libre'}
                  </div>
                )}

                {/* Drop Zone Animation */}
                {isDraggedOver && (
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl animate-pulse pointer-events-none" />
                )}

                {/* Success Glow */}
                {placedActivity && (
                  <div className="absolute inset-0 bg-green-400/30 rounded-2xl animate-pulse pointer-events-none" />
                )}
              </div>
            </div>
          );
        })}

        {/* Map Decorations */}
        {scenario === 'home' && (
          <>
            <div className="absolute top-4 left-4 text-amber-600/30 text-6xl pointer-events-none">🏠</div>
            <div className="absolute bottom-4 right-4 text-green-600/30 text-4xl pointer-events-none">🌳</div>
          </>
        )}
        
        {scenario === 'city' && (
          <>
            <div className="absolute top-4 left-4 text-sky-600/30 text-6xl pointer-events-none">🏙️</div>
            <div className="absolute bottom-4 right-4 text-gray-600/30 text-4xl pointer-events-none">🚗</div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600/20 text-8xl pointer-events-none">🗺️</div>
          </>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="mt-6 flex justify-center">
        <div className="flex gap-2">
          {spatialSlots.map((slot) => {
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