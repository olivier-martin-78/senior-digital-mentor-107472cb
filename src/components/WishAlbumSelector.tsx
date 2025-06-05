
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { WishAlbum } from '@/types/supabase';

interface WishAlbumSelectorProps {
  wishAlbums: WishAlbum[];
  selectedAlbumId: string;
  onAlbumChange: (albumId: string) => void;
  onAlbumsUpdate: () => void;
}

export const WishAlbumSelector: React.FC<WishAlbumSelectorProps> = ({
  wishAlbums,
  selectedAlbumId,
  onAlbumChange,
  onAlbumsUpdate
}) => {
  const { user, hasRole } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // MODIFIÉ: Permettre aux readers de créer des albums
  const canCreateAlbum = hasRole('admin') || hasRole('editor') || hasRole('reader');

  const handleCreateAlbum = async () => {
    if (!user || !newAlbumName.trim()) return;

    try {
      setIsCreating(true);
      
      console.log('WishAlbumSelector - Création avec nouvelles politiques RLS simplifiées');
      
      // Les nouvelles politiques RLS simplifiées permettent la création directe
      const { data, error } = await supabase
        .from('wish_albums')
        .insert([{
          name: newAlbumName.trim(),
          description: newAlbumDescription.trim() || null,
          author_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Catégorie créée',
        description: `La catégorie "${newAlbumName}" a été créée avec succès.`,
      });

      setNewAlbumName('');
      setNewAlbumDescription('');
      setIsDialogOpen(false);
      onAlbumsUpdate();
      
      // Sélectionner automatiquement le nouvel album
      if (data) {
        onAlbumChange(data.id);
      }
    } catch (error: any) {
      console.error('WishAlbumSelector - Erreur:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: `Impossible de créer la catégorie : ${error.message}`,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Select value={selectedAlbumId} onValueChange={onAlbumChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Sélectionner une catégorie (facultatif)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucune catégorie</SelectItem>
            {wishAlbums.map((album) => (
              <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {canCreateAlbum && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer une nouvelle catégorie</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nom de la catégorie</label>
                  <Input
                    value={newAlbumName}
                    onChange={(e) => setNewAlbumName(e.target.value)}
                    placeholder="Ex: Voyages, Apprentissage..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description (facultative)</label>
                  <Input
                    value={newAlbumDescription}
                    onChange={(e) => setNewAlbumDescription(e.target.value)}
                    placeholder="Description de la catégorie"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isCreating}
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleCreateAlbum}
                    disabled={isCreating || !newAlbumName.trim()}
                  >
                    {isCreating ? 'Création...' : 'Créer'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default WishAlbumSelector;
