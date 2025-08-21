
import React, { useState, useEffect } from 'react';
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

  // Effect pour s'assurer que la sélection est appliquée après le chargement initial des sous-tags
  // mais seulement lors du premier chargement, pas lors des changements de sélection
  useEffect(() => {
    console.log('🔍 SubActivitySelector - useEffect détecte changement:', {
      selectedSubTagId,
      subTagsCount: subTags.length,
      loading,
      subTagExists: selectedSubTagId ? subTags.some(tag => tag.id === selectedSubTagId) : false
    });
    
    // SEULEMENT valider lors du premier chargement des subTags, pas lors des changements manuels
    // Si on a un selectedSubTagId ET que c'est la première fois qu'on charge les subTags (non vides)
    // ET que l'ID sélectionné n'existe pas dans la liste, alors on le reset à null
    if (selectedSubTagId && !loading && subTags.length > 0) {
      const subTagExists = subTags.some(tag => tag.id === selectedSubTagId);
      
      // Seulement reset si c'est clairement un ID invalide/obsolète
      // On évite de reset pendant les changements normaux de sélection
      if (!subTagExists && activityType) {
        console.log('⚠️ SubActivitySelector - selectedSubTagId invalide détecté lors du chargement initial, reset à null');
        onSubTagChange(null);
      } else if (subTagExists) {
        console.log('✅ SubActivitySelector - selectedSubTagId trouvé dans les subTags');
      }
    }
  }, [subTags, loading, activityType]); // Retiré selectedSubTagId et onSubTagChange des dépendances

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
