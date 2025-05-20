
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckCircle, X } from 'lucide-react';

interface Profile {
  id: string;
  display_name: string | null;
  email: string;
  has_access: boolean;
}

interface WishAlbumPermissionsProps {
  albumId: string;
  onClose: () => void;
}

const WishAlbumPermissions = ({ albumId, onClose }: WishAlbumPermissionsProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [albumId]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase();
      setFilteredUsers(users.filter(user => 
        (user.display_name && user.display_name.toLowerCase().includes(lowercaseQuery)) ||
        user.email.toLowerCase().includes(lowercaseQuery)
      ));
    } else {
      setFilteredUsers(users);
    }
  }, [users, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, email');
        
      if (profilesError) {
        throw profilesError;
      }
      
      if (!profiles) {
        setUsers([]);
        return;
      }
      
      // Get album permissions
      const { data: permissions, error: permissionsError } = await supabase
        .from('wish_album_permissions')
        .select('user_id')
        .eq('album_id', albumId);
        
      if (permissionsError) {
        throw permissionsError;
      }
      
      // Map users with their access status
      const userIds = permissions ? permissions.map(p => p.user_id) : [];
      setSelectedUsers(userIds);
      
      const usersWithAccess = profiles.map(profile => ({
        ...profile,
        has_access: userIds.includes(profile.id)
      }));
      
      setUsers(usersWithAccess);
      setFilteredUsers(usersWithAccess);
      
    } catch (error) {
      console.error('Error fetching users and permissions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs et leurs permissions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      
      // Get current permissions
      const { data: currentPermissions, error: fetchError } = await supabase
        .from('wish_album_permissions')
        .select('user_id')
        .eq('album_id', albumId);
        
      if (fetchError) {
        throw fetchError;
      }
      
      const currentUserIds = currentPermissions?.map(p => p.user_id) || [];
      
      // Determine users to add and remove
      const usersToAdd = selectedUsers.filter(id => !currentUserIds.includes(id));
      const usersToRemove = currentUserIds.filter(id => !selectedUsers.includes(id));
      
      // Remove permissions for deselected users
      if (usersToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('wish_album_permissions')
          .delete()
          .eq('album_id', albumId)
          .in('user_id', usersToRemove);
          
        if (removeError) {
          throw removeError;
        }
      }
      
      // Add permissions for newly selected users
      if (usersToAdd.length > 0) {
        const newPermissions = usersToAdd.map(userId => ({
          album_id: albumId,
          user_id: userId
        }));
        
        const { error: addError } = await supabase
          .from('wish_album_permissions')
          .insert(newPermissions);
          
        if (addError) {
          throw addError;
        }
      }
      
      toast({
        title: "Permissions sauvegardées",
        description: "Les permissions d'accès à l'album ont été mises à jour."
      });
      
      onClose();
      
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les permissions.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Rechercher un utilisateur..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-tranches-sage border-t-transparent rounded-full"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucun utilisateur trouvé.</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Accès</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => toggleUserSelection(user.id)}
                    />
                  </TableCell>
                  <TableCell>{user.display_name || "-"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" disabled={saving} onClick={onClose}>
          <X className="mr-2 h-4 w-4" />
          Annuler
        </Button>
        <Button 
          onClick={handleSavePermissions} 
          disabled={saving}
          className="bg-tranches-sage hover:bg-tranches-sage/90"
        >
          <CheckCircle className="mr-2 h-4 w-4" />
          {saving ? "Sauvegarde en cours..." : "Sauvegarder"}
        </Button>
      </div>
    </div>
  );
};

export default WishAlbumPermissions;
