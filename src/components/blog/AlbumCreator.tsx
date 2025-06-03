
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface AlbumCreatorProps {
  onAlbumCreated?: () => void;
}

const AlbumCreator: React.FC<AlbumCreatorProps> = ({ onAlbumCreated }) => {
  const { user, hasRole } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDescription, setNewAlbumDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Permettre aux readers de créer des albums
  const canCreateAlbum = hasRole('admin') || hasRole('editor') || hasRole('reader');

  const handleCreateAlbum = async () => {
    if (!user || !newAlbumName.trim()) return;

    try {
      setIsCreating(true);
      
      console.log('AlbumCreator - Création d\'album pour reader/editor/admin');
      
      const { data, error } = await supabase
        .from('blog_albums')
        .insert([{
          name: newAlbumName.trim(),
          description: newAlbumDescription.trim() || null,
          author_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Album créé',
        description: `L'album "${newAlbumName}" a été créé avec succès.`,
      });

      setNewAlbumName('');
      setNewAlbumDescription('');
      setIsDialogOpen(false);
      
      if (onAlbumCreated) {
        onAlbumCreated();
      }
    } catch (error: any) {
      console.error('AlbumCreator - Erreur:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: `Impossible de créer l'album : ${error.message}`,
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (!canCreateAlbum) {
    return null;
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          Créer un album
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un nouvel album</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Nom de l'album</label>
            <Input
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              placeholder="Ex: Vacances 2023, Famille..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description (facultative)</label>
            <Input
              value={newAlbumDescription}
              onChange={(e) => setNewAlbumDescription(e.target.value)}
              placeholder="Description de l'album"
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
  );
};

export default AlbumCreator;
