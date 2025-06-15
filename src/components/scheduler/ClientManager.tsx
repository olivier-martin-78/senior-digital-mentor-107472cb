
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Client } from '@/types/appointments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Users, Share2, Trash2 } from 'lucide-react';
import ClientForm from './ClientForm';
import CaregiverManager from './CaregiverManager';
import ClientSharingDialog from './ClientSharingDialog';

interface ClientManagerProps {
  clients: Client[];
  onClientUpdate: () => void;
}

const ClientManager: React.FC<ClientManagerProps> = ({ clients, onClientUpdate }) => {
  const [showClientForm, setShowClientForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showCaregivers, setShowCaregivers] = useState<string | null>(null);
  const [showSharingDialog, setShowSharingDialog] = useState(false);
  const [clientToShare, setClientToShare] = useState<Client | null>(null);

  const handleClientSave = () => {
    onClientUpdate();
    setShowClientForm(false);
    setSelectedClient(null);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientForm(true);
  };

  const handleShareClient = (client: Client) => {
    setClientToShare(client);
    setShowSharingDialog(true);
  };

  const handleDeleteClient = async (client: Client) => {
    try {
      // Vérifier si le client peut être supprimé
      const { data: canDelete, error: checkError } = await supabase.rpc('can_delete_client', {
        client_id_param: client.id
      });

      if (checkError) throw checkError;

      if (!canDelete) {
        toast({
          title: 'Suppression impossible',
          description: 'Ce client a des rendez-vous planifiés ou terminés et ne peut pas être supprimé.',
          variant: 'destructive'
        });
        return;
      }

      if (!confirm(`Êtes-vous sûr de vouloir supprimer le client ${client.first_name} ${client.last_name} ?`)) {
        return;
      }

      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Client supprimé avec succès'
      });

      onClientUpdate();
    } catch (error: any) {
      console.error('Erreur lors de la suppression du client:', error);
      toast({
        title: 'Erreur',
        description: `Impossible de supprimer le client: ${error.message}`,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">Gestion des clients</h2>
        <Button onClick={() => setShowClientForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouveau client
        </Button>
      </div>

      <div className="grid gap-4">
        {clients.map(client => (
          <Card key={client.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>{client.first_name} {client.last_name}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShareClient(client)}
                    title="Partager le client"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCaregivers(showCaregivers === client.id ? null : client.id)}
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditClient(client)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteClient(client)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>Adresse:</strong> {client.address}</div>
                {(client.postal_code || client.city) && (
                  <div>
                    <strong>Code postal / Ville:</strong> {client.postal_code} {client.city}
                  </div>
                )}
                {client.phone && <div><strong>Téléphone:</strong> {client.phone}</div>}
                {client.email && <div><strong>Email:</strong> {client.email}</div>}
                {client.hourly_rate && <div><strong>Prix horaire:</strong> {client.hourly_rate}€</div>}
                {client.comment && <div><strong>Commentaire:</strong> {client.comment}</div>}
              </div>
              
              {showCaregivers === client.id && (
                <div className="mt-4 pt-4 border-t">
                  <CaregiverManager clientId={client.id} />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {showClientForm && (
        <ClientForm
          client={selectedClient}
          onSave={handleClientSave}
          onCancel={() => {
            setShowClientForm(false);
            setSelectedClient(null);
          }}
        />
      )}

      <ClientSharingDialog
        client={clientToShare}
        open={showSharingDialog}
        onOpenChange={setShowSharingDialog}
        onSuccess={onClientUpdate}
      />
    </div>
  );
};

export default ClientManager;
