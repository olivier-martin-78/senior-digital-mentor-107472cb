
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

// Fonction pour générer le contenu HTML du PDF
const generatePDFContent = (report: any, clientName: string) => {
  const reportDate = new Date(report.date).toLocaleDateString('fr-FR');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Rapport d'intervention - ${clientName}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
        .section { margin: 20px 0; }
        .section-title { color: #2563eb; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .info-item { background: #f8f9fa; padding: 15px; border-radius: 5px; }
        .label { font-weight: bold; color: #374151; }
        .observations { background: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; }
        ul { padding-left: 20px; }
        li { margin: 5px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Rapport d'intervention</h1>
        <p><strong>Patient :</strong> ${report.patient_name}</p>
        <p><strong>Date :</strong> ${reportDate}</p>
        <p><strong>Auxiliaire :</strong> ${report.auxiliary_name}</p>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <div class="label">Horaires :</div>
          ${report.start_time && report.end_time ? `${report.start_time} - ${report.end_time}` : 'Non spécifié'}
        </div>
        <div class="info-item">
          <div class="label">Tarif horaire :</div>
          ${report.hourly_rate ? `${report.hourly_rate}€/h` : 'Non spécifié'}
        </div>
      </div>

      ${report.activities && report.activities.length > 0 ? `
      <div class="section">
        <div class="section-title">Activités réalisées</div>
        <ul>
          ${report.activities.map((activity: string) => `<li>${activity}</li>`).join('')}
        </ul>
        ${report.activities_other ? `<p><strong>Autres :</strong> ${report.activities_other}</p>` : ''}
      </div>
      ` : ''}

      ${report.physical_state && report.physical_state.length > 0 ? `
      <div class="section">
        <div class="section-title">État physique</div>
        <ul>
          ${report.physical_state.map((state: string) => `<li>${state}</li>`).join('')}
        </ul>
        ${report.physical_state_other ? `<p><strong>Autres :</strong> ${report.physical_state_other}</p>` : ''}
        ${report.pain_location ? `<p><strong>Douleur :</strong> ${report.pain_location}</p>` : ''}
      </div>
      ` : ''}

      ${report.mental_state && report.mental_state.length > 0 ? `
      <div class="section">
        <div class="section-title">État mental</div>
        <ul>
          ${report.mental_state.map((state: string) => `<li>${state}</li>`).join('')}
        </ul>
        ${report.mental_state_change ? `<p><strong>Changements :</strong> ${report.mental_state_change}</p>` : ''}
      </div>
      ` : ''}

      ${report.hygiene && report.hygiene.length > 0 ? `
      <div class="section">
        <div class="section-title">Hygiène</div>
        <ul>
          ${report.hygiene.map((item: string) => `<li>${item}</li>`).join('')}
        </ul>
        ${report.hygiene_comments ? `<p><strong>Commentaires :</strong> ${report.hygiene_comments}</p>` : ''}
      </div>
      ` : ''}

      <div class="info-grid">
        ${report.appetite ? `
        <div class="info-item">
          <div class="label">Appétit :</div>
          ${report.appetite}
          ${report.appetite_comments ? `<br><em>${report.appetite_comments}</em>` : ''}
        </div>
        ` : ''}
        ${report.hydration ? `
        <div class="info-item">
          <div class="label">Hydratation :</div>
          ${report.hydration}
        </div>
        ` : ''}
      </div>

      ${report.follow_up && report.follow_up.length > 0 ? `
      <div class="section">
        <div class="section-title">Suivi nécessaire</div>
        <ul>
          ${report.follow_up.map((item: string) => `<li>${item}</li>`).join('')}
        </ul>
        ${report.follow_up_other ? `<p><strong>Autres :</strong> ${report.follow_up_other}</p>` : ''}
      </div>
      ` : ''}

      ${report.observations ? `
      <div class="observations">
        <div class="section-title">Observations générales</div>
        <p>${report.observations}</p>
      </div>
      ` : ''}

      ${report.client_rating || report.client_comments ? `
      <div class="section">
        <div class="section-title">Évaluation du client</div>
        ${report.client_rating ? `<p><strong>Note :</strong> ${report.client_rating}/5 ⭐</p>` : ''}
        ${report.client_comments ? `<p><strong>Commentaires :</strong> ${report.client_comments}</p>` : ''}
      </div>
      ` : ''}
    </body>
    </html>
  `;
};

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

    // 3. Générer le contenu PDF
    const clientName = `${report.appointments?.clients?.first_name} ${report.appointments?.clients?.last_name}`;
    const pdfContent = generatePDFContent(report, clientName);
    
    // 4. URL du rapport pour consultation en ligne
    const reportUrl = `https://a2978196-c5c0-456b-9958-c4dc20b52bea.lovableproject.com/intervention-report?report_id=${reportId}`;

    // 5. Envoyer les emails aux proches aidants
    const emailPromises = caregivers.map(async (caregiver) => {
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
            
            <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="margin-top: 0; color: #0277bd;">Consulter le rapport complet</h3>
              <p style="margin-bottom: 15px;">Cliquez sur le lien ci-dessous pour consulter le rapport détaillé en ligne :</p>
              <a href="${reportUrl}" 
                 style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                📋 Voir le rapport complet
              </a>
            </div>
            
            <p>Vous recevez ce message en tant que proche aidant de ${clientName}.</p>
            
            <p>Cordialement,<br>L'équipe Senior Digital Mentor</p>
          </div>
        `,
        attachments: [
          {
            filename: `rapport-intervention-${clientName.replace(/\s+/g, '-')}-${reportDate.replace(/\//g, '-')}.html`,
            content: Buffer.from(pdfContent).toString('base64'),
            content_type: 'text/html'
          }
        ]
      });
    });

    const emailResults = await Promise.allSettled(emailPromises);
    
    // 6. Vérifier les résultats d'envoi
    const successCount = emailResults.filter(result => result.status === 'fulfilled').length;
    const failureCount = emailResults.filter(result => result.status === 'rejected').length;

    console.log('📧 Résultats envoi emails:', { 
      total: emailResults.length, 
      success: successCount, 
      failures: failureCount 
    });

    // 7. Marquer le rapport comme notifié si au moins un email a été envoyé
    if (successCount > 0) {
      await supabase
        .from('intervention_reports')
        .update({ email_notification_sent: true })
        .eq('id', reportId);
      
      console.log('✅ Rapport marqué comme notifié');
    }

    // 8. Retourner le résultat
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
