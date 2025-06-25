
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface NutritionSectionProps {
  formData: any;
  setFormData: (data: any) => void;
}

export const NutritionSection: React.FC<NutritionSectionProps> = ({
  formData,
  setFormData
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="appetite">Appétit</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, appetite: value })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner" defaultValue={formData.appetite || undefined} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bon">Bon</SelectItem>
              <SelectItem value="Moyen">Moyen</SelectItem>
              <SelectItem value="Faible">Faible</SelectItem>
              <SelectItem value="Nul">Nul</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="hydration">Hydratation</Label>
          <Select onValueChange={(value) => setFormData({ ...formData, hydration: value })}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sélectionner" defaultValue={formData.hydration || undefined} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Normale">Normale</SelectItem>
              <SelectItem value="Faible">Faible</SelectItem>
              <SelectItem value="Nulle">Nulle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="appetiteComments">Commentaires appétit</Label>
        <Textarea
          id="appetiteComments"
          placeholder="Ajoutez des commentaires sur l'appétit"
          value={formData.appetiteComments || ''}
          onChange={(e) => setFormData({ ...formData, appetiteComments: e.target.value })}
        />
      </div>
    </>
  );
};
