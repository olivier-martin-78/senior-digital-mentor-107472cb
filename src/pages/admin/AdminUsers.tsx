import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronLeft, Search, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import InviteUserDialog from '@/components/InviteUserDialog';
import DeleteUserDialog from '@/components/admin/DeleteUserDialog';
import UserRoleSelector from '@/components/admin/UserRoleSelector';
import type { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Utiliser le type AppRole depuis l'intégration Supabase
type AppRole = Database['public']['Enums']['app_role'];

interface UserAdmin {
  id: string;
  email: string;
  created_at: string;
  role: AppRole;
  display_name: string | null;
  last_sign_in_at: string | null;
  blog_posts_count: number;
  diary_entries_count: number;
  wish_posts_count: number;
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

      // Utiliser la nouvelle fonction de base de données pour récupérer toutes les données
      const { data: usersData, error } = await supabase
        .rpc('get_admin_users_with_auth_data');

      if (error) {
        console.error('Erreur Supabase:', error);
        throw new Error(`Erreur Supabase: ${error.message}`);
      }

      if (usersData) {
        // Convertir les données reçues au format UserAdmin
        const combinedUsers: UserAdmin[] = usersData.map((user: any) => ({
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          role: user.role,
          display_name: user.display_name,
          last_sign_in_at: user.last_sign_in_at,
          blog_posts_count: Number(user.blog_posts_count),
          diary_entries_count: Number(user.diary_entries_count),
          wish_posts_count: Number(user.wish_posts_count)
        }));

        setUsers(combinedUsers);
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

  const handleUserDeleted = async () => {
    await loadUsers();
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleRoleChanged = async () => {
    await loadUsers();
  };

  // Filtrer les utilisateurs selon le terme de recherche
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
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
                  <TableHead>Articles blog</TableHead>
                  <TableHead>Journal intime</TableHead>
                  <TableHead>Souhaits</TableHead>
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
                         <UserRoleSelector
                           userId={user.id}
                           currentRole={user.role}
                           onRoleChange={handleRoleChanged}
                         />
                       </TableCell>
                       <TableCell>
                         {format(new Date(user.created_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                       </TableCell>
                       <TableCell>
                         {user.last_sign_in_at 
                           ? format(new Date(user.last_sign_in_at), "d MMMM yyyy 'à' HH:mm", { locale: fr })
                           : 'Jamais connecté'
                         }
                       </TableCell>
                       <TableCell className="text-center">
                         <Badge variant="secondary">{user.blog_posts_count}</Badge>
                       </TableCell>
                       <TableCell className="text-center">
                         <Badge variant="secondary">{user.diary_entries_count}</Badge>
                       </TableCell>
                       <TableCell className="text-center">
                         <Badge variant="secondary">{user.wish_posts_count}</Badge>
                       </TableCell>
                       <TableCell className="text-right space-x-2">
                         <DeleteUserDialog
                           userId={user.id}
                           userEmail={user.email}
                           onUserDeleted={handleUserDeleted}
                         />
                       </TableCell>
                     </TableRow>
                  ))
                ) : (
                   <TableRow>
                     <TableCell colSpan={9} className="text-center py-8 text-gray-500">
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
        <InviteUserDialog />
      </div>
    </div>
  );
};

export default AdminUsers;
