
import React from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';

interface MoodSelectorProps {
  form: UseFormReturn<any>;
  disabled?: boolean;
}

const MoodSelector: React.FC<MoodSelectorProps> = ({ form, disabled = false }) => {
  const moodOptions = [
    { value: 1, emoji: '😢', label: 'Très difficile' },
    { value: 2, emoji: '😔', label: 'Difficile' },
    { value: 3, emoji: '😐', label: 'Neutre' },
    { value: 4, emoji: '😊', label: 'Bonne' },
    { value: 5, emoji: '😄', label: 'Excellente' }
  ];

  return (
    <FormField
      control={form.control}
      name="mood_rating"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Humeur générale</FormLabel>
          <FormControl>
            <div className="grid grid-cols-5 gap-2">
              {moodOptions.map((mood) => (
                <button
                  key={mood.value}
                  type="button"
                  className={`
                    flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                    ${field.value === mood.value 
                      ? 'border-tranches-sage bg-tranches-sage/10 scale-105' 
                      : 'border-gray-200 hover:border-tranches-sage/50 hover:bg-gray-50'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  onClick={() => !disabled && field.onChange(mood.value)}
                  disabled={disabled}
                >
                  <span className="text-4xl mb-1">{mood.emoji}</span>
                  <span className="text-xs text-center font-medium text-gray-700">
                    {mood.label}
                  </span>
                </button>
              ))}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default MoodSelector;
