
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface MentalStateSectionProps {
  formData: any;
  setFormData: (data: any) => void;
}

export const MentalStateSection: React.FC<MentalStateSectionProps> = ({
  formData,
  setFormData
}) => {
  return (
    <>
      <div>
        <Label>État mental</Label>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mentalState1"
              checked={formData.mentalState.includes('Alerte')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  mentalState: checked
                    ? [...formData.mentalState, 'Alerte']
                    : formData.mentalState.filter((item) => item !== 'Alerte'),
                })
              }
            />
            <Label htmlFor="mentalState1">Alerte</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mentalState2"
              checked={formData.mentalState.includes('Confus')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  mentalState: checked
                    ? [...formData.mentalState, 'Confus']
                    : formData.mentalState.filter((item) => item !== 'Confus'),
                })
              }
            />
            <Label htmlFor="mentalState2">Confus</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mentalState3"
              checked={formData.mentalState.includes('Anxieux')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  mentalState: checked
                    ? [...formData.mentalState, 'Anxieux']
                    : formData.mentalState.filter((item) => item !== 'Anxieux'),
                })
              }
            />
            <Label htmlFor="mentalState3">Anxieux</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="mentalState4"
              checked={formData.mentalState.includes('Agité')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  mentalState: checked
                    ? [...formData.mentalState, 'Agité']
                    : formData.mentalState.filter((item) => item !== 'Agité'),
                })
              }
            />
            <Label htmlFor="mentalState4">Agité</Label>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="mentalStateChange">Changements état mental</Label>
        <Textarea
          id="mentalStateChange"
          placeholder="Décrivez les changements d'état mental"
          value={formData.mentalStateChange || ''}
          onChange={(e) => setFormData({ ...formData, mentalStateChange: e.target.value })}
        />
      </div>
    </>
  );
};
