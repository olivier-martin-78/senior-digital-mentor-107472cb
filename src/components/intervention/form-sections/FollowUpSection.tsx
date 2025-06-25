
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface FollowUpSectionProps {
  formData: any;
  setFormData: (data: any) => void;
}

export const FollowUpSection: React.FC<FollowUpSectionProps> = ({
  formData,
  setFormData
}) => {
  return (
    <>
      <div>
        <Label>Suivi nécessaire</Label>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="followUp1"
              checked={formData.followUp.includes('Contact médecin traitant')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  followUp: checked
                    ? [...formData.followUp, 'Contact médecin traitant']
                    : formData.followUp.filter((item) => item !== 'Contact médecin traitant'),
                })
              }
            />
            <Label htmlFor="followUp1">Contact médecin traitant</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="followUp2"
              checked={formData.followUp.includes('Contact famille')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  followUp: checked
                    ? [...formData.followUp, 'Contact famille']
                    : formData.followUp.filter((item) => item !== 'Contact famille'),
                })
              }
            />
            <Label htmlFor="followUp2">Contact famille</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="followUp3"
              checked={formData.followUp.includes('Mise en place de matériel')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  followUp: checked
                    ? [...formData.followUp, 'Mise en place de matériel']
                    : formData.followUp.filter((item) => item !== 'Mise en place de matériel'),
                })
              }
            />
            <Label htmlFor="followUp3">Mise en place de matériel</Label>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="followUpOther">Autres suivis</Label>
        <Textarea
          id="followUpOther"
          placeholder="Précisez les autres suivis nécessaires"
          value={formData.followUpOther || ''}
          onChange={(e) => setFormData({ ...formData, followUpOther: e.target.value })}
        />
      </div>
    </>
  );
};
