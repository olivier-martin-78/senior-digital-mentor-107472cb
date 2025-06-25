
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface HygieneSectionProps {
  formData: any;
  setFormData: (data: any) => void;
}

export const HygieneSection: React.FC<HygieneSectionProps> = ({
  formData,
  setFormData
}) => {
  return (
    <>
      <div>
        <Label>Hygiène</Label>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hygiene1"
              checked={formData.hygiene.includes('Réalisée')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  hygiene: checked
                    ? [...formData.hygiene, 'Réalisée']
                    : formData.hygiene.filter((item) => item !== 'Réalisée'),
                })
              }
            />
            <Label htmlFor="hygiene1">Réalisée</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hygiene2"
              checked={formData.hygiene.includes('Partielle')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  hygiene: checked
                    ? [...formData.hygiene, 'Partielle']
                    : formData.hygiene.filter((item) => item !== 'Partielle'),
                })
              }
            />
            <Label htmlFor="hygiene2">Partielle</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hygiene3"
              checked={formData.hygiene.includes('Refusée')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  hygiene: checked
                    ? [...formData.hygiene, 'Refusée']
                    : formData.hygiene.filter((item) => item !== 'Refusée'),
                })
              }
            />
            <Label htmlFor="hygiene3">Refusée</Label>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="hygieneComments">Commentaires hygiène</Label>
        <Textarea
          id="hygieneComments"
          placeholder="Ajoutez des commentaires sur l'hygiène"
          value={formData.hygieneComments || ''}
          onChange={(e) => setFormData({ ...formData, hygieneComments: e.target.value })}
        />
      </div>
    </>
  );
};
