
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Client } from '@/types/appointments';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ClientForm from './ClientForm';

interface ClientManagerProps {
  clients: Client[];
  onClientUpdate: () => void;
}

const ClientManager: React.FC<ClientManagerProps> = ({ clients, onClientUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const { toast } = useToast();

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = async (clientId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Client supprimé avec succès'
      });

      onClientUpdate();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le client',
        variant: 'destructive'
      });
    }
  };

  const handleToggleActive = async (client: Client) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ inactive: !client.inactive })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `Client ${!client.inactive ? 'désactivé' : 'activé'} avec succès`
      });

      onClientUpdate();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut du client',
        variant: 'destructive'
      });
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingClient(null);
    onClientUpdate();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Gestion des clients</h3>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500 mb-4">Aucun client créé pour le moment.</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Créer le premier client
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {clients.map((client) => (
            <Card key={client.id} className={client.inactive ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg">
                      {client.first_name} {client.last_name}
                      {client.inactive && <span className="text-red-500 ml-2">(Inactif)</span>}
                    </h4>
                    <p className="text-gray-600">{client.address}</p>
                    {client.city && client.postal_code && (
                      <p className="text-gray-600">{client.postal_code} {client.city}</p>
                    )}
                    {client.phone && (
                      <p className="text-gray-600">Tél: {client.phone}</p>
                    )}
                    {client.email && (
                      <p className="text-gray-600">Email: {client.email}</p>
                    )}
                    {client.hourly_rate && (
                      <p className="text-gray-600">Tarif horaire: {client.hourly_rate}€</p>
                    )}
                    {client.comment && (
                      <p className="text-gray-500 text-sm mt-2">{client.comment}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id={`active-${client.id}`}
                        checked={!client.inactive}
                        onCheckedChange={() => handleToggleActive(client)}
                      />
                      <Label htmlFor={`active-${client.id}`} className="text-sm">
                        Actif
                      </Label>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(client)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(client.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <ClientForm
          client={editingClient}
          onSave={handleFormClose}
          onCancel={handleFormClose}
        />
      )}
    </div>
  );
};

export default ClientManager;
