
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

interface AlbumPermissionsProps {
  albumId: string;
  onClose: () => void;
}

const AlbumPermissions = ({ albumId, onClose }: AlbumPermissionsProps) => {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  console.log('🎬 AlbumPermissions - Composant monté avec albumId:', albumId);

  useEffect(() => {
    console.log('🔄 AlbumPermissions - useEffect fetchUsers déclenché');
    fetchUsers();
  }, [albumId]);

  useEffect(() => {
    console.log('🔍 AlbumPermissions - Filtrage utilisateurs, query:', searchQuery);
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        (user.display_name && user.display_name.toLowerCase().includes(lowercaseQuery)) ||
        user.email.toLowerCase().includes(lowercaseQuery)
      );
      console.log('📊 AlbumPermissions - Résultat filtrage:', {
        avant: users.length,
        après: filtered.length,
        query: searchQuery
      });
      setFilteredUsers(filtered);
    } else {
      console.log('📋 AlbumPermissions - Pas de filtrage, affichage tous les utilisateurs');
      setFilteredUsers(users);
    }
  }, [users, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('🚀 AlbumPermissions - DÉBUT fetchUsers');
      
      // Vérifier l'état de la session
      const { data: session } = await supabase.auth.getSession();
      console.log('🔐 AlbumPermissions - État session:', {
        hasSession: !!session.session,
        userId: session.session?.user?.id,
        userEmail: session.session?.user?.email
      });
      
      console.log('📋 AlbumPermissions - Récupération profils avec politiques RLS simplifiées');
      
      const startTime = Date.now();
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, email');
      
      const profilesTime = Date.now() - startTime;
      console.log(`⏱️ AlbumPermissions - Requête profiles terminée en ${profilesTime}ms`);
        
      if (profilesError) {
        console.error('❌ AlbumPermissions - Erreur profiles:', {
          error: profilesError,
          message: profilesError.message,
          details: profilesError.details,
          hint: profilesError.hint
        });
        throw profilesError;
      }
      
      console.log('✅ AlbumPermissions - Profiles récupérés:', {
        count: profiles?.length || 0,
        profiles: profiles?.map(p => ({ id: p.id, email: p.email }))
      });
      
      if (!profiles) {
        console.log('⚠️ AlbumPermissions - Aucun profil trouvé');
        setUsers([]);
        return;
      }
      
      console.log('🔑 AlbumPermissions - Récupération permissions album');
      const permissionsStartTime = Date.now();
      
      const { data: permissions, error: permissionsError } = await supabase
        .from('album_permissions')
        .select('user_id')
        .eq('album_id', albumId);
      
      const permissionsTime = Date.now() - permissionsStartTime;
      console.log(`⏱️ AlbumPermissions - Requête permissions terminée en ${permissionsTime}ms`);
        
      if (permissionsError) {
        console.error('❌ AlbumPermissions - Erreur permissions:', {
          error: permissionsError,
          message: permissionsError.message,
          albumId
        });
        // Continuer avec une liste vide si erreur de permissions
      }
      
      console.log('✅ AlbumPermissions - Permissions récupérées:', {
        count: permissions?.length || 0,
        permissions: permissions?.map(p => p.user_id)
      });
      
      // Mapper les utilisateurs avec leur statut d'accès
      const userIds = permissions ? permissions.map(p => p.user_id) : [];
      setSelectedUsers(userIds);
      
      const usersWithAccess = profiles.map(profile => ({
        ...profile,
        has_access: userIds.includes(profile.id)
      }));
      
      console.log('🎉 AlbumPermissions - RÉSULTAT FINAL:', {
        usersCount: usersWithAccess.length,
        usersWithAccess: usersWithAccess.filter(u => u.has_access).length,
        selectedUserIds: userIds
      });
      
      setUsers(usersWithAccess);
      setFilteredUsers(usersWithAccess);
      
    } catch (error) {
      console.error('💥 AlbumPermissions - ERREUR CRITIQUE:', {
        error: error,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        stack: error instanceof Error ? error.stack : undefined,
        albumId
      });
      toast({
        title: "Erreur",
        description: "Impossible de charger les utilisateurs et leurs permissions.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      console.log('🏁 AlbumPermissions - FIN fetchUsers, loading: false');
    }
  };

  const toggleUserSelection = (userId: string) => {
    console.log('🔄 AlbumPermissions - Toggle sélection utilisateur:', userId);
    setSelectedUsers(prev => {
      const newSelection = prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      console.log('📊 AlbumPermissions - Nouvelle sélection:', newSelection);
      return newSelection;
    });
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      console.log('💾 AlbumPermissions - DÉBUT sauvegarde permissions');
      
      // Récupérer les permissions actuelles
      const { data: currentPermissions, error: fetchError } = await supabase
        .from('album_permissions')
        .select('user_id')
        .eq('album_id', albumId);
        
      if (fetchError) {
        console.error('❌ AlbumPermissions - Erreur fetch permissions actuelles:', fetchError);
        // Continuer avec une liste vide
      }
      
      const currentUserIds = currentPermissions?.map(p => p.user_id) || [];
      console.log('📋 AlbumPermissions - Permissions actuelles:', currentUserIds);
      
      // Déterminer les utilisateurs à ajouter et supprimer
      const usersToAdd = selectedUsers.filter(id => !currentUserIds.includes(id));
      const usersToRemove = currentUserIds.filter(id => !selectedUsers.includes(id));
      
      console.log('📊 AlbumPermissions - Changements à appliquer:', {
        toAdd: usersToAdd,
        toRemove: usersToRemove,
        albumId
      });
      
      // Supprimer les permissions pour les utilisateurs désélectionnés
      if (usersToRemove.length > 0) {
        console.log('🗑️ AlbumPermissions - Suppression permissions:', usersToRemove);
        const { error: removeError } = await supabase
          .from('album_permissions')
          .delete()
          .eq('album_id', albumId)
          .in('user_id', usersToRemove);
          
        if (removeError) {
          console.error('❌ AlbumPermissions - Erreur suppression:', removeError);
        } else {
          console.log('✅ AlbumPermissions - Permissions supprimées avec succès');
        }
      }
      
      // Ajouter les permissions pour les utilisateurs nouvellement sélectionnés
      if (usersToAdd.length > 0) {
        const newPermissions = usersToAdd.map(userId => ({
          album_id: albumId,
          user_id: userId
        }));
        
        console.log('➕ AlbumPermissions - Ajout permissions:', newPermissions);
        const { error: addError } = await supabase
          .from('album_permissions')
          .insert(newPermissions);
          
        if (addError) {
          console.error('❌ AlbumPermissions - Erreur ajout:', addError);
        } else {
          console.log('✅ AlbumPermissions - Permissions ajoutées avec succès');
        }
      }
      
      console.log('🎉 AlbumPermissions - Sauvegarde terminée avec succès');
      toast({
        title: "Permissions sauvegardées",
        description: "Les permissions d'accès à l'album ont été mises à jour."
      });
      
      onClose();
      
    } catch (error) {
      console.error('💥 AlbumPermissions - ERREUR CRITIQUE sauvegarde:', {
        error: error,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
        albumId
      });
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les permissions.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
      console.log('🏁 AlbumPermissions - FIN sauvegarde, saving: false');
    }
  };

  console.log('🖼️ AlbumPermissions - Rendu composant');

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

export default AlbumPermissions;
