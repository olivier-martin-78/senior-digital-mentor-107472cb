
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, UserCheck, UserX } from 'lucide-react';

interface ProfessionalUser {
  id: string;
  display_name: string;
  email: string;
}

interface ProfessionalUserSelectorProps {
  onUsersSelected: (userIds: string[]) => void;
  selectedUserIds?: string[];
  excludeCurrentUser?: boolean;
}

const ProfessionalUserSelector: React.FC<ProfessionalUserSelectorProps> = ({
  onUsersSelected,
  selectedUserIds = [],
  excludeCurrentUser = true
}) => {
  const [professionalUsers, setProfessionalUsers] = useState<ProfessionalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedUserIds);

  useEffect(() => {
    fetchProfessionalUsers();
  }, []);

  const fetchProfessionalUsers = async () => {
    try {
      setLoading(true);
      
      const { data: currentUser } = await supabase.auth.getUser();
      const { data, error } = await supabase.rpc('get_professional_users');

      if (error) throw error;

      // Filtrer l'utilisateur actuel si demandé
      const filteredUsers = excludeCurrentUser 
        ? data?.filter(user => user.id !== currentUser.user?.id) || []
        : data || [];

      setProfessionalUsers(filteredUsers);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs professionnels:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer la liste des professionnels',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    const newSelectedIds = localSelectedIds.includes(userId)
      ? localSelectedIds.filter(id => id !== userId)
      : [...localSelectedIds, userId];
    
    setLocalSelectedIds(newSelectedIds);
    onUsersSelected(newSelectedIds);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (professionalUsers.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-6">
          <UserX className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Aucun autre professionnel disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Sélectionner les professionnels
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {professionalUsers.map((user) => (
          <div key={user.id} className="flex items-center space-x-3 p-2 border rounded hover:bg-gray-50">
            <Checkbox
              id={user.id}
              checked={localSelectedIds.includes(user.id)}
              onCheckedChange={() => handleUserToggle(user.id)}
            />
            <div className="flex-1">
              <label htmlFor={user.id} className="cursor-pointer">
                <div className="font-medium">{user.display_name || 'Nom non défini'}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </label>
            </div>
            {localSelectedIds.includes(user.id) && (
              <UserCheck className="h-4 w-4 text-green-500" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default ProfessionalUserSelector;
