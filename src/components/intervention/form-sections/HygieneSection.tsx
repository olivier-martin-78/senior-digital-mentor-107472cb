
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { InterventionFormData } from '../types/FormData';

interface HygieneSectionProps {
  formData: InterventionFormData;
  setFormData: (data: InterventionFormData | ((prev: InterventionFormData) => InterventionFormData)) => void;
}

export const HygieneSection: React.FC<HygieneSectionProps> = ({
  formData,
  setFormData
}) => {
  const hygieneOptions = [
    'Toilette complète',
    'Toilette partielle',
    'Douche/Bain',
    'Soins bucco-dentaires',
    'Coiffage',
    'Habillage/Déshabillage',
    'Change',
    'Soins des ongles'
  ];

  const handleHygieneChange = (option: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      hygiene: checked 
        ? [...(prev.hygiene || []), option]
        : (prev.hygiene || []).filter(item => item !== option)
    }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Hygiène et soins</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {hygieneOptions.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`hygiene_${option}`}
              checked={(formData.hygiene || []).includes(option)}
              onCheckedChange={(checked) => handleHygieneChange(option, checked as boolean)}
            />
            <Label htmlFor={`hygiene_${option}`}>{option}</Label>
          </div>
        ))}
      </div>

      <div>
        <Label htmlFor="hygiene_comments">Commentaires sur l'hygiène</Label>
        <Textarea
          id="hygiene_comments"
          placeholder="Ajoutez des commentaires sur les soins d'hygiène"
          value={formData.hygiene_comments || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, hygiene_comments: e.target.value }))}
        />
      </div>
    </div>
  );
};
