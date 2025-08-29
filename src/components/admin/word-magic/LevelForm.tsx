import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Save, X } from 'lucide-react';
import type { WordMagicLevel, GridCell } from '@/types/wordMagicGame';

interface LevelFormProps {
  level?: WordMagicLevel;
  onSubmit: (levelData: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const LevelForm = ({ level, onSubmit, onCancel, isSubmitting }: LevelFormProps) => {
  const [formData, setFormData] = useState({
    level_number: level?.level_number || 1,
    letters: level?.letters || '',
    difficulty: level?.difficulty || 'facile' as 'facile' | 'moyen' | 'difficile',
    solutions: level?.solutions || [''],
    bonus_words: level?.bonus_words || [''],
    grid_layout: level?.grid_layout || [[{ letter: '', x: 0, y: 0, isRevealed: false, wordIds: [], isBlocked: false }]] as GridCell[][],
  });

  const [errors, setErrors] = useState<string[]>([]);

  // Générer une grille vide basée sur les lettres
  const generateGridFromLetters = (letters: string) => {
    if (!letters) return [[{ letter: '', x: 0, y: 0, isRevealed: false, wordIds: [], isBlocked: false }]];
    
    const letterArray = letters.split(',').map(l => l.trim().toUpperCase());
    const gridSize = Math.ceil(Math.sqrt(letterArray.length));
    const newGrid: GridCell[][] = [];

    for (let y = 0; y < gridSize; y++) {
      const row: GridCell[] = [];
      for (let x = 0; x < gridSize; x++) {
        const index = y * gridSize + x;
        row.push({
          letter: index < letterArray.length ? letterArray[index] : '',
          x,
          y,
          isRevealed: false,
          wordIds: [],
          isBlocked: false
        });
      }
      newGrid.push(row);
    }

    return newGrid;
  };

  const handleLettersChange = (letters: string) => {
    setFormData(prev => ({
      ...prev,
      letters,
      grid_layout: generateGridFromLetters(letters)
    }));
  };

  const handleGridCellChange = (rowIndex: number, cellIndex: number, letter: string) => {
    const newGrid = formData.grid_layout.map((row, rIdx) =>
      rIdx === rowIndex
        ? row.map((cell, cIdx) =>
            cIdx === cellIndex ? { ...cell, letter: letter.toUpperCase() } : cell
          )
        : row
    );
    setFormData(prev => ({ ...prev, grid_layout: newGrid }));
  };

  const addGridRow = () => {
    const newRowIndex = formData.grid_layout.length;
    const newRow = formData.grid_layout[0].map((_, x) => ({
      letter: '',
      x,
      y: newRowIndex,
      isRevealed: false,
      wordIds: [],
      isBlocked: false
    }));
    setFormData(prev => ({
      ...prev,
      grid_layout: [...prev.grid_layout, newRow]
    }));
  };

  const removeGridRow = () => {
    if (formData.grid_layout.length > 1) {
      setFormData(prev => ({
        ...prev,
        grid_layout: prev.grid_layout.slice(0, -1)
      }));
    }
  };

  const addGridColumn = () => {
    const newGrid = formData.grid_layout.map((row, y) => [
      ...row,
      { letter: '', x: row.length, y, isRevealed: false, wordIds: [], isBlocked: false }
    ]);
    setFormData(prev => ({ ...prev, grid_layout: newGrid }));
  };

  const removeGridColumn = () => {
    if (formData.grid_layout[0]?.length > 1) {
      const newGrid = formData.grid_layout.map(row => row.slice(0, -1));
      setFormData(prev => ({ ...prev, grid_layout: newGrid }));
    }
  };

  const handleArrayFieldChange = (field: 'solutions' | 'bonus_words', index: number, value: string) => {
    const newArray = [...formData[field]];
    newArray[index] = value.toUpperCase();
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayField = (field: 'solutions' | 'bonus_words') => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeArrayField = (field: 'solutions' | 'bonus_words', index: number) => {
    if (formData[field].length > 1) {
      const newArray = formData[field].filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, [field]: newArray }));
    }
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (formData.level_number < 1) {
      newErrors.push('Le numéro de niveau doit être supérieur à 0');
    }

    if (!formData.letters.trim()) {
      newErrors.push('Les lettres sont obligatoires');
    }

    if (formData.solutions.filter(s => s.trim()).length === 0) {
      newErrors.push('Au moins une solution est requise');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const submitData = {
        ...formData,
        solutions: formData.solutions.filter(s => s.trim()),
        bonus_words: formData.bonus_words.filter(s => s.trim()),
      };
      
      if (level) {
        onSubmit({ ...submitData, id: level.id });
      } else {
        onSubmit(submitData);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <ul className="list-disc list-inside text-destructive space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informations de base */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de base</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="level_number">Numéro de niveau</Label>
              <Input
                id="level_number"
                type="number"
                min="1"
                value={formData.level_number}
                onChange={(e) => setFormData(prev => ({ ...prev, level_number: parseInt(e.target.value) || 1 }))}
              />
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulté</Label>
              <Select
                value={formData.difficulty}
                onValueChange={(value: 'facile' | 'moyen' | 'difficile') => 
                  setFormData(prev => ({ ...prev, difficulty: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="facile">Facile</SelectItem>
                  <SelectItem value="moyen">Moyen</SelectItem>
                  <SelectItem value="difficile">Difficile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="letters">Lettres disponibles (séparées par des virgules)</Label>
              <Textarea
                id="letters"
                placeholder="T,E,R,R,E"
                value={formData.letters}
                onChange={(e) => handleLettersChange(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Exemple: T,E,R,R,E pour le mot TERRE
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Grille interactive */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Grille de lettres
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={addGridRow}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={removeGridRow}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={addGridColumn}>
                  <Plus className="h-4 w-4" />
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={removeGridColumn}>
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-1 p-4 bg-muted rounded-lg">
              {formData.grid_layout.map((row, rowIndex) => (
                <div key={rowIndex} className="flex gap-1 justify-center">
                  {row.map((cell, cellIndex) => (
                    <Input
                      key={`${rowIndex}-${cellIndex}`}
                      value={cell.letter}
                      onChange={(e) => handleGridCellChange(rowIndex, cellIndex, e.target.value)}
                      className="w-12 h-12 text-center font-bold text-lg"
                      maxLength={1}
                    />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Solutions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Solutions (mots principaux)
              <Button type="button" size="sm" variant="outline" onClick={() => addArrayField('solutions')}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {formData.solutions.map((solution, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={solution}
                  onChange={(e) => handleArrayFieldChange('solutions', index, e.target.value)}
                  placeholder="MOT"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => removeArrayField('solutions', index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Mots bonus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Mots bonus (optionnels)
              <Button type="button" size="sm" variant="outline" onClick={() => addArrayField('bonus_words')}>
                <Plus className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {formData.bonus_words.map((bonus, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={bonus}
                  onChange={(e) => handleArrayFieldChange('bonus_words', index, e.target.value)}
                  placeholder="MOT BONUS"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => removeArrayField('bonus_words', index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          <Save className="h-4 w-4 mr-2" />
          {level ? 'Modifier' : 'Créer'} le niveau
        </Button>
      </div>
    </form>
  );
};