
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InterventionReport } from '@/types/intervention';
import { toast } from '@/hooks/use-toast';

interface LastReport {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  patient_name: string;
  auxiliary_name: string;
}

export const useLastReports = (clientName?: string) => {
  const [lastReports, setLastReports] = useState<LastReport[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLastReports = async () => {
    if (!clientName || clientName.trim() === '') {
      setLastReports([]);
      return;
    }

    try {
      setLoading(true);
      
      const { data: reports, error } = await supabase
        .from('intervention_reports')
        .select('id, date, start_time, end_time, patient_name, auxiliary_name')
        .eq('patient_name', clientName)
        .order('date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Erreur lors du chargement des derniers rapports:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les derniers rapports',
          variant: 'destructive',
        });
        return;
      }

      setLastReports(reports || []);
    } catch (error) {
      console.error('Erreur inattendue:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFullReport = async (reportId: string): Promise<InterventionReport | null> => {
    try {
      const { data: report, error } = await supabase
        .from('intervention_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error) {
        console.error('Erreur lors du chargement du rapport complet:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le rapport complet',
          variant: 'destructive',
        });
        return null;
      }

      return report;
    } catch (error) {
      console.error('Erreur inattendue:', error);
      return null;
    }
  };

  useEffect(() => {
    loadLastReports();
  }, [clientName]);

  return {
    lastReports,
    loading,
    loadFullReport,
    refreshReports: loadLastReports,
  };
};
