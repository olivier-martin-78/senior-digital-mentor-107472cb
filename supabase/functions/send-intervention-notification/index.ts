
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

    console.log('📧 === DÉBUT NOTIFICATION INTERVENTION ===');
    console.log('📧 Paramètres reçus:', { reportId, title });

    const dataFetcher = new DataFetcher();
    const emailSender = new EmailSender();

    // 1. Récupérer le rapport d'intervention avec les informations du rendez-vous et du client
    console.log('🔍 Étape 1: Récupération du rapport');
    const report = await dataFetcher.fetchReport(reportId);
    if (!report) {
      console.error('❌ Rapport introuvable');
      throw new Error('Rapport d\'intervention introuvable');
    }

    // Analyser la structure des données
    console.log('📊 Analyse structure rapport:', {
      hasAppointments: !!report.appointments,
      appointmentId: report.appointment_id,
      appointmentsData: report.appointments
    });

    // Déterminer l'ID du client
    let clientId: string | undefined;
    let clientName: string;

    if (report.appointments?.clients) {
      clientId = report.appointments.clients.id;
      clientName = `${report.appointments.clients.first_name} ${report.appointments.clients.last_name}`;
    } else {
      console.error('❌ Données client manquantes dans le rapport');
      console.log('🔍 Structure complète du rapport:', JSON.stringify(report, null, 2));
      throw new Error('Informations client manquantes dans le rapport');
    }

    console.log('✅ Client identifié:', { clientId, clientName });

    // 2. Récupérer les proches aidants du client
    console.log('🔍 Étape 2: Récupération des proches aidants');
    const caregivers = await dataFetcher.fetchCaregivers(clientId);

    if (!caregivers || caregivers.length === 0) {
      console.log('⚠️ Aucun proche aidant avec email trouvé pour le client');
      return new Response(
        JSON.stringify({ 
          message: 'Aucun proche aidant avec email trouvé pour ce client',
          success: false,
          details: {
            clientId,
            clientName,
            caregiversFound: 0
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log('✅ Proches aidants trouvés:', caregivers.length);

    // 3. Envoyer les emails aux proches aidants (sans URL du rapport)
    console.log('📧 Étape 3: Envoi des emails');
    const { successCount, failureCount } = await emailSender.sendNotifications(
      report,
      caregivers,
      clientName
    );

    console.log('📧 Résultats envoi emails:', { 
      total: caregivers.length, 
      success: successCount, 
      failures: failureCount 
    });

    // 4. Marquer le rapport comme notifié si au moins un email a été envoyé
    if (successCount > 0) {
      await dataFetcher.markReportAsNotified(reportId);
      console.log('✅ Rapport marqué comme notifié');
    }

    console.log('📧 === FIN NOTIFICATION INTERVENTION ===');

    // 5. Retourner le résultat
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
    console.error("❌ === ERREUR CRITIQUE NOTIFICATION ===");
    console.error("❌ Message:", error.message);
    console.error("❌ Stack:", error.stack);
    console.error("❌ === FIN ERREUR ===");
    
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
