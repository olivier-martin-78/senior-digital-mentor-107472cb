
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';

interface UserOption {
  id: string;
  name: string;
  email: string;
}

interface UserSelectorProps {
  permissionType: 'life_story' | 'diary';
  selectedUserId: string | null;
  onUserChange: (userId: string | null) => void;
  className?: string;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  permissionType,
  selectedUserId,
  onUserChange,
  className = ""
}) => {
  const { user } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadAvailableUsers();
    }
  }, [user, permissionType]);

  const loadAvailableUsers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Ajouter l'utilisateur actuel en premier
      const currentUserOption: UserOption = {
        id: user.id,
        name: 'Mon profil',
        email: user.email || ''
      };

      let permissionTable = '';
      let ownerColumn = '';
      
      if (permissionType === 'life_story') {
        permissionTable = 'life_story_permissions';
        ownerColumn = 'story_owner_id';
      } else {
        permissionTable = 'diary_permissions';
        ownerColumn = 'diary_owner_id';
      }

      // Récupérer les utilisateurs auxquels l'utilisateur actuel a accès
      const { data: permissions, error } = await supabase
        .from(permissionTable)
        .select(`
          ${ownerColumn},
          profiles!${permissionTable}_${ownerColumn}_fkey (
            id,
            display_name,
            email
          )
        `)
        .eq('permitted_user_id', user.id);

      if (error) {
        console.error('Erreur lors du chargement des permissions:', error);
        setAvailableUsers([currentUserOption]);
        return;
      }

      const userOptions: UserOption[] = [currentUserOption];

      if (permissions && permissions.length > 0) {
        permissions.forEach((permission: any) => {
          const profile = permission.profiles;
          if (profile && profile.id !== user.id) {
            userOptions.push({
              id: profile.id,
              name: profile.display_name || profile.email,
              email: profile.email
            });
          }
        });
      }

      setAvailableUsers(userOptions);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      setAvailableUsers([{
        id: user.id,
        name: 'Mon profil',
        email: user.email || ''
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Si l'utilisateur n'a accès qu'à son propre contenu, ne pas afficher le sélecteur
  if (availableUsers.length <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <User className="h-4 w-4 text-gray-500" />
      <Select
        value={selectedUserId || user?.id || ''}
        onValueChange={onUserChange}
        disabled={loading}
      >
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Sélectionner un utilisateur" />
        </SelectTrigger>
        <SelectContent>
          {availableUsers.map((userOption) => (
            <SelectItem key={userOption.id} value={userOption.id}>
              <div className="flex flex-col">
                <span className="font-medium">{userOption.name}</span>
                <span className="text-xs text-gray-500">{userOption.email}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UserSelector;
