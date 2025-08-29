import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, Eye, Search, Plus } from 'lucide-react';
import type { WordMagicLevel } from '@/types/wordMagicGame';

interface LevelsTableProps {
  levels: WordMagicLevel[];
  onEdit: (level: WordMagicLevel) => void;
  onDelete: (levelId: string) => void;
  onView: (level: WordMagicLevel) => void;
  onCreate: () => void;
  isDeleting: boolean;
}

export const LevelsTable = ({ 
  levels, 
  onEdit, 
  onDelete, 
  onView, 
  onCreate,
  isDeleting 
}: LevelsTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile': return 'bg-green-100 text-green-800';
      case 'moyen': return 'bg-yellow-100 text-yellow-800';
      case 'difficile': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLevels = levels.filter(level => {
    const matchesSearch = searchTerm === '' || 
      level.level_number.toString().includes(searchTerm) ||
      level.solutions.some(solution => 
        solution.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesDifficulty = difficultyFilter === 'all' || level.difficulty === difficultyFilter;
    
    return matchesSearch && matchesDifficulty;
  });

  const sortedLevels = [...filteredLevels].sort((a, b) => a.level_number - b.level_number);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Niveaux du jeu "La magie des mots"</CardTitle>
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau niveau
          </Button>
        </div>
        
        {/* Filtres */}
        <div className="flex gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro ou mot..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer par difficulté" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les difficultés</SelectItem>
              <SelectItem value="facile">Facile</SelectItem>
              <SelectItem value="moyen">Moyen</SelectItem>
              <SelectItem value="difficile">Difficile</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        {sortedLevels.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {levels.length === 0 
                ? 'Aucun niveau créé. Créez votre premier niveau !' 
                : 'Aucun niveau ne correspond aux critères de recherche.'
              }
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Niveau</TableHead>
                <TableHead>Difficulté</TableHead>
                <TableHead>Solutions</TableHead>
                <TableHead>Mots bonus</TableHead>
                <TableHead>Lettres</TableHead>
                <TableHead>Modifié</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLevels.map((level) => (
                <TableRow key={level.id}>
                  <TableCell className="font-medium">
                    {level.level_number}
                  </TableCell>
                  <TableCell>
                    <Badge className={getDifficultyColor(level.difficulty)}>
                      {level.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-48">
                      {level.solutions.slice(0, 3).map((solution, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {solution}
                        </Badge>
                      ))}
                      {level.solutions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{level.solutions.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {level.bonus_words.length}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {level.letters.length > 20 
                      ? level.letters.substring(0, 20) + '...'
                      : level.letters
                    }
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(level.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onView(level)}
                        title="Voir le détail"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(level)}
                        title="Modifier"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(level.id)}
                        disabled={isDeleting}
                        title="Supprimer"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};