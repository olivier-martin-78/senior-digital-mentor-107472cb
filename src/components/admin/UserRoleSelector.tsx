
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { AppRole } from '@/types/supabase';

interface UserRoleSelectorProps {
  userId: string;
  currentRole: AppRole;
  onRoleChanged: () => void;
}

const UserRoleSelector: React.FC<UserRoleSelectorProps> = ({
  userId,
  currentRole,
  onRoleChanged
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole>(currentRole);

  const availableRoles: { value: AppRole; label: string }[] = [
    { value: 'reader', label: 'Lecteur' },
    { value: 'user', label: 'Utilisateur' },
    { value: 'editor', label: 'Éditeur' },
    { value: 'moderator', label: 'Modérateur' },
    { value: 'professionnel', label: 'Professionnel' },
    { value: 'admin', label: 'Administrateur' }
  ];

  const handleRoleChange = async () => {
    if (selectedRole === currentRole) {
      toast({
        title: 'Information',
        description: 'Le rôle sélectionné est identique au rôle actuel.',
      });
      return;
    }

    try {
      setIsUpdating(true);

      const { error } = await supabase
        .from('user_roles')
        .update({ role: selectedRole })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      toast({
        title: 'Rôle mis à jour',
        description: `Le rôle de l'utilisateur a été changé vers "${availableRoles.find(r => r.value === selectedRole)?.label}".`,
      });

      onRoleChanged();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de mettre à jour le rôle : ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedRole} onValueChange={(value: AppRole) => setSelectedRole(value)}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map((role) => (
            <SelectItem key={role.value} value={role.value}>
              {role.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={handleRoleChange}
        disabled={isUpdating || selectedRole === currentRole}
        size="sm"
      >
        {isUpdating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Mise à jour...
          </>
        ) : (
          'Changer'
        )}
      </Button>
    </div>
  );
};

export default UserRoleSelector;
