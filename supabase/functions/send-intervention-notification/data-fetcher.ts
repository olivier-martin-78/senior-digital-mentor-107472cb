
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { ReportData, CaregiverData } from './types.ts';

export class DataFetcher {
  private supabase;

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
  }

  async fetchReport(reportId: string): Promise<ReportData | null> {
    console.log('🔍 Récupération du rapport:', reportId);
    
    const { data: report, error: reportError } = await this.supabase
      .from('intervention_reports')
      .select(`
        *,
        appointments!intervention_reports_appointment_id_fkey (
          id,
          client_id,
          clients (
            id,
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('id', reportId)
      .single();

    if (reportError) {
      console.error('❌ Erreur récupération rapport:', reportError);
      throw new Error('Rapport d\'intervention introuvable');
    }

    console.log('✅ Rapport récupéré:', {
      id: report?.id,
      appointmentId: report?.appointment_id,
      clientInfo: report?.appointments?.clients
    });

    return report;
  }

  async fetchCaregivers(clientId: string): Promise<CaregiverData[]> {
    console.log('🔍 Recherche des proches aidants pour le client:', clientId);
    
    if (!clientId) {
      console.error('❌ ID client manquant');
      return [];
    }

    const { data: caregivers, error: caregiversError } = await this.supabase
      .from('caregivers')
      .select('first_name, last_name, email, relationship_type')
      .eq('client_id', clientId)
      .not('email', 'is', null);

    if (caregiversError) {
      console.error('❌ Erreur récupération proches aidants:', caregiversError);
      throw new Error('Erreur lors de la récupération des proches aidants');
    }

    console.log('📊 Résultat recherche proches aidants:', {
      clientId,
      count: caregivers?.length || 0,
      caregivers: caregivers?.map(c => ({ 
        name: `${c.first_name} ${c.last_name}`, 
        email: c.email,
        relationship: c.relationship_type 
      })) || []
    });

    return caregivers || [];
  }

  async markReportAsNotified(reportId: string): Promise<void> {
    await this.supabase
      .from('intervention_reports')
      .update({ email_notification_sent: true })
      .eq('id', reportId);
  }
}
