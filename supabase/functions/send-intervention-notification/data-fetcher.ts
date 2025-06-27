
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

    return report;
  }

  async fetchCaregivers(clientId: string): Promise<CaregiverData[]> {
    const { data: caregivers, error: caregiversError } = await this.supabase
      .from('caregivers')
      .select('first_name, last_name, email, relationship_type')
      .eq('client_id', clientId)
      .not('email', 'is', null);

    if (caregiversError) {
      console.error('❌ Erreur récupération proches aidants:', caregiversError);
      throw new Error('Erreur lors de la récupération des proches aidants');
    }

    return caregivers || [];
  }

  async markReportAsNotified(reportId: string): Promise<void> {
    await this.supabase
      .from('intervention_reports')
      .update({ email_notification_sent: true })
      .eq('id', reportId);
  }
}
