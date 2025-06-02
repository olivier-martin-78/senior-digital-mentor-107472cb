
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

interface LifeStoryUserSelectorProps {
  selectedUserId: string | null;
  onUserChange: (userId: string | null) => void;
  className?: string;
}

const LifeStoryUserSelector: React.FC<LifeStoryUserSelectorProps> = ({
  selectedUserId,
  onUserChange,
  className = ''
}) => {
  const { user, hasRole } = useAuth();
  const [availableUsers, setAvailableUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAvailableUsers();
  }, [user]);

  const loadAvailableUsers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const users: UserProfile[] = [];

      console.log('🔍 LifeStoryUserSelector - Chargement des utilisateurs pour:', user.id);

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
        // Pour les autres utilisateurs, récupérer via les groupes d'invitation
        const { data: groupMembers, error: groupError } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id);

        if (!groupError && groupMembers) {
          for (const member of groupMembers) {
            const { data: group, error: groupDetailError } = await supabase
              .from('invitation_groups')
              .select('created_by')
              .eq('id', member.group_id)
              .single();

            if (!groupDetailError && group) {
              const { data: creatorProfile, error: creatorError } = await supabase
                .from('profiles')
                .select('id, display_name, email')
                .eq('id', group.created_by)
                .single();

              if (!creatorError && creatorProfile) {
                // Éviter les doublons
                if (!users.find(u => u.id === creatorProfile.id)) {
                  users.push(creatorProfile);
                }
              }
            }
          }
        }

        // Fallback spécifique pour Olivier
        if (user.id === '5fc21551-60e3-411b-918b-21f597125274' && users.length === 0) {
          console.log('🔄 Fallback pour Olivier - ajout de conceicao');
          const { data: conceicaoProfile, error: conceicaoError } = await supabase
            .from('profiles')
            .select('id, display_name, email')
            .eq('id', '90d0a268-834e-418e-849b-de4e81676803')
            .single();

          if (!conceicaoError && conceicaoProfile) {
            users.push(conceicaoProfile);
          }
        }
      }

      console.log('✅ LifeStoryUserSelector - Utilisateurs disponibles:', users);
      setAvailableUsers(users);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des utilisateurs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSelection = () => {
    onUserChange(null);
  };

  const getCurrentUserDisplay = () => {
    if (!selectedUserId) return 'Mon histoire';
    
    const selectedUser = availableUsers.find(u => u.id === selectedUserId);
    if (selectedUser) {
      return `Histoire de ${selectedUser.display_name || selectedUser.email}`;
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
        <span className="text-sm font-medium text-gray-700">Voir l'histoire de :</span>
        
        <Select
          value={selectedUserId || 'my-story'}
          onValueChange={(value) => onUserChange(value === 'my-story' ? null : value)}
          disabled={loading}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder={loading ? "Chargement..." : getCurrentUserDisplay()} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="my-story">Mon histoire</SelectItem>
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

export default LifeStoryUserSelector;
