
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BlogAlbum, Profile } from '@/types/supabase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AlbumPermissionsProps {
  className?: string;
}

interface AlbumWithPermissions extends BlogAlbum {
  permissions: string[]; // Liste des IDs utilisateurs ayant accès
}

const AlbumPermissions: React.FC<AlbumPermissionsProps> = ({ className }) => {
  const { toast } = useToast();
  const [albums, setAlbums] = useState<AlbumWithPermissions[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Charger les albums et leurs permissions
  useEffect(() => {
    const fetchAlbumsWithPermissions = async () => {
      try {
        setLoading(true);

        // Récupérer tous les albums
        const { data: albumsData, error: albumsError } = await supabase
          .from('blog_albums')
          .select(`*, profiles:author_id(*)`)
          .order('name', { ascending: true });

        if (albumsError) {
          throw albumsError;
        }

        // Récupérer toutes les permissions
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('album_permissions')
          .select('*');

        if (permissionsError) {
          throw permissionsError;
        }

        // Combiner les données
        const albumsWithPermissions = albumsData.map((album: BlogAlbum) => {
          const albumPermissions = permissionsData
            .filter((perm: any) => perm.album_id === album.id)
            .map((perm: any) => perm.user_id);
          
          return {
            ...album,
            permissions: albumPermissions
          };
        });

        setAlbums(albumsWithPermissions);

        // Si aucun album n'est sélectionné, sélectionner le premier
        if (!selectedAlbum && albumsWithPermissions.length > 0) {
          setSelectedAlbum(albumsWithPermissions[0].id);
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement des albums:', error);
        toast({
          title: "Erreur",
          description: error.message || "Impossible de charger les albums",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumsWithPermissions();
  }, [toast, selectedAlbum]);

  // Charger les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('display_name', { ascending: true });

        if (error) {
          throw error;
        }

        setUsers(data);
      } catch (error: any) {
        console.error('Erreur lors du chargement des utilisateurs:', error);
        toast({
          title: "Erreur",
          description: error.message || "Impossible de charger les utilisateurs",
          variant: "destructive"
        });
      }
    };

    fetchUsers();
  }, [toast]);

  // Filtrer les utilisateurs selon la recherche
  const filteredUsers = users.filter(user => {
    const searchTerm = searchQuery.toLowerCase();
    return (
      user.display_name?.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
    );
  });

  // Gérer la modification des permissions d'un utilisateur
  const togglePermission = async (userId: string, albumId: string, hasPermission: boolean) => {
    try {
      if (hasPermission) {
        // Supprimer la permission
        const { error } = await supabase
          .from('album_permissions')
          .delete()
          .eq('user_id', userId)
          .eq('album_id', albumId);

        if (error) throw error;
      } else {
        // Ajouter la permission
        const { error } = await supabase
          .from('album_permissions')
          .insert({
            user_id: userId,
            album_id: albumId
          });

        if (error) throw error;
      }

      // Mettre à jour l'état local
      setAlbums(albums.map(album => {
        if (album.id === albumId) {
          const newPermissions = hasPermission 
            ? album.permissions.filter(id => id !== userId) 
            : [...album.permissions, userId];
          
          return { ...album, permissions: newPermissions };
        }
        return album;
      }));

      toast({
        title: "Succès",
        description: hasPermission 
          ? "Accès retiré avec succès" 
          : "Accès accordé avec succès",
      });
    } catch (error: any) {
      console.error('Erreur lors de la modification de la permission:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la modification de la permission",
        variant: "destructive"
      });
    }
  };

  const currentAlbum = albums.find(a => a.id === selectedAlbum);

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle>Gestion des accès aux albums</CardTitle>
          <CardDescription>
            Contrôlez quels utilisateurs peuvent accéder à quels albums. Par défaut, seul l'auteur, les administrateurs et les éditeurs peuvent voir tous les albums.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Select value={selectedAlbum || ''} onValueChange={(value) => setSelectedAlbum(value)}>
                  <SelectTrigger className="w-full md:w-1/3">
                    <SelectValue placeholder="Sélectionner un album" />
                  </SelectTrigger>
                  <SelectContent>
                    {albums.map(album => (
                      <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative w-full md:w-2/3">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un utilisateur..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {currentAlbum && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-center">Accès à {currentAlbum.name}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                            Aucun utilisateur trouvé
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map(user => {
                          const hasPermission = currentAlbum.permissions.includes(user.id);
                          return (
                            <TableRow key={user.id}>
                              <TableCell className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={user.avatar_url || undefined} alt={user.display_name || ''} />
                                  <AvatarFallback>
                                    {user.display_name ? user.display_name.substring(0, 2).toUpperCase() : user.email.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{user.display_name || 'Sans nom'}</span>
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell className="text-center">
                                <Checkbox 
                                  checked={hasPermission}
                                  onCheckedChange={() => togglePermission(user.id, currentAlbum.id, hasPermission)}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AlbumPermissions;
