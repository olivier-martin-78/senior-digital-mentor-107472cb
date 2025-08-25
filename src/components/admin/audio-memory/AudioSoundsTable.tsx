import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Play, Pause, Trash2, Search, Music } from 'lucide-react';
import { useAudioMemoryDB } from '@/hooks/useAudioMemoryDB';
import { useAudioMemoryAdmin } from '@/hooks/useAudioMemoryAdmin';
import { GameSound } from '@/types/audioMemoryGame';
import { AudioPlayer } from '@/components/audio-memory-game/AudioPlayer';

export const AudioSoundsTable: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [playingSound, setPlayingSound] = useState<string | null>(null);

  const { sounds, isLoading, refetch } = useAudioMemoryDB();
  const { deleteSound } = useAudioMemoryAdmin();

  const categories = ['all', 'animals', 'onomatopoeia', 'instruments', 'music', 'nature', 'transport'];

  const filteredSounds = sounds.filter(sound => {
    const matchesSearch = sound.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sound.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || sound.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (sound: GameSound) => {
    try {
      await deleteSound(sound.id, sound.file_url);
      refetch();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const getCategoryColor = (category: GameSound['category']) => {
    const colors = {
      animals: 'bg-green-100 text-green-800',
      onomatopoeia: 'bg-purple-100 text-purple-800',
      instruments: 'bg-blue-100 text-blue-800',
      music: 'bg-pink-100 text-pink-800',
      nature: 'bg-emerald-100 text-emerald-800',
      transport: 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Music className="w-8 h-8 mx-auto mb-2 animate-pulse" />
          <p>Chargement des sons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un son..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-border rounded-md bg-background"
        >
          <option value="all">Toutes les catégories</option>
          <option value="animals">Animaux</option>
          <option value="onomatopoeia">Onomatopées</option>
          <option value="instruments">Instruments</option>
          <option value="music">Musique</option>
          <option value="nature">Nature</option>
          <option value="transport">Transport</option>
        </select>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredSounds.length} son{filteredSounds.length !== 1 ? 's' : ''} trouvé{filteredSounds.length !== 1 ? 's' : ''}
      </p>

      {/* Table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Lecture</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSounds.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Aucun son trouvé
                </TableCell>
              </TableRow>
            ) : (
              filteredSounds.map((sound) => (
                <TableRow key={sound.id}>
                  <TableCell className="font-medium">{sound.name}</TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(sound.category)}>
                      {sound.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={sound.type === 'original' ? 'default' : 'secondary'}>
                      {sound.type === 'original' ? 'Original' : 'Variante'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {sound.description || '-'}
                  </TableCell>
                  <TableCell>
                    <AudioPlayer 
                      audioUrl={sound.file_url}
                      showControls={true}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Supprimer le son</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer le son "{sound.name}" ?
                            Cette action est irréversible.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(sound)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Supprimer
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};