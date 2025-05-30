
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface UserProfile {
  id: string;
  display_name: string | null;
  email: string;
}

interface UserSelectorProps {
  permissionType: 'life_story' | 'diary' | 'blog';
  selectedUserId: string | null;
  onUserChange: (userId: string | null) => void;
  className?: string;
}

const UserSelector: React.FC<UserSelectorProps> = ({
  permissionType,
  selectedUserId,
  onUserChange,
  className = ''
}) => {
  const { user, hasRole } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailableUsers();
  }, [user, permissionType]);

  const loadAvailableUsers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const users: UserProfile[] = [];

      if (hasRole('admin')) {
        // Les admins voient tous les utilisateurs
        const { data: allUsers, error } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .order('display_name');

        if (!error && allUsers) {
          users.push(...allUsers);
        }
      } else {
        // Récupérer les utilisateurs autorisés via les groupes d'invitation seulement
        const { data: groupPermissions, error: groupError } = await supabase
          .from('group_members')
          .select(`
            group_id,
            invitation_groups!inner(created_by)
          `)
          .eq('user_id', user.id);

        if (!groupError && groupPermissions) {
          // Récupérer les IDs des créateurs de groupes
          const creatorIds = [...new Set(groupPermissions.map(p => p.invitation_groups.created_by))];
          
          if (creatorIds.length > 0) {
            // Récupérer les profils des créateurs
            const { data: creatorProfiles, error: creatorError } = await supabase
              .from('profiles')
              .select('id, display_name, email')
              .in('id', creatorIds)
              .order('display_name');

            if (!creatorError && creatorProfiles) {
              users.push(...creatorProfiles);
            }
          }
        }
      }

      console.log('UserSelector - Utilisateurs disponibles:', users.length);
      setAvailableUsers(users);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSelection = () => {
    onUserChange(null);
  };

  const getCurrentUserDisplay = () => {
    if (!selectedUserId) return 'Mes contenus';
    
    const selectedUser = availableUsers.find(u => u.id === selectedUserId);
    if (selectedUser) {
      return `Contenus de ${selectedUser.display_name || selectedUser.email}`;
    }
    
    return 'Utilisateur sélectionné';
  };

  // Ne pas afficher le sélecteur s'il n'y a pas d'autres utilisateurs disponibles
  if (!hasRole('admin') && availableUsers.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Voir les contenus de :</span>
        
        <Select
          value={selectedUserId || 'my-content'}
          onValueChange={(value) => onUserChange(value === 'my-content' ? null : value)}
          disabled={loading}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder={loading ? "Chargement..." : getCurrentUserDisplay()} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="my-content">Mes contenus</SelectItem>
            {availableUsers.map(userProfile => (
              <SelectItem key={userProfile.id} value={userProfile.id}>
                {userProfile.display_name || userProfile.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedUserId && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearSelection}
            className="p-2 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default UserSelector;
