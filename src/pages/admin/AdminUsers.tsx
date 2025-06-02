import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Pencil, Trash2, ChevronLeft, Search, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import InviteUserDialog from '@/components/InviteUserDialog';
import DeleteUserDialog from '@/components/admin/DeleteUserDialog';
import { AppRole } from '@/types/supabase';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UserAdmin {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
  role: AppRole;
  display_name: string | null;
}

const AdminUsers = () => {
  const { user: authUser, hasRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserAdmin | null>(null);

  useEffect(() => {
    if (!hasRole('admin')) {
      navigate('/unauthorized');
      return;
    }

    loadUsers();
  }, [hasRole, navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          created_at,
          last_sign_in_at,
          role,
          display_name
        `)
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Erreur Supabase (utilisateurs):', usersError);
        throw new Error(`Erreur Supabase: ${usersError.message} (code: ${usersError.code})`);
      }

      if (usersData) {
        setUsers(usersData);
      } else {
        throw new Error('Aucune donnée reçue de l\'API');
      }
    } catch (error: any) {
      console.error('Erreur complète:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de charger les utilisateurs : ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleInviteDialogOpen = () => {
    setInviteDialogOpen(true);
  };

  const handleDeleteClick = (user: UserAdmin) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      // Supprimer l'utilisateur via Supabase Auth
      const { error } = await supabase.auth.admin.deleteUser(userToDelete.id);

      if (error) {
        console.error('Erreur lors de la suppression de l\'utilisateur:', error);
        throw error;
      }

      // Mettre à jour l'état local après la suppression réussie
      setUsers(prev => prev.filter(user => user.id !== userToDelete.id));

      toast({
        title: 'Utilisateur supprimé',
        description: `L'utilisateur "${userToDelete.email}" a été supprimé avec succès`,
      });

      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Impossible de supprimer l'utilisateur : ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  // Filtrer les utilisateurs selon le terme de recherche
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
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
            Administration des utilisateurs
          </h1>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-600">
              Total : {users.length} utilisateurs
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
            <Button
              variant="default"
              onClick={handleInviteDialogOpen}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Inviter un utilisateur
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center my-10">
            <Loader2 className="h-12 w-12 animate-spin text-tranches-sage" />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.display_name || 'Non défini'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{user.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {user.last_sign_in_at
                          ? format(new Date(user.last_sign_in_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })
                          : 'Jamais'}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteClick(user)}
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
                        ? 'Aucun utilisateur ne correspond à votre recherche'
                        : 'Aucun utilisateur n\'a été trouvé'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Dialog d'invitation d'un utilisateur */}
        <InviteUserDialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen} onUserInvited={loadUsers} />

        {/* Dialog de confirmation de suppression */}
        <DeleteUserDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          userToDelete={userToDelete}
          onDeleteConfirm={handleDeleteConfirm}
        />
      </div>
    </div>
  );
};

export default AdminUsers;
