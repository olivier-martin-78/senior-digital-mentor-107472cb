import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Profile, UserRole, AppRole } from '@/types/supabase';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserWithRoles extends Profile {
  roles: AppRole[];
}

const AdminUsers = () => {
  const { hasRole, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasRole('admin')) {
      navigate('/unauthorized');
      return;
    }

    const fetchUsers = async () => {
      try {
        // Fetch all profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (profilesError) {
          throw profilesError;
        }

        // Fetch all user roles
        const { data: userRoles, error: rolesError } = await supabase
          .from('user_roles')
          .select('*');

        if (rolesError) {
          throw rolesError;
        }

        // Map roles to users
        const usersWithRoles = profiles.map((profile: Profile) => {
          const roles = userRoles
            .filter((role: UserRole) => role.user_id === profile.id)
            .map((role: UserRole) => role.role);
          
          return { ...profile, roles };
        });

        setUsers(usersWithRoles);
      } catch (error: any) {
        console.error('Error fetching users:', error);
        toast({
          title: "Erreur",
          description: error.message || "Une erreur est survenue lors du chargement des utilisateurs.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [hasRole, navigate, toast]);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    try {
      // Don't allow changing your own role
      if (userId === currentUser?.id) {
        toast({
          title: "Action refusée",
          description: "Vous ne pouvez pas modifier votre propre rôle.",
          variant: "destructive"
        });
        return;
      }

      // First, fetch all current roles for this user
      const { data: existingRoles, error: fetchError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      if (fetchError) throw fetchError;

      // If the user already has this role, do nothing
      if (existingRoles.some((role: UserRole) => role.role === newRole)) {
        return;
      }

      // Remove all existing roles for this user
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Add the new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      if (insertError) throw insertError;

      // Update the UI
      setUsers(users.map(u => {
        if (u.id === userId) {
          return { ...u, roles: [newRole] };
        }
        return u;
      }));

      toast({
        title: "Rôle mis à jour",
        description: "Le rôle de l'utilisateur a été modifié avec succès."
      });
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la mise à jour du rôle.",
        variant: "destructive"
      });
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr });
  };

  const getRoleDisplay = (roles: AppRole[]) => {
    if (roles.includes('admin')) return 'Administrateur';
    if (roles.includes('editor')) return 'Éditeur';
    return 'Lecteur';
  };

  const getCurrentRole = (roles: AppRole[]): AppRole => {
    if (roles.includes('admin')) return 'admin';
    if (roles.includes('editor')) return 'editor';
    return 'reader';
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif text-tranches-charcoal mb-6">Gestion des utilisateurs</h1>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Date d'inscription</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead className="w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Aucun utilisateur trouvé.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || undefined} alt="Avatar" />
                          <AvatarFallback>{getInitials(user.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{user.display_name || '-'}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs ${
                          getCurrentRole(user.roles) === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : getCurrentRole(user.roles) === 'editor'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          {getRoleDisplay(user.roles)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={getCurrentRole(user.roles)}
                          onValueChange={(value: string) => handleRoleChange(user.id, value as AppRole)}
                          disabled={user.id === currentUser?.id}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Changer le rôle" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Administrateur</SelectItem>
                            <SelectItem value="editor">Éditeur</SelectItem>
                            <SelectItem value="reader">Lecteur</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
