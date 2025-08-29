import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useWordMagicDB } from '@/hooks/useWordMagicDB';
import { useWordMagicAdmin } from '@/hooks/useWordMagicAdmin';
import { LevelsTable } from '@/components/admin/word-magic/LevelsTable';
import { LevelForm } from '@/components/admin/word-magic/LevelForm';
import { LevelPreview } from '@/components/admin/word-magic/LevelPreview';
import type { WordMagicLevel } from '@/types/wordMagicGame';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export default function AdminWordMagicLevels() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedLevel, setSelectedLevel] = useState<WordMagicLevel | null>(null);

  const { levels, isLoading } = useWordMagicDB();
  const { 
    createLevel, 
    updateLevel, 
    deleteLevel, 
    isSubmitting, 
    isDeleting 
  } = useWordMagicAdmin();

  const handleCreate = () => {
    setSelectedLevel(null);
    setViewMode('create');
  };

  const handleEdit = (level: WordMagicLevel) => {
    setSelectedLevel(level);
    setViewMode('edit');
  };

  const handleView = (level: WordMagicLevel) => {
    setSelectedLevel(level);
    setViewMode('view');
  };

  const handleDelete = async (levelId: string) => {
    await deleteLevel(levelId);
  };

  const handleSubmit = async (levelData: any) => {
    try {
      if (viewMode === 'create') {
        await createLevel(levelData);
      } else if (viewMode === 'edit' && selectedLevel) {
        await updateLevel({ ...levelData, id: selectedLevel.id });
      }
      setViewMode('list');
      setSelectedLevel(null);
    } catch (error) {
      console.error('Error submitting level:', error);
    }
  };

  const handleCancel = () => {
    setViewMode('list');
    setSelectedLevel(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const getTitle = () => {
    switch (viewMode) {
      case 'create': return 'Créer un nouveau niveau';
      case 'edit': return `Modifier le niveau ${selectedLevel?.level_number}`;
      case 'view': return `Détail du niveau ${selectedLevel?.level_number}`;
      default: return 'Administration - La magie des mots';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        {viewMode !== 'list' && (
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold">{getTitle()}</h1>
          <p className="text-muted-foreground">
            {viewMode === 'list' 
              ? 'Gérez les niveaux du jeu "La magie des mots"'
              : viewMode === 'create'
              ? 'Créez un nouveau niveau avec des mots et une grille personnalisée'
              : viewMode === 'edit'
              ? 'Modifiez les paramètres de ce niveau'
              : 'Aperçu détaillé du niveau'
            }
          </p>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' && (
        <LevelsTable
          levels={levels}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          onCreate={handleCreate}
          isDeleting={isDeleting}
        />
      )}

      {(viewMode === 'create' || viewMode === 'edit') && (
        <Card>
          <CardContent className="pt-6">
            <LevelForm
              level={selectedLevel}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      )}

      {viewMode === 'view' && selectedLevel && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LevelPreview level={selectedLevel} />
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold">Actions</h3>
              <div className="flex gap-2">
                <Button onClick={() => handleEdit(selectedLevel)}>
                  Modifier ce niveau
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleDelete(selectedLevel.id)}
                  disabled={isDeleting}
                >
                  Supprimer ce niveau
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}