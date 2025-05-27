import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Loader2, Trash2, ChevronLeft, Search, Eye, Settings } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import DiaryPermissions from '@/components/admin/DiaryPermissions';

interface DiaryEntryAdmin {
  id: string;
  user_id: string;
  title: string;
  entry_date: string;
  mood_rating: number | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_display_name?: string;
  activities: string | null;
  positive_things: string | null;
  negative_things: string | null;
}

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
}

const AdminDiary = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<DiaryEntryAdmin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<DiaryEntryAdmin | null>(null);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!hasRole('admin')) {
      navigate('/unauthorized');
      return;
    }
    
    loadDiaryEntries();
  }, [hasRole, navigate]);

  const loadDiaryEntries = async () => {
    try {
      setLoading(true);
      
      // Récupérer toutes les entrées de journal
      const { data: entriesData, error: entriesError } = await supabase
        .from('diary_entries')
        .select(`
          id,
          user_id,
          title,
          entry_date,
          mood_rating,
          created_at,
          updated_at,
          activities,
          positive_things,
          negative_things
        `)
        .order('created_at', { ascending: false });

      if (entriesError) {
        console.error('Erreur Supabase (entrées):', entriesError);
        throw new Error(`Erreur Supabase: ${entriesError.message} (code: ${entriesError.code})`);
      }

      if (entriesData) {
        // Récupérer tous les profils d'utilisateurs
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, display_name');

        if (profilesError) {
          console.error('Erreur Supabase (profils):', profilesError);
          throw new Error(`Erreur Supabase: ${profilesError.message} (code: ${profilesError.code})`);
        }

        // Créer un dictionnaire de profils pour faciliter l'accès
        const profilesMap: Record<string, Profile> = {};
        if (profilesData) {
          profilesData.forEach((profile) => {
            profilesMap[profile.id] = profile;
          });
        }
        
        // Traitement des données pour ajouter les informations utilisateur
        const formattedEntries = entriesData.map((entry: any) => {
          const userProfile = profilesMap[entry.user_id];
          
          return {
            ...entry,
            user_email: userProfile?.email || 'Non disponible',
            user_display_name: userProfile?.display_name || 'Utilisateur inconnu'
          };
        });
        
        setEntries(formattedEntries);
      } else {
        throw new Error('Aucune donnée reçue de l\'API');
      }
    } catch (error: any) {
      console.error('Erreur complète:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de charger les entrées de journal : ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDeleteClick = (entry: DiaryEntryAdmin) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const handlePermissionsClick = (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setPermissionsDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;
    
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', entryToDelete.id);
      
      if (error) throw error;
      
      setEntries(prev => prev.filter(entry => entry.id !== entryToDelete.id));
      
      toast({
        title: 'Entrée supprimée',
        description: `L'entrée "${entryToDelete.title}" a été supprimée avec succès`,
      });
      
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Impossible de supprimer l'entrée : ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtrer les entrées selon le terme de recherche
  const filteredEntries = entries.filter(entry => 
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    entry.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.user_display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMoodEmoji = (rating: number | null) => {
    if (!rating) return '❓';
    if (rating <= 2) return '😞';
    if (rating <= 4) return '😐';
    if (rating <= 6) return '🙂';
    if (rating <= 8) return '😊';
    return '😍';
  };

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
            Administration des journaux intimes
          </h1>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">
              Total : {entries.length} entrées de journal
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
                    <TableHead>Titre</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Date d'entrée</TableHead>
                    <TableHead className="text-center">Humeur</TableHead>
                    <TableHead>Dernière modification</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.length > 0 ? (
                    filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.title}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{entry.user_display_name || entry.user_email || 'Utilisateur inconnu'}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePermissionsClick(
                                entry.user_id, 
                                entry.user_display_name || entry.user_email || 'Utilisateur inconnu'
                              )}
                              title="Gérer les permissions"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          {entry.entry_date 
                            ? format(new Date(entry.entry_date), "d MMMM yyyy", { locale: fr })
                            : 'Non disponible'}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-lg" title={`Humeur: ${entry.mood_rating || 'Non renseignée'}/10`}>
                            {getMoodEmoji(entry.mood_rating)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {entry.updated_at 
                            ? format(new Date(entry.updated_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })
                            : 'Non disponible'}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <Link to={`/diary/${entry.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              Voir
                            </Link>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteClick(entry)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        {searchTerm 
                          ? 'Aucune entrée ne correspond à votre recherche' 
                          : 'Aucune entrée de journal n\'a été trouvée'}
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
                    Êtes-vous sûr de vouloir supprimer l'entrée "{entryToDelete?.title}" ?
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

            {/* Dialog de gestion des permissions */}
            <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Gestion des permissions</DialogTitle>
                </DialogHeader>
                {selectedUser && (
                  <DiaryPermissions
                    diaryOwnerId={selectedUser.id}
                    diaryOwnerName={selectedUser.name}
                  />
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDiary;
