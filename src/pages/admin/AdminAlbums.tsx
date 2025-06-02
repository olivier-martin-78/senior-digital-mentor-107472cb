import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Loader2, Pencil, Trash2, ChevronLeft, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface Album {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

const AdminAlbums = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!hasRole('admin')) {
      navigate('/unauthorized');
      return;
    }
    
    loadAlbums();
  }, [hasRole, navigate]);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('blog_albums')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur Supabase:', error);
        throw new Error(`Erreur Supabase: ${error.message} (code: ${error.code})`);
      }

      if (data) {
        setAlbums(data);
      } else {
        throw new Error('Aucune donnée reçue de l\'API');
      }
    } catch (error: any) {
      console.error('Erreur complète:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de charger les albums : ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteClick = (album: Album) => {
    setAlbumToDelete(album);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!albumToDelete) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('blog_albums')
        .delete()
        .eq('id', albumToDelete.id);
      
      if (error) throw error;
      
      setAlbums(prev => prev.filter(album => album.id !== albumToDelete.id));
      
      toast({
        title: 'Album supprimé',
        description: `L'album "${albumToDelete.name}" a été supprimé avec succès`,
      });
      
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Impossible de supprimer l'album : ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrer les albums selon le terme de recherche
  const filteredAlbums = albums.filter(album => 
    album.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    album.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-24">
        <div className="mb-8 flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mr-auto"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-3xl font-serif text-tranches-charcoal">
            Administration des albums photos
          </h1>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">
              Total : {albums.length} albums
            </p>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-8"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center my-10">
            <Loader2 className="h-12 w-12 animate-spin text-tranches-sage" />
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Dernière modification</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAlbums.length > 0 ? (
                    filteredAlbums.map((album) => (
                      <TableRow key={album.id}>
                        <TableCell className="font-medium">{album.name}</TableCell>
                        <TableCell>{album.description}</TableCell>
                        <TableCell>
                          {album.updated_at 
                            ? format(new Date(album.updated_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })
                            : 'Non disponible'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link to={`/admin/albums/${album.id}`}>
                              <Pencil className="h-4 w-4 mr-1" />
                              Éditer
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteClick(album)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        {searchTerm 
                          ? 'Aucun album ne correspond à votre recherche' 
                          : 'Aucun album n\'a été trouvé'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Dialog de confirmation de suppression */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirmer la suppression</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p>
                    Êtes-vous sûr de vouloir supprimer l'album "{albumToDelete?.name}" ?
                    <br />
                    <span className="text-red-500 font-semibold">Cette action est irréversible.</span>
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={isDeleting}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteConfirm}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Suppression...
                      </>
                    ) : (
                      'Supprimer'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAlbums;
