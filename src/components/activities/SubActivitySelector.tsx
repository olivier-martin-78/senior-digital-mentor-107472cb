
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActivitySubTags } from '@/hooks/useActivitySubTags';
import { Plus, X } from 'lucide-react';

interface SubActivitySelectorProps {
  selectedSubTagId?: string;
  onSubTagChange: (subTagId: string | null) => void;
}

const SubActivitySelector: React.FC<SubActivitySelectorProps> = ({
  selectedSubTagId,
  onSubTagChange
}) => {
  const { subTags, loading, createSubTag } = useActivitySubTags();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateSubTag = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Empêcher la propagation vers le formulaire parent
    
    if (!newTagName.trim()) return;

    setCreating(true);
    const newTag = await createSubTag(newTagName.trim());
    if (newTag) {
      onSubTagChange(newTag.id);
      setNewTagName('');
      setShowCreateForm(false);
    }
    setCreating(false);
  };

  const handleCancelCreate = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation(); // Empêcher la propagation vers le formulaire parent
    }
    setNewTagName('');
    setShowCreateForm(false);
  };

  const handleShowCreateForm = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Empêcher la propagation vers le formulaire parent
    setShowCreateForm(true);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="sub-activity">Sous-activité (optionnel)</Label>
      
      {!showCreateForm ? (
        <div className="flex gap-2">
          <Select
            value={selectedSubTagId || 'none'}
            onValueChange={(value) => onSubTagChange(value === 'none' ? null : value)}
            disabled={loading}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Sélectionnez une sous-activité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Aucune sous-activité</SelectItem>
              {subTags.map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleShowCreateForm}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Créer
          </Button>
        </div>
      ) : (
        <form onSubmit={handleCreateSubTag} className="flex gap-2">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Nom de la sous-activité"
            disabled={creating}
            className="flex-1"
          />
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={creating || !newTagName.trim()}
          >
            {creating ? 'Création...' : 'Créer'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCancelCreate}
            disabled={creating}
          >
            <X className="h-4 w-4" />
          </Button>
        </form>
      )}
    </div>
  );
};

export default SubActivitySelector;
