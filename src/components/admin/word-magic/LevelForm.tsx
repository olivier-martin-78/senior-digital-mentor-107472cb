import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, Save, X, AlertTriangle } from 'lucide-react';
import type { WordMagicLevel, GridCell } from '@/types/wordMagicGame';
import { useWordMagicAdmin } from '@/hooks/useWordMagicAdmin';
import { GridGenerator } from '@/utils/gridGenerator';

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
  const [warnings, setWarnings] = useState<string[]>([]);
  const [previewGrid, setPreviewGrid] = useState<any>(null);
  
  const { validateLevel } = useWordMagicAdmin();

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

  const validateFormAndCheckParasites = () => {
    const newErrors: string[] = [];
    const newWarnings: string[] = [];
    
    if (!formData.level_number || formData.level_number < 1) {
      newErrors.push('Le numéro de niveau doit être supérieur à 0');
    }
    
    if (!formData.letters.trim()) {
      newErrors.push('Les lettres disponibles sont requises');
    }
    
    const solutions = formData.solutions.filter(s => s.trim());
    if (solutions.length === 0) {
      newErrors.push('Au moins un mot solution est requis');
    }
    
    // Validation with the hook
    const validationErrors = validateLevel({
      letters: formData.letters,
      grid_layout: formData.grid_layout,
      solutions: formData.solutions.filter(s => s.trim()),
      bonus_words: formData.bonus_words.filter(s => s.trim())
    });
    
    newErrors.push(...validationErrors);

    // Check for parasitic words if we have solutions
    if (solutions.length > 0) {
      try {
        const bonusWords = formData.bonus_words.filter(s => s.trim());
        const allWords = [...solutions, ...bonusWords];
        
        // Generate a test grid to check for parasitic words
        const testGrid = GridGenerator.generateGrid(solutions, bonusWords);
        const parasiticWords = GridGenerator.detectParasiticWords(testGrid, allWords);
        
        if (parasiticWords.length > 0) {
          newWarnings.push(`Mots parasites détectés dans la grille générée: ${parasiticWords.join(', ')}`);
          newWarnings.push('Ces mots apparaissent dans la grille mais ne font pas partie des solutions ou mots bonus.');
        }
        
        // Update preview grid
        setPreviewGrid(testGrid);
      } catch (error) {
        newWarnings.push('Impossible de générer la grille de prévisualisation');
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);
    return newErrors.length === 0;
  };

  const validateForm = () => {
    return validateFormAndCheckParasites();
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

  // Trigger validation when form data changes
  useEffect(() => {
    if (formData.solutions.some(s => s.trim()) && formData.letters.trim()) {
      validateFormAndCheckParasites();
    }
  }, [formData.solutions, formData.bonus_words, formData.letters]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.length > 0 && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="font-semibold text-destructive">Erreurs de validation</span>
            </div>
            <ul className="list-disc list-inside text-destructive space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      
      {warnings.length > 0 && (
        <Card className="border-orange-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="font-semibold text-orange-500">Avertissements</span>
            </div>
            <ul className="list-disc list-inside text-orange-600 space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
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
                placeholder="M,A,I,S,O,N"
                value={formData.letters}
                onChange={(e) => handleLettersChange(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Exemple: M,A,I,S,O,N pour des mots comme MAISON, AMI, etc.
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

      {/* Prévisualisation de la grille */}
      {previewGrid && (
        <Card>
          <CardHeader>
            <CardTitle>Prévisualisation de la grille générée</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div 
                className="grid gap-1 max-w-md mx-auto"
                style={{ 
                  gridTemplateColumns: `repeat(${previewGrid.gridWidth}, 1fr)`,
                  fontSize: '12px'
                }}
              >
                {previewGrid.grid.flat().map((cell: any, index: number) => (
                  <div
                    key={index}
                    className={`
                      w-8 h-8 border border-gray-300 flex items-center justify-center text-xs font-bold
                      ${cell?.letter ? 'bg-blue-100' : 'bg-gray-50'}
                      ${cell?.isBlocked ? 'bg-gray-800' : ''}
                    `}
                  >
                    {cell?.letter || ''}
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <p><strong>Mots placés :</strong> {previewGrid.placedWords?.map((w: any) => w.word).join(', ')}</p>
                <p><strong>Intersections :</strong> {previewGrid.intersections?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button 
          type="button" 
          variant="secondary" 
          onClick={() => validateFormAndCheckParasites()}
        >
          Valider et prévisualiser
        </Button>
        <Button type="submit" disabled={isSubmitting || errors.length > 0}>
          {isSubmitting ? 'Enregistrement...' : level ? 'Modifier le niveau' : 'Créer le niveau'}
        </Button>
      </div>
    </form>
  );
};