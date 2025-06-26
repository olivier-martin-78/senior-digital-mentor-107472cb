
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { InterventionFormData } from '../types/FormData';

interface NutritionSectionProps {
  formData: InterventionFormData;
  setFormData: (data: InterventionFormData | ((prev: InterventionFormData) => InterventionFormData)) => void;
}

export const NutritionSection: React.FC<NutritionSectionProps> = ({
  formData,
  setFormData
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Nutrition et hydratation</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="appetite">Appétit</Label>
          <Select 
            value={formData.appetite || ''} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, appetite: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner l'appétit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bon">Bon</SelectItem>
              <SelectItem value="Moyen">Moyen</SelectItem>
              <SelectItem value="Faible">Faible</SelectItem>
              <SelectItem value="Aucun">Aucun</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="hydration">Hydratation</Label>
          <Select 
            value={formData.hydration || ''} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, hydration: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner l'hydratation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Correcte">Correcte</SelectItem>
              <SelectItem value="Insuffisante">Insuffisante</SelectItem>
              <SelectItem value="Refus">Refus</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="appetite_comments">Commentaires sur l'alimentation</Label>
        <Textarea
          id="appetite_comments"
          placeholder="Ajoutez des commentaires sur l'alimentation et l'hydratation"
          value={formData.appetite_comments || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, appetite_comments: e.target.value }))}
        />
      </div>
    </div>
  );
};
