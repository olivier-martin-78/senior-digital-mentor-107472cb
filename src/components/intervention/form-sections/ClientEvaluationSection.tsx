
import React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

interface ClientEvaluationSectionProps {
  formData: any;
  setFormData: (data: any) => void;
}

export const ClientEvaluationSection: React.FC<ClientEvaluationSectionProps> = ({
  formData,
  setFormData
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="clientRating">Évaluation du client</Label>
        <Slider
          defaultValue={[formData.clientRating || 3]}
          max={5}
          min={1}
          step={1}
          onValueChange={(value) => setFormData({ ...formData, clientRating: value[0] })}
        />
        <p className="text-sm text-muted-foreground">
          Note actuelle: {formData.clientRating} / 5
        </p>
      </div>

      <div>
        <Label htmlFor="clientComments">Commentaires du client</Label>
        <Textarea
          id="clientComments"
          placeholder="Ajoutez des commentaires sur le client"
          value={formData.clientComments || ''}
          onChange={(e) => setFormData({ ...formData, clientComments: e.target.value })}
        />
      </div>
    </>
  );
};
