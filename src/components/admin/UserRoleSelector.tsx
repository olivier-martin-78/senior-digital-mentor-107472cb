
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { validatePermissions, rateLimiter } from '@/utils/securityUtils';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user, roles: userRoles } = useAuth();
  const [selectedRole, setSelectedRole] = useState<AppRole>(currentRole);
  const [isUpdating, setIsUpdating] = useState(false);

  const availableRoles: { value: AppRole; label: string }[] = [
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

    // Vérification de sécurité: l'utilisateur actuel doit être admin
    if (!validatePermissions(userRoles, 'admin')) {
      toast({
        title: 'Accès refusé',
        description: 'Vous n\'avez pas les permissions pour modifier les rôles',
        variant: 'destructive',
      });
      return;
    }

    // Rate limiting par utilisateur
    const userIdentifier = `role-change-${user?.id}`;
    if (!rateLimiter.isAllowed(userIdentifier)) {
      toast({
        title: 'Trop de tentatives',
        description: 'Veuillez patienter avant de modifier d\'autres rôles',
        variant: 'destructive',
      });
      return;
    }

    // Validation côté client - empêcher l'escalade de privilèges
    if (currentRole === 'admin' && selectedRole !== 'admin') {
      const confirmChange = window.confirm(
        '⚠️ ATTENTION: Vous allez retirer les privilèges administrateur. Cette action est irréversible. Êtes-vous sûr?'
      );
      if (!confirmChange) return;
    }

    if (selectedRole === 'admin' && currentRole !== 'admin') {
      const confirmChange = window.confirm(
        '⚠️ ATTENTION: Vous allez accorder des privilèges administrateur complets. Êtes-vous sûr?'
      );
      if (!confirmChange) return;
    }

    try {
      setIsUpdating(true);

      // Log de sécurité pour audit
      console.log(`[AUDIT] Role change attempt: ${currentRole} -> ${selectedRole} for user ${userId} by admin ${user?.id} at ${new Date().toISOString()}`);

      // Vérifier si le nouveau rôle existe déjà pour éviter la duplication
      const { data: existingRoles, error: checkError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (checkError) throw checkError;

      const hasNewRole = existingRoles?.some(r => r.role === selectedRole);
      
      if (hasNewRole) {
        // Si le nouveau rôle existe déjà, supprimer l'ancien rôle seulement
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', currentRole);

        if (deleteError) throw deleteError;
      } else {
        // Stratégie DELETE + INSERT pour éviter les conflits de contrainte unique
        // 1. Supprimer l'ancien rôle spécifique
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', currentRole);

        if (deleteError) throw deleteError;

        // 2. Insérer le nouveau rôle
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert({
            user_id: userId,
            role: selectedRole
          });

        if (insertError) throw insertError;
      }

      // Log de succès
      console.log(`[AUDIT] Role updated successfully: ${currentRole} -> ${selectedRole} for user ${userId}`);
      
      onRoleChange(selectedRole);

      toast({
        title: 'Rôle mis à jour',
        description: `Le rôle de l'utilisateur a été changé vers ${availableRoles.find(r => r.value === selectedRole)?.label}`,
      });

      // Log audit trail to database
      try {
        await supabase
          .from('user_actions')
          .insert({
            user_id: user?.id,
            action_type: 'role_change',
            content_type: 'user_role',
            content_id: userId,
            content_title: `Role change: ${currentRole} -> ${selectedRole}`,
            metadata: {
              old_role: currentRole,
              new_role: selectedRole,
              timestamp: new Date().toISOString()
            }
          });
      } catch (auditError) {
        console.error('Failed to log audit trail:', auditError);
      }

    } catch (error: any) {
      console.error(`[SECURITY ERROR] Role change failed for user ${userId}:`, error);
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
