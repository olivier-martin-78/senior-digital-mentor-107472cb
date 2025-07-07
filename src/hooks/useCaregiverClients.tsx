
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CaregiverClient {
  id: string;
  first_name: string;
  last_name: string;
  address: string;
  phone?: string;
  email?: string;
}

export const useCaregiverClients = () => {
  const { session } = useAuth();
  const [clients, setClients] = useState<CaregiverClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchClients = async () => {
    if (!session?.user) {
      console.log('❌ Pas d\'utilisateur connecté pour les clients');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔍 Récupération optimisée des clients...');

      // Paralléliser les deux requêtes pour récupérer les clients
      const [caregiverClientsResponse, professionalClientsResponse] = await Promise.all([
        // Clients via caregivers
        supabase
          .from('caregivers')
          .select(`
            client_id,
            clients:client_id (
              id,
              first_name,
              last_name,
              address,
              phone,
              email
            )
          `)
          .eq('email', session.user.email),
        
        // Clients via appointments
        supabase
          .from('appointments')
          .select(`
            client_id,
            clients:client_id (
              id,
              first_name,
              last_name,
              address,
              phone,
              email
            )
          `)
          .eq('professional_id', session.user.id)
      ]);

      const { data: caregiverClients, error: caregiverError } = caregiverClientsResponse;
      const { data: professionalClients, error: professionalError } = professionalClientsResponse;

      if (caregiverError) {
        console.error('❌ Erreur clients aidant:', caregiverError);
      }
      if (professionalError) {
        console.error('❌ Erreur clients professionnel:', professionalError);
      }

      // Fusionner et dédupliquer les clients
      const allClients = new Map<string, CaregiverClient>();
      
      caregiverClients?.forEach(item => {
        if (item.clients) {
          allClients.set(item.clients.id, item.clients as CaregiverClient);
        }
      });

      professionalClients?.forEach(item => {
        if (item.clients) {
          allClients.set(item.clients.id, item.clients as CaregiverClient);
        }
      });

      const clientsList = Array.from(allClients.values());
      setClients(clientsList);
      console.log('✅ Clients optimisés trouvés:', clientsList.length);

    } catch (error) {
      console.error('❌ Erreur générale lors du chargement des clients:', error);
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [session]);

  return {
    clients,
    isLoading,
    refetch: fetchClients
  };
};
