
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

// Utiliser le type AppRole depuis l'intégration Supabase
type AppRole = Database['public']['Enums']['app_role'];

interface UserRoleSelectorProps {
  userId: string;
  currentRole: AppRole;
  onRoleChange: (newRole: AppRole) => void;
}

const UserRoleSelector: React.FC<UserRoleSelectorProps> = ({
  userId,
  currentRole,
  onRoleChange,
}) => {
  const [selectedRole, setSelectedRole] = useState<AppRole>(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);

  const roles: { value: AppRole; label: string }[] = [
    { value: 'reader', label: 'Lecteur' },
    { value: 'editor', label: 'Éditeur' },
    { value: 'professionnel', label: 'Professionnel' },
    { value: 'admin', label: 'Administrateur' },
  ];

  const handleRoleUpdate = async () => {
    if (selectedRole === currentRole) {
      toast({
        title: 'Information',
        description: 'Le rôle sélectionné est identique au rôle actuel',
      });
      return;
    }

    // Validation côté client - empêcher l'escalade de privilèges
    if (currentRole === 'admin' && selectedRole !== 'admin') {
      const confirmChange = window.confirm(
        'Attention: Vous êtes sur le point de retirer les privilèges admin. Êtes-vous sûr?'
      );
      if (!confirmChange) return;
    }

    try {
      setIsUpdating(true);

      // Log de sécurité pour audit
      console.log(`🔐 Tentative de changement de rôle: ${currentRole} -> ${selectedRole} pour l'utilisateur ${userId}`);

      const { error } = await supabase
        .from('user_roles')
        .update({ role: selectedRole })
        .eq('user_id', userId);

      if (error) throw error;

      // Log de succès
      console.log(`✅ Rôle mis à jour avec succès: ${currentRole} -> ${selectedRole} pour l'utilisateur ${userId}`);
      
      onRoleChange(selectedRole);

      toast({
        title: 'Rôle mis à jour',
        description: `Le rôle de l'utilisateur a été changé vers ${roles.find(r => r.value === selectedRole)?.label}`,
      });
    } catch (error: any) {
      console.error(`❌ Erreur lors du changement de rôle pour l'utilisateur ${userId}:`, error);
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
          {roles.map((role) => (
            <SelectItem key={role.value} value={role.value}>
              {role.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        onClick={handleRoleUpdate}
        disabled={isUpdating || selectedRole === currentRole}
        size="sm"
      >
        {isUpdating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Mise à jour...
          </>
        ) : (
          'Mettre à jour'
        )}
      </Button>
    </div>
  );
};

export default UserRoleSelector;
