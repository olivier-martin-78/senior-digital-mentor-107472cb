
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useActivitySubTags } from '@/hooks/useActivitySubTags';
import { Plus, X } from 'lucide-react';

interface SubActivitySelectorProps {
  activityType?: string;
  selectedSubTagId?: string;
  onSubTagChange: (subTagId: string | null) => void;
}

const SubActivitySelector: React.FC<SubActivitySelectorProps> = ({
  activityType,
  selectedSubTagId,
  onSubTagChange
}) => {
  console.log('🔍 SubActivitySelector - Props reçues:', {
    activityType,
    selectedSubTagId,
    hasOnSubTagChange: !!onSubTagChange
  });

  const { subTags, loading, createSubTag } = useActivitySubTags(activityType);
  
  console.log('🔍 SubActivitySelector - SubTags disponibles:', {
    subTags: subTags.map(tag => ({ id: tag.id, name: tag.name })),
    loading,
    selectedSubTagId
  });

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateSubTag = async () => {
    if (!newTagName.trim() || !activityType) return;

    setCreating(true);
    const newTag = await createSubTag(newTagName.trim(), activityType);
    if (newTag) {
      onSubTagChange(newTag.id);
      setNewTagName('');
      setShowCreateForm(false);
    }
    setCreating(false);
  };

  const handleCancelCreate = () => {
    setNewTagName('');
    setShowCreateForm(false);
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateSubTag();
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="sub-activity">Sous-activité (optionnel)</Label>
      
      {!showCreateForm ? (
        <div className="flex gap-2">
          <Select
            value={selectedSubTagId || 'none'}
            onValueChange={(value) => {
              console.log('🔍 SubActivitySelector - Select onValueChange:', {
                newValue: value,
                oldSelectedSubTagId: selectedSubTagId,
                willCall: value === 'none' ? 'null' : value
              });
              onSubTagChange(value === 'none' ? null : value);
            }}
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
            disabled={!activityType}
          >
            <Plus className="h-4 w-4" />
            Créer
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nom de la sous-activité"
            disabled={creating}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCreateSubTag}
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
        </div>
      )}
    </div>
  );
};

export default SubActivitySelector;
