
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { InterventionFormData } from '../types/FormData';

interface PhysicalStateSectionProps {
  formData: InterventionFormData;
  setFormData: (data: InterventionFormData | ((prev: InterventionFormData) => InterventionFormData)) => void;
}

export const PhysicalStateSection: React.FC<PhysicalStateSectionProps> = ({
  formData,
  setFormData
}) => {
  const physicalStateOptions = [
    'Bon état général',
    'Fatigue',
    'Douleurs',
    'Difficultés respiratoires',
    'Troubles de la mobilité',
    'Chutes',
    'Plaies/Escarres',
    'Fièvre'
  ];

  const handlePhysicalStateChange = (option: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      physical_state: checked 
        ? [...(prev.physical_state || []), option]
        : (prev.physical_state || []).filter(item => item !== option)
    }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">État physique</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {physicalStateOptions.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`physical_state_${option}`}
              checked={(formData.physical_state || []).includes(option)}
              onCheckedChange={(checked) => handlePhysicalStateChange(option, checked as boolean)}
            />
            <Label htmlFor={`physical_state_${option}`}>{option}</Label>
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="physical_state_other">Autres observations physiques</Label>
        <Textarea
          id="physical_state_other"
          placeholder="Décrivez d'autres observations sur l'état physique"
          value={formData.physical_state_other || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, physical_state_other: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="pain_location">Localisation des douleurs</Label>
        <Input
          id="pain_location"
          placeholder="Indiquez la localisation des douleurs si applicable"
          value={formData.pain_location || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, pain_location: e.target.value }))}
        />
      </div>
    </div>
  );
};
