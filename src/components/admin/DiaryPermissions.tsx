
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Trash2, UserPlus } from 'lucide-react';

interface DiaryPermission {
  id: string;
  diary_owner_id: string;
  permitted_user_id: string;
  permission_level: 'reader' | 'editor';
  granted_by: string;
  created_at: string;
  permitted_user?: {
    display_name: string | null;
    email: string;
  };
  diary_owner?: {
    display_name: string | null;
    email: string;
  };
}

interface User {
  id: string;
  email: string;
  display_name: string | null;
}

interface Props {
  diaryOwnerId: string;
  diaryOwnerName: string;
}

const DiaryPermissions: React.FC<Props> = ({ diaryOwnerId, diaryOwnerName }) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<DiaryPermission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedPermission, setSelectedPermission] = useState<'reader' | 'editor'>('reader');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPermissions();
    loadUsers();
  }, [diaryOwnerId]);

  const loadPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('diary_permissions')
        .select('*')
        .eq('diary_owner_id', diaryOwnerId);

      if (error) throw error;

      // Charger les informations des utilisateurs séparément
      if (data && data.length > 0) {
        const userIds = [...new Set([
          ...data.map(p => p.permitted_user_id),
          ...data.map(p => p.diary_owner_id)
        ])];

        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, display_name')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        const profilesMap = profiles?.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, any>) || {};

        const enrichedPermissions = data.map(permission => ({
          ...permission,
          permission_level: permission.permission_level as 'reader' | 'editor',
          permitted_user: profilesMap[permission.permitted_user_id],
          diary_owner: profilesMap[permission.diary_owner_id]
        }));

        setPermissions(enrichedPermissions);
      } else {
        setPermissions([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des permissions:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les permissions',
        variant: 'destructive',
      });
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .neq('id', diaryOwnerId);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const handleAddPermission = async () => {
    if (!selectedUserId || !user) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('diary_permissions')
        .insert({
          diary_owner_id: diaryOwnerId,
          permitted_user_id: selectedUserId,
          permission_level: selectedPermission,
          granted_by: user.id
        });

      if (error) throw error;

      toast({
        title: 'Permission ajoutée',
        description: 'La permission a été ajoutée avec succès',
      });

      setSelectedUserId('');
      setSelectedPermission('reader');
      setIsDialogOpen(false);
      loadPermissions();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Impossible d'ajouter la permission : ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    try {
      const { error } = await supabase
        .from('diary_permissions')
        .delete()
        .eq('id', permissionId);

      if (error) throw error;

      toast({
        title: 'Permission supprimée',
        description: 'La permission a été supprimée avec succès',
      });

      loadPermissions();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: `Impossible de supprimer la permission : ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const availableUsers = users.filter(user => 
    !permissions.some(p => p.permitted_user_id === user.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Permissions pour le journal de {diaryOwnerName}
        </h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-1" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajouter une permission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Utilisateur</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un utilisateur" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.display_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Niveau de permission</label>
                <Select value={selectedPermission} onValueChange={(value: 'reader' | 'editor') => setSelectedPermission(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reader">Lecteur</SelectItem>
                    <SelectItem value="editor">Éditeur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleAddPermission} 
                disabled={!selectedUserId || loading}
                className="w-full"
              >
                {loading ? 'Ajout...' : 'Ajouter la permission'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {permissions.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Permission</TableHead>
              <TableHead>Accordée le</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((permission) => (
              <TableRow key={permission.id}>
                <TableCell>
                  {permission.permitted_user?.display_name || permission.permitted_user?.email || 'Utilisateur inconnu'}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    permission.permission_level === 'editor' 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {permission.permission_level === 'editor' ? 'Éditeur' : 'Lecteur'}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(permission.created_at).toLocaleDateString('fr-FR')}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDeletePermission(permission.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-gray-500 text-center py-4">
          Aucune permission accordée pour ce journal
        </p>
      )}
    </div>
  );
};

export default DiaryPermissions;
