
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBlogAlbums } from '@/hooks/blog/useBlogAlbums';
import Header from '@/components/Header';
import AlbumPermissions from '@/components/admin/AlbumPermissions';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, Users } from 'lucide-react';

const AdminAlbums = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const { albums, loading } = useBlogAlbums();
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);

  console.log('🎬 AdminAlbums - Composant monté');

  // Redirection si l'utilisateur n'est pas administrateur
  React.useEffect(() => {
    console.log('🔐 AdminAlbums - Vérification permissions:', {
      hasAdminRole: hasRole('admin'),
      timestamp: new Date().toISOString()
    });

    if (!hasRole('admin')) {
      console.log('❌ AdminAlbums - Accès refusé, redirection vers /unauthorized');
      navigate('/unauthorized');
    } else {
      console.log('✅ AdminAlbums - Permissions validées, accès autorisé');
    }
  }, [hasRole, navigate]);

  const handleManagePermissions = (albumId: string) => {
    console.log('🔧 AdminAlbums - Ouverture gestion permissions pour album:', albumId);
    setSelectedAlbumId(albumId);
    setIsPermissionsDialogOpen(true);
  };

  const handleClosePermissions = () => {
    console.log('🔧 AdminAlbums - Fermeture gestion permissions');
    setSelectedAlbumId(null);
    setIsPermissionsDialogOpen(false);
  };

  console.log('🖼️ AdminAlbums - Rendu composant, albums:', {
    albumsCount: albums.length,
    loading
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif text-tranches-charcoal mb-8">Gérer les albums</h1>
        
        {albums.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun album trouvé.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom de l'album</TableHead>
                  <TableHead>Auteur</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {albums.map((album) => (
                  <TableRow key={album.id}>
                    <TableCell className="font-medium">{album.name}</TableCell>
                    <TableCell>{album.profiles?.display_name || album.profiles?.email || 'Utilisateur inconnu'}</TableCell>
                    <TableCell>{new Date(album.created_at).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManagePermissions(album.id)}
                        className="flex items-center gap-2"
                      >
                        <Users className="h-4 w-4" />
                        Permissions
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Gérer les permissions d'accès</DialogTitle>
            </DialogHeader>
            {selectedAlbumId && (
              <AlbumPermissions 
                albumId={selectedAlbumId} 
                onClose={handleClosePermissions} 
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminAlbums;
