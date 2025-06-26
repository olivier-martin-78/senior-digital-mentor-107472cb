
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { InterventionFormData } from '../types/FormData';

interface MentalStateSectionProps {
  formData: InterventionFormData;
  setFormData: (data: InterventionFormData | ((prev: InterventionFormData) => InterventionFormData)) => void;
}

export const MentalStateSection: React.FC<MentalStateSectionProps> = ({
  formData,
  setFormData
}) => {
  const mentalStateOptions = [
    'Calme',
    'Agité(e)',
    'Confus(e)',
    'Anxieux(se)',
    'Déprimé(e)',
    'Euphorique',
    'Agressif(ve)',
    'Coopératif(ve)'
  ];

  const handleMentalStateChange = (option: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      mental_state: checked 
        ? [...(prev.mental_state || []), option]
        : (prev.mental_state || []).filter(item => item !== option)
    }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">État mental</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {mentalStateOptions.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`mental_state_${option}`}
              checked={(formData.mental_state || []).includes(option)}
              onCheckedChange={(checked) => handleMentalStateChange(option, checked as boolean)}
            />
            <Label htmlFor={`mental_state_${option}`}>{option}</Label>
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="mental_state_change">Changements observés</Label>
        <Textarea
          id="mental_state_change"
          placeholder="Décrivez les changements observés dans l'état mental"
          value={formData.mental_state_change || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, mental_state_change: e.target.value }))}
        />
      </div>
    </div>
  );
};
