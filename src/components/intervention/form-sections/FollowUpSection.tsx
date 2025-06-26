
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { InterventionFormData } from '../types/FormData';

interface FollowUpSectionProps {
  formData: InterventionFormData;
  setFormData: (data: InterventionFormData | ((prev: InterventionFormData) => InterventionFormData)) => void;
}

export const FollowUpSection: React.FC<FollowUpSectionProps> = ({
  formData,
  setFormData
}) => {
  const followUpOptions = [
    'Surveillance médicale',
    'Kinésithérapie',
    'Suivi psychologique',
    'Adaptation du matériel',
    'Contact famille',
    'Contact médecin',
    'Réévaluation des besoins',
    'Formation aidant'
  ];

  const handleFollowUpChange = (option: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      follow_up: checked 
        ? [...(prev.follow_up || []), option]
        : (prev.follow_up || []).filter(item => item !== option)
    }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Suivi à prévoir</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {followUpOptions.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`follow_up_${option}`}
              checked={(formData.follow_up || []).includes(option)}
              onCheckedChange={(checked) => handleFollowUpChange(option, checked as boolean)}
            />
            <Label htmlFor={`follow_up_${option}`}>{option}</Label>
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="follow_up_other">Autres actions de suivi</Label>
        <Textarea
          id="follow_up_other"
          placeholder="Décrivez d'autres actions de suivi nécessaires"
          value={formData.follow_up_other || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, follow_up_other: e.target.value }))}
        />
      </div>
    </div>
  );
};
