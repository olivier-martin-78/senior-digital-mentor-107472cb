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

      // Récupérer les données des profils
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, created_at, display_name');

      if (profilesError) {
        console.error('Erreur Supabase (profils):', profilesError);
        throw new Error(`Erreur Supabase: ${profilesError.message} (code: ${profilesError.code})`);
      }

      // Récupérer les rôles des utilisateurs
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        console.error('Erreur Supabase (rôles):', rolesError);
        throw new Error(`Erreur Supabase: ${rolesError.message} (code: ${rolesError.code})`);
      }

      // Récupérer les comptes d'articles de blog
      const { data: blogPostsData } = await supabase
        .from('blog_posts')
        .select('author_id');

      // Récupérer les comptes d'entrées de journal
      const { data: diaryEntriesData } = await supabase
        .from('diary_entries')
        .select('user_id');

      // Récupérer les comptes de souhaits
      const { data: wishPostsData } = await supabase
        .from('wish_posts')
        .select('author_id');

      // Essayer de récupérer les données d'authentification (peut échouer pour les non-admin)
      let authUsersData: any[] = [];
      try {
        const { data: authData } = await supabase.auth.admin.listUsers();
        authUsersData = authData?.users || [];
      } catch (authError) {
        console.log('Impossible de récupérer les données auth:', authError);
      }

      if (profilesData && rolesData) {
        // Créer une map pour la recherche facile des rôles
        const rolesMap: { [key: string]: AppRole } = {};
        rolesData.forEach(roleEntry => {
          rolesMap[roleEntry.user_id] = roleEntry.role;
        });

        // Créer des maps pour les comptes
        const blogCountsMap: { [key: string]: number } = {};
        blogPostsData?.forEach(post => {
          blogCountsMap[post.author_id] = (blogCountsMap[post.author_id] || 0) + 1;
        });

        const diaryCountsMap: { [key: string]: number } = {};
        diaryEntriesData?.forEach(entry => {
          diaryCountsMap[entry.user_id] = (diaryCountsMap[entry.user_id] || 0) + 1;
        });

        const wishCountsMap: { [key: string]: number } = {};
        wishPostsData?.forEach(wish => {
          wishCountsMap[wish.author_id] = (wishCountsMap[wish.author_id] || 0) + 1;
        });

        // Créer une map pour les dernières connexions
        const lastSignInMap: { [key: string]: string | null } = {};
        authUsersData.forEach((user: any) => {
          lastSignInMap[user.id] = user.last_sign_in_at;
        });

        // Combiner toutes les données
        const combinedUsers: UserAdmin[] = profilesData.map(profile => ({
          id: profile.id,
          email: profile.email,
          created_at: profile.created_at,
          role: rolesMap[profile.id] || 'reader',
          display_name: profile.display_name,
          last_sign_in_at: lastSignInMap[profile.id] || null,
          blog_posts_count: blogCountsMap[profile.id] || 0,
          diary_entries_count: diaryCountsMap[profile.id] || 0,
          wish_posts_count: wishCountsMap[profile.id] || 0
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
