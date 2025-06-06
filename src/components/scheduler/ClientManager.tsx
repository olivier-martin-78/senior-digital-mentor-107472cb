
import React, { useState } from 'react';
import { Client } from '@/types/appointments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Users } from 'lucide-react';
import ClientForm from './ClientForm';
import CaregiverManager from './CaregiverManager';

interface ClientManagerProps {
  clients: Client[];
  onClientUpdate: () => void;
}

const ClientManager: React.FC<ClientManagerProps> = ({ clients, onClientUpdate }) => {
  const [showClientForm, setShowClientForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showCaregivers, setShowCaregivers] = useState<string | null>(null);

  const handleClientSave = () => {
    onClientUpdate();
    setShowClientForm(false);
    setSelectedClient(null);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setShowClientForm(true);
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
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div><strong>Adresse:</strong> {client.address}</div>
                {client.phone && <div><strong>Téléphone:</strong> {client.phone}</div>}
                {client.email && <div><strong>Email:</strong> {client.email}</div>}
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
    </div>
  );
};

export default ClientManager;
