import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-connection-type",
};

interface InterventionNotificationRequest {
  reportId: string;
  title: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { reportId, title }: InterventionNotificationRequest = await req.json();

    console.log('📧 Envoi notification rapport intervention:', { reportId, title });

    // 1. Récupérer le rapport d'intervention avec les informations du rendez-vous et du client
    const { data: report, error: reportError } = await supabase
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

    if (reportError || !report) {
      console.error('❌ Erreur récupération rapport:', reportError);
      throw new Error('Rapport d\'intervention introuvable');
    }

    console.log('✅ Rapport récupéré:', {
      reportId: report.id,
      clientId: report.appointments?.clients?.id,
      clientName: `${report.appointments?.clients?.first_name} ${report.appointments?.clients?.last_name}`
    });

    // 2. Récupérer les proches aidants du client
    const { data: caregivers, error: caregiversError } = await supabase
      .from('caregivers')
      .select('first_name, last_name, email, relationship_type')
      .eq('client_id', report.appointments?.clients?.id)
      .not('email', 'is', null);

    if (caregiversError) {
      console.error('❌ Erreur récupération proches aidants:', caregiversError);
      throw new Error('Erreur lors de la récupération des proches aidants');
    }

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

    // 3. Envoyer les emails aux proches aidants
    const emailPromises = caregivers.map(async (caregiver) => {
      const clientName = `${report.appointments?.clients?.first_name} ${report.appointments?.clients?.last_name}`;
      const reportDate = new Date(report.date).toLocaleDateString('fr-FR');
      
      return resend.emails.send({
        from: "Senior Digital Mentor <no-reply@senior-digital-mentor.com>",
        to: [caregiver.email],
        subject: `Nouveau rapport d'intervention - ${clientName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Nouveau rapport d'intervention</h2>
            
            <p>Bonjour ${caregiver.first_name} ${caregiver.last_name},</p>
            
            <p>Un nouveau rapport d'intervention a été créé pour <strong>${clientName}</strong>.</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">Détails du rapport</h3>
              <p><strong>Date :</strong> ${reportDate}</p>
              <p><strong>Patient :</strong> ${report.patient_name}</p>
              <p><strong>Auxiliaire :</strong> ${report.auxiliary_name}</p>
              ${report.start_time && report.end_time ? `<p><strong>Horaires :</strong> ${report.start_time} - ${report.end_time}</p>` : ''}
            </div>
            
            ${report.observations ? `
              <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #92400e;">Observations</h4>
                <p style="margin-bottom: 0;">${report.observations}</p>
              </div>
            ` : ''}
            
            <p>Vous recevez ce message en tant que proche aidant de ${clientName}.</p>
            
            <p>Cordialement,<br>L'équipe Senior Digital Mentor</p>
          </div>
        `,
      });
    });

    const emailResults = await Promise.allSettled(emailPromises);
    
    // 4. Vérifier les résultats d'envoi
    const successCount = emailResults.filter(result => result.status === 'fulfilled').length;
    const failureCount = emailResults.filter(result => result.status === 'rejected').length;

    console.log('📧 Résultats envoi emails:', { 
      total: emailResults.length, 
      success: successCount, 
      failures: failureCount 
    });

    // 5. Marquer le rapport comme notifié si au moins un email a été envoyé
    if (successCount > 0) {
      await supabase
        .from('intervention_reports')
        .update({ email_notification_sent: true })
        .eq('id', reportId);
      
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
