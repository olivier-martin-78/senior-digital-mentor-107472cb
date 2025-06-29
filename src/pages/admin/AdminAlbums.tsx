import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Loader2, Pencil, Trash2, ChevronLeft, Search, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';

interface Album {
  id: string;
  name: string;
  description: string | null;
  author_id: string;
  author_email: string;
  author_display_name: string;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  post_count: number;
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
      
      // Récupérer tous les albums avec les informations des auteurs
      const { data: albumsData, error: albumsError } = await supabase
        .from('blog_albums')
        .select('*');

      if (albumsError) {
        console.error('Erreur Supabase (albums):', albumsError);
        throw new Error(`Erreur Supabase: ${albumsError.message} (code: ${albumsError.code})`);
      }

      if (albumsData) {
        // Récupérer tous les profils d'utilisateurs
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, display_name');

        if (profilesError) {
          console.error('Erreur Supabase (profils):', profilesError);
          throw new Error(`Erreur Supabase: ${profilesError.message} (code: ${profilesError.code})`);
        }

        // Créer un dictionnaire de profils pour faciliter l'accès
        const profilesMap: {[key: string]: any} = {};
        if (profilesData) {
          profilesData.forEach(profile => {
            profilesMap[profile.id] = profile;
          });
        }

        // Compter les posts pour chaque album
        const { data: postsCount, error: postsError } = await supabase
          .from('blog_posts')
          .select('album_id');

        if (postsError) {
          console.error('Erreur Supabase (posts count):', postsError);
        }

        const postsCountMap: {[key: string]: number} = {};
        if (postsCount) {
          postsCount.forEach(post => {
            if (post.album_id) {
              postsCountMap[post.album_id] = (postsCountMap[post.album_id] || 0) + 1;
            }
          });
        }

        // Formater les albums avec les informations des auteurs
        const formattedAlbums: Album[] = albumsData.map(album => {
          const userProfile = profilesMap[album.author_id];
          return {
            ...album,
            updated_at: album.created_at, // Use created_at as fallback for updated_at
            author_email: userProfile?.email || 'Non disponible',
            author_display_name: userProfile?.display_name || 'Utilisateur inconnu',
            post_count: postsCountMap[album.id] || 0
          };
        });

        setAlbums(formattedAlbums);
      } else {
        throw new Error('Aucune donnée reçue de l\'API');
      }
    } catch (error: any) {
      console.error('Erreur complète:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de charger les albums : ${error.message}`,
        variant: 'destructive'
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

      // Supprimer les posts associés d'abord
      const { error: postsError } = await supabase
        .from('blog_posts')
        .delete()
        .eq('album_id', albumToDelete.id);

      if (postsError) throw postsError;

      // Supprimer l'album
      const { error } = await supabase
        .from('blog_albums')
        .delete()
        .eq('id', albumToDelete.id);

      if (error) throw error;

      setAlbums(prev => prev.filter(album => album.id !== albumToDelete.id));
      toast({
        title: 'Album supprimé',
        description: `L'album "${albumToDelete.name}" a été supprimé avec succès`
      });
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Impossible de supprimer l'album : ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrer les albums selon le terme de recherche
  const filteredAlbums = albums.filter(album => 
    album.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    album.author_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    album.author_display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
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
            Administration des albums
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
                type="text"
                placeholder="Rechercher un album..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-8"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-tranches-sage" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Auteur</TableHead>
                  <TableHead>Posts</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlbums.map((album) => (
                  <TableRow key={album.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{album.name}</div>
                        {album.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {album.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{album.author_display_name}</div>
                        <div className="text-sm text-gray-500">{album.author_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {album.post_count} posts
                      </span>
                    </TableCell>
                    <TableCell>
                      {format(new Date(album.created_at), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <Link to={`/blog?album=${album.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(album)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Dialog de confirmation de suppression */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Supprimer l'album</DialogTitle>
            </DialogHeader>
            <p>
              Êtes-vous sûr de vouloir supprimer l'album "{albumToDelete?.name}" ?
              Cette action supprimera également tous les posts associés et est irréversible.
            </p>
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
      </div>
    </div>
  );
};

export default AdminAlbums;
