
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Client, Intervenant } from '@/types/appointments';

interface SchedulerFiltersProps {
  clients: Client[];
  intervenants: Intervenant[];
  selectedClientId: string | null;
  selectedIntervenantId: string | null;
  onClientChange: (clientId: string | null) => void;
  onIntervenantChange: (intervenantId: string | null) => void;
}

const SchedulerFilters: React.FC<SchedulerFiltersProps> = ({
  clients,
  intervenants,
  selectedClientId,
  selectedIntervenantId,
  onClientChange,
  onIntervenantChange,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
      <div className="space-y-2">
        <Label htmlFor="client-filter" className="text-sm font-medium">Filtrer par client</Label>
        <Select 
          value={selectedClientId || 'all'} 
          onValueChange={(value) => onClientChange(value === 'all' ? null : value)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Tous les clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                <span className="truncate">{client.first_name} {client.last_name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="intervenant-filter" className="text-sm font-medium">Filtrer par intervenant</Label>
        <Select 
          value={selectedIntervenantId || 'all'} 
          onValueChange={(value) => onIntervenantChange(value === 'all' ? null : value)}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Tous les intervenants" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les intervenants</SelectItem>
            {intervenants.map((intervenant) => (
              <SelectItem key={intervenant.id} value={intervenant.id}>
                <span className="truncate">{intervenant.first_name} {intervenant.last_name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default SchedulerFilters;
