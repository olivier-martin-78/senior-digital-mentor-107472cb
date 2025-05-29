
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
  const { user, hasRole } = useAuth();
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

      let permissions: any[] = [];

      // Si l'utilisateur est admin, charger tous les utilisateurs
      if (hasRole('admin')) {
        console.log('Mode admin : chargement de tous les utilisateurs');
        const { data: allProfiles, error } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .neq('id', user.id)
          .order('display_name');

        if (error) {
          console.error('Erreur lors du chargement de tous les profils:', error);
        } else if (allProfiles) {
          permissions = allProfiles.map(profile => ({
            profiles: profile,
            owner_id: profile.id
          }));
        }
      } else {
        // Pour les non-admins, utiliser la logique de permissions existante
        if (permissionType === 'life_story') {
          const { data, error } = await supabase
            .from('life_story_permissions')
            .select(`
              story_owner_id,
              profiles!life_story_permissions_story_owner_id_fkey (
                id,
                display_name,
                email
              )
            `)
            .eq('permitted_user_id', user.id);

          if (error) {
            console.error('Erreur lors du chargement des permissions life_story:', error);
          } else {
            permissions = (data || []).map(p => ({
              ...p,
              owner_id: p.story_owner_id
            }));
          }
        } else if (permissionType === 'diary') {
          const [diaryPermsResult, lifeStoryPermsResult] = await Promise.all([
            supabase
              .from('diary_permissions')
              .select(`
                diary_owner_id,
                profiles!diary_permissions_diary_owner_id_fkey (
                  id,
                  display_name,
                  email
                )
              `)
              .eq('permitted_user_id', user.id),
            supabase
              .from('life_story_permissions')
              .select(`
                story_owner_id,
                profiles!life_story_permissions_story_owner_id_fkey (
                  id,
                  display_name,
                  email
                )
              `)
              .eq('permitted_user_id', user.id)
          ]);

          const diaryPermissions = diaryPermsResult.data || [];
          const lifeStoryPermissions = lifeStoryPermsResult.data || [];

          const combinedPermissions = [
            ...diaryPermissions.map(p => ({
              ...p,
              owner_id: p.diary_owner_id
            })),
            ...lifeStoryPermissions.map(p => ({
              ...p,
              owner_id: p.story_owner_id
            }))
          ];

          permissions = combinedPermissions;

          if (diaryPermsResult.error) {
            console.error('Erreur lors du chargement des permissions diary:', diaryPermsResult.error);
          }
          if (lifeStoryPermsResult.error) {
            console.error('Erreur lors du chargement des permissions life_story:', lifeStoryPermsResult.error);
          }
        }
      }

      const userOptions: UserOption[] = [currentUserOption];

      if (permissions && permissions.length > 0) {
        const seenUserIds = new Set([user.id]);
        
        permissions.forEach((permission: any) => {
          const profile = permission.profiles;
          const userId = profile?.id;
          
          if (profile && userId && !seenUserIds.has(userId)) {
            seenUserIds.add(userId);
            userOptions.push({
              id: userId,
              name: profile.display_name || profile.email,
              email: profile.email
            });
          }
        });
      }

      console.log('UserSelector - Utilisateurs disponibles:', userOptions.length);
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

  // Toujours afficher le sélecteur s'il y a plus d'un utilisateur OU si l'utilisateur est admin
  if (!hasRole('admin') && availableUsers.length <= 1) {
    return null;
  }

  const handleUserChange = (value: string) => {
    console.log('UserSelector - Changement d\'utilisateur:', value);
    if (value === user?.id) {
      onUserChange(null); // Réinitialiser à l'utilisateur actuel
    } else {
      onUserChange(value);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <User className="h-4 w-4 text-gray-500" />
      <Select
        value={selectedUserId || user?.id || ''}
        onValueChange={handleUserChange}
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
