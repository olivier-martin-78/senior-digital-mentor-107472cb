
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface InterventionReport {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  auxiliary_name: string;
  patient_name: string;
  client_rating?: number;
  client_comments?: string;
  observations?: string;
  professional_id: string;
  appointment_id?: string;
  client_id?: string;
}

export const useInterventionReports = () => {
  const { session } = useAuth();
  const [interventionReports, setInterventionReports] = useState<InterventionReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInterventionReports = async () => {
    if (!session?.user) {
      console.log('❌ Pas d\'utilisateur connecté');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔍 Récupération optimisée des rapports d\'intervention...');
      
      // Requête optimisée : spécifier explicitement la relation à utiliser
      const { data: reports, error } = await supabase
        .from('intervention_reports')
        .select(`
          id,
          date,
          start_time,
          end_time,
          auxiliary_name,
          patient_name,
          client_rating,
          client_comments,
          observations,
          professional_id,
          appointment_id,
          appointments!intervention_reports_appointment_id_fkey(
            client_id
          )
        `)
        .order('date', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ Erreur lors de la récupération des rapports:', error);
        setInterventionReports([]);
      } else {
        console.log('✅ Rapports d\'intervention optimisés trouvés:', reports?.length || 0);
        
        // Transformer les données pour correspondre à l'interface attendue
        const transformedReports = reports?.map(report => ({
          ...report,
          client_id: report.appointments?.client_id
        })) || [];
        
        setInterventionReports(transformedReports);
      }
    } catch (error) {
      console.error('❌ Erreur générale lors du chargement des rapports:', error);
      setInterventionReports([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventionReports();
  }, [session]);

  return {
    interventionReports,
    isLoading,
    refetch: fetchInterventionReports
  };
};
