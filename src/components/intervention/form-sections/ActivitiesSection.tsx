
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface ActivitiesSectionProps {
  formData: any;
  setFormData: (data: any) => void;
}

export const ActivitiesSection: React.FC<ActivitiesSectionProps> = ({
  formData,
  setFormData
}) => {
  return (
    <>
      <div>
        <Label>Activités réalisées</Label>
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="activity1"
              checked={formData.activities.includes('Toilette')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  activities: checked
                    ? [...formData.activities, 'Toilette']
                    : formData.activities.filter((item) => item !== 'Toilette'),
                })
              }
            />
            <Label htmlFor="activity1">Toilette</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="activity2"
              checked={formData.activities.includes('Préparation des repas')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  activities: checked
                    ? [...formData.activities, 'Préparation des repas']
                    : formData.activities.filter((item) => item !== 'Préparation des repas'),
                })
              }
            />
            <Label htmlFor="activity2">Préparation des repas</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="activity3"
              checked={formData.activities.includes('Aide à la mobilité')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  activities: checked
                    ? [...formData.activities, 'Aide à la mobilité']
                    : formData.activities.filter((item) => item !== 'Aide à la mobilité'),
                })
              }
            />
            <Label htmlFor="activity3">Aide à la mobilité</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="activity4"
              checked={formData.activities.includes('Surveillance de la prise de médicaments')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  activities: checked
                    ? [...formData.activities, 'Surveillance de la prise de médicaments']
                    : formData.activities.filter((item) => item !== 'Surveillance de la prise de médicaments'),
                })
              }
            />
            <Label htmlFor="activity4">Surveillance de la prise de médicaments</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="activity5"
              checked={formData.activities.includes('Compagnie et conversation')}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  activities: checked
                    ? [...formData.activities, 'Compagnie et conversation']
                    : formData.activities.filter((item) => item !== 'Compagnie et conversation'),
                })
              }
            />
            <Label htmlFor="activity5">Compagnie et conversation</Label>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="activitiesOther">Autres activités</Label>
        <Textarea
          id="activitiesOther"
          placeholder="Précisez les autres activités réalisées"
          value={formData.activitiesOther || ''}
          onChange={(e) => setFormData({ ...formData, activitiesOther: e.target.value })}
        />
      </div>
    </>
  );
};
