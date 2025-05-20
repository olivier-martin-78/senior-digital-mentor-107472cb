
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { FolderPlus, Edit, Trash, Users } from 'lucide-react';
import WishAlbumPermissions from '@/components/admin/WishAlbumPermissions';

interface WishAlbum {
  id: string;
  name: string;
  description: string | null;
  author_id: string;
  created_at: string;
  profiles: {
    display_name: string | null;
    email: string;
  };
}

const AdminWishAlbums = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [albums, setAlbums] = useState<WishAlbum[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  
  useEffect(() => {
    // Check if user is admin, if not redirect
    if (user && !hasRole('admin')) {
      navigate('/unauthorized');
      return;
    }
    
    fetchAlbums();
  }, [user, hasRole, navigate]);
  
  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wish_albums')
        .select(`*, profiles:author_id(display_name, email)`)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      setAlbums(data as WishAlbum[]);
    } catch (error) {
      console.error('Error fetching wish albums:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les albums de souhaits.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCreateAlbum = async () => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('wish_albums')
        .insert({
          name: formData.name,
          description: formData.description || null,
          author_id: user.id,
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Album créé",
        description: "L'album de souhaits a été créé avec succès."
      });
      
      setIsCreateDialogOpen(false);
      setFormData({ name: '', description: '' });
      fetchAlbums();
      
    } catch (error) {
      console.error('Error creating album:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'album de souhaits.",
        variant: "destructive"
      });
    }
  };
  
  const handleEditAlbum = async (albumId: string) => {
    const album = albums.find(a => a.id === albumId);
    if (!album) return;
    
    setFormData({
      name: album.name,
      description: album.description || '',
    });
    setSelectedAlbumId(albumId);
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateAlbum = async () => {
    if (!selectedAlbumId) return;
    
    try {
      const { error } = await supabase
        .from('wish_albums')
        .update({
          name: formData.name,
          description: formData.description || null,
        })
        .eq('id', selectedAlbumId);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Album mis à jour",
        description: "L'album de souhaits a été mis à jour avec succès."
      });
      
      setIsEditDialogOpen(false);
      setFormData({ name: '', description: '' });
      setSelectedAlbumId(null);
      fetchAlbums();
      
    } catch (error) {
      console.error('Error updating album:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'album de souhaits.",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteAlbum = async (albumId: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet album ? Cette action est irréversible.")) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('wish_albums')
        .delete()
        .eq('id', albumId);
        
      if (error) {
        throw error;
      }
      
      toast({
        title: "Album supprimé",
        description: "L'album de souhaits a été supprimé avec succès."
      });
      
      fetchAlbums();
      
    } catch (error) {
      console.error('Error deleting album:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'album de souhaits.",
        variant: "destructive"
      });
    }
  };
  
  const handleManagePermissions = (albumId: string) => {
    setSelectedAlbumId(albumId);
    setIsPermissionsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-serif text-tranches-charcoal">Gestion des albums de souhaits</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-tranches-sage hover:bg-tranches-sage/90">
                <FolderPlus className="mr-2 h-5 w-5" />
                Nouvel album
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un nouvel album de souhaits</DialogTitle>
                <DialogDescription>
                  Créez un album pour organiser les souhaits par thème ou catégorie.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Nom de l'album</label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nom de l'album"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">Description</label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Description de l'album"
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Annuler</Button>
                <Button 
                  onClick={handleCreateAlbum} 
                  disabled={!formData.name.trim()}
                  className="bg-tranches-sage hover:bg-tranches-sage/90"
                >
                  Créer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        ) : albums.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-serif text-tranches-charcoal mb-4">Aucun album</h2>
            <p className="text-gray-600 mb-6">
              Vous n'avez pas encore créé d'albums de souhaits.
            </p>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-tranches-sage hover:bg-tranches-sage/90"
            >
              <FolderPlus className="mr-2 h-5 w-5" />
              Créer un album
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Créé par</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {albums.map(album => (
                  <TableRow key={album.id}>
                    <TableCell className="font-medium">{album.name}</TableCell>
                    <TableCell>{album.description || '-'}</TableCell>
                    <TableCell>{album.profiles.display_name || album.profiles.email}</TableCell>
                    <TableCell>{new Date(album.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleManagePermissions(album.id)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditAlbum(album.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteAlbum(album.id)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier l'album</DialogTitle>
              <DialogDescription>
                Modifiez les détails de cet album de souhaits.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-name" className="text-sm font-medium">Nom de l'album</label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nom de l'album"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="edit-description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description de l'album"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Annuler</Button>
              <Button 
                onClick={handleUpdateAlbum} 
                disabled={!formData.name.trim()}
                className="bg-tranches-sage hover:bg-tranches-sage/90"
              >
                Mettre à jour
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Permissions Dialog */}
        <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Gestion des accès à l'album</DialogTitle>
              <DialogDescription>
                Définissez quels utilisateurs peuvent accéder à cet album de souhaits.
              </DialogDescription>
            </DialogHeader>
            {selectedAlbumId && (
              <WishAlbumPermissions
                albumId={selectedAlbumId} 
                onClose={() => setIsPermissionsDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminWishAlbums;
