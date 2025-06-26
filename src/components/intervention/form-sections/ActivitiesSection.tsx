
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { InterventionFormData } from '../types/FormData';

interface ActivitiesSectionProps {
  formData: InterventionFormData;
  setFormData: (data: InterventionFormData | ((prev: InterventionFormData) => InterventionFormData)) => void;
}

export const ActivitiesSection: React.FC<ActivitiesSectionProps> = ({
  formData,
  setFormData
}) => {
  const activitiesOptions = [
    'Aide à la toilette',
    'Aide aux repas',
    'Aide à la mobilité',
    'Accompagnement sorties',
    'Activités ludiques',
    'Lecture',
    'Conversation',
    'Exercices physiques',
    'Aide administrative',
    'Ménage léger'
  ];

  const handleActivityChange = (option: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      activities: checked 
        ? [...(prev.activities || []), option]
        : (prev.activities || []).filter(item => item !== option)
    }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Activités réalisées</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {activitiesOptions.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`activity_${option}`}
              checked={(formData.activities || []).includes(option)}
              onCheckedChange={(checked) => handleActivityChange(option, checked as boolean)}
            />
            <Label htmlFor={`activity_${option}`}>{option}</Label>
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="activities_other">Autres activités</Label>
        <Textarea
          id="activities_other"
          placeholder="Décrivez d'autres activités réalisées"
          value={formData.activities_other || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, activities_other: e.target.value }))}
        />
      </div>
    </div>
  );
};
