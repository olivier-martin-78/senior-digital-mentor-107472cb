
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface PhysicalStateSectionProps {
  formData: any;
  setFormData: (data: any) => void;
}

export const PhysicalStateSection: React.FC<PhysicalStateSectionProps> = ({
  formData,
  setFormData
}) => {
  return (
    <>
      <div>
        <Label>État physique</Label>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="physicalState1"
              checked={formData.physicalState.includes('Stable')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  physicalState: checked
                    ? [...formData.physicalState, 'Stable']
                    : formData.physicalState.filter((item) => item !== 'Stable'),
                })
              }
            />
            <Label htmlFor="physicalState1">Stable</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="physicalState2"
              checked={formData.physicalState.includes('Fatigue')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  physicalState: checked
                    ? [...formData.physicalState, 'Fatigue']
                    : formData.physicalState.filter((item) => item !== 'Fatigue'),
                })
              }
            />
            <Label htmlFor="physicalState2">Fatigue</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="physicalState3"
              checked={formData.physicalState.includes('Douleur')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  physicalState: checked
                    ? [...formData.physicalState, 'Douleur']
                    : formData.physicalState.filter((item) => item !== 'Douleur'),
                })
              }
            />
            <Label htmlFor="physicalState3">Douleur</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="physicalState4"
              checked={formData.physicalState.includes('Difficulté respiratoire')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  physicalState: checked
                    ? [...formData.physicalState, 'Difficulté respiratoire']
                    : formData.physicalState.filter((item) => item !== 'Difficulté respiratoire'),
                })
              }
            />
            <Label htmlFor="physicalState4">Difficulté respiratoire</Label>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="physicalStateOther">Autres détails état physique</Label>
        <Textarea
          id="physicalStateOther"
          placeholder="Précisez l'état physique"
          value={formData.physicalStateOther || ''}
          onChange={(e) => setFormData({ ...formData, physicalStateOther: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="painLocation">Localisation de la douleur</Label>
        <Input
          type="text"
          id="painLocation"
          placeholder="Si douleur, précisez la localisation"
          value={formData.painLocation || ''}
          onChange={(e) => setFormData({ ...formData, painLocation: e.target.value })}
        />
      </div>
    </>
  );
};
