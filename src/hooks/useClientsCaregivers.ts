import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ClientCaregiverOption {
  id: string;
  name: string;
  type: 'client' | 'caregiver';
  city?: string;
  email?: string;
}

export const useClientsCaregivers = () => {
  const [options, setOptions] = useState<ClientCaregiverOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    if (session?.user?.id) {
      fetchClientsAndCaregivers();
    }
  }, [session?.user?.id]);

  const fetchClientsAndCaregivers = async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les clients créés par l'utilisateur
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, first_name, last_name, city, email')
        .eq('created_by', session?.user?.id);

      if (clientsError) throw clientsError;

      // Récupérer les aidants des clients de l'utilisateur
      const { data: caregivers, error: caregiversError } = await supabase
        .from('caregivers')
        .select(`
          id, 
          first_name, 
          last_name, 
          email,
          clients!inner(id, city, created_by)
        `)
        .eq('clients.created_by', session?.user?.id);

      if (caregiversError) throw caregiversError;

      // Transformer les données
      const clientOptions: ClientCaregiverOption[] = (clients || []).map(client => ({
        id: client.id,
        name: `${client.first_name} ${client.last_name}`,
        type: 'client' as const,
        city: client.city,
        email: client.email
      }));

      const caregiverOptions: ClientCaregiverOption[] = (caregivers || []).map(caregiver => ({
        id: caregiver.id,
        name: `${caregiver.first_name} ${caregiver.last_name} (Aidant)`,
        type: 'caregiver' as const,
        city: (caregiver.clients as any)?.city,
        email: caregiver.email
      }));

      setOptions([...clientOptions, ...caregiverOptions]);
    } catch (error) {
      console.error('Erreur lors du chargement des contacts:', error);
      setOptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    options,
    isLoading,
    refetch: fetchClientsAndCaregivers
  };
};