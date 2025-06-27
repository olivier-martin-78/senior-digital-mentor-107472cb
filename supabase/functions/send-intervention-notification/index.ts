
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { InterventionNotificationRequest } from './types.ts';
import { DataFetcher } from './data-fetcher.ts';
import { EmailSender } from './email-sender.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-connection-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportId, title }: InterventionNotificationRequest = await req.json();

    console.log('📧 Envoi notification rapport intervention:', { reportId, title });

    const dataFetcher = new DataFetcher();
    const emailSender = new EmailSender();

    // 1. Récupérer le rapport d'intervention avec les informations du rendez-vous et du client
    const report = await dataFetcher.fetchReport(reportId);
    if (!report) {
      throw new Error('Rapport d\'intervention introuvable');
    }

    const clientName = `${report.appointments?.clients?.first_name} ${report.appointments?.clients?.last_name}`;
    console.log('✅ Rapport récupéré:', {
      reportId: report.id,
      clientId: report.appointments?.clients?.id,
      clientName
    });

    // 2. Récupérer les proches aidants du client
    const caregivers = await dataFetcher.fetchCaregivers(report.appointments?.clients?.id || '');

    if (!caregivers || caregivers.length === 0) {
      console.log('⚠️ Aucun proche aidant avec email trouvé pour le client');
      return new Response(
        JSON.stringify({ 
          message: 'Aucun proche aidant avec email trouvé pour ce client',
          success: false 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('✅ Proches aidants trouvés:', caregivers.map(c => ({ 
      name: `${c.first_name} ${c.last_name}`, 
      email: c.email,
      relationship: c.relationship_type
    })));

    // 3. URL du rapport pour consultation en ligne
    const reportUrl = `https://a2978196-c5c0-456b-9958-c4dc20b52bea.lovableproject.com/intervention-report?report_id=${reportId}`;

    // 4. Envoyer les emails aux proches aidants
    const { successCount, failureCount } = await emailSender.sendNotifications(
      report,
      caregivers,
      clientName,
      reportUrl
    );

    console.log('📧 Résultats envoi emails:', { 
      total: caregivers.length, 
      success: successCount, 
      failures: failureCount 
    });

    // 5. Marquer le rapport comme notifié si au moins un email a été envoyé
    if (successCount > 0) {
      await dataFetcher.markReportAsNotified(reportId);
      console.log('✅ Rapport marqué comme notifié');
    }

    // 6. Retourner le résultat
    return new Response(
      JSON.stringify({
        success: true,
        message: `Notification envoyée à ${successCount} proche(s) aidant(s)`,
        details: {
          sent: successCount,
          failed: failureCount,
          recipients: caregivers.map(c => `${c.first_name} ${c.last_name} (${c.email})`)
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("❌ Erreur fonction send-intervention-notification:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
