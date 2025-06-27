
import { Resend } from "npm:resend@2.0.0";
import { ReportData, CaregiverData } from './types.ts';
import { generateEmailHTML } from './email-template.ts';
import { generatePDFContent } from './html-generator.ts';

export class EmailSender {
  private resend;

  constructor() {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      console.error('❌ RESEND_API_KEY manquante');
      throw new Error('Configuration email manquante');
    }
    console.log('✅ Resend API configurée');
    this.resend = new Resend(apiKey);
  }

  async sendNotifications(
    report: ReportData,
    caregivers: CaregiverData[],
    clientName: string,
    reportUrl: string
  ): Promise<{ successCount: number; failureCount: number }> {
    
    console.log('📧 Début envoi notifications:', {
      reportId: report.id,
      clientName,
      caregiversCount: caregivers.length
    });

    const pdfContent = generatePDFContent(report, clientName);
    const reportDate = new Date(report.date).toLocaleDateString('fr-FR');

    const emailPromises = caregivers.map(async (caregiver, index) => {
      const caregiverName = `${caregiver.first_name} ${caregiver.last_name}`;
      const emailHTML = generateEmailHTML(report, clientName, caregiverName, reportUrl);

      console.log(`📧 Envoi email ${index + 1}/${caregivers.length} vers:`, {
        name: caregiverName,
        email: caregiver.email,
        relationship: caregiver.relationship_type
      });

      try {
        // Utiliser TextEncoder au lieu de Buffer pour Deno
        const encoder = new TextEncoder();
        const pdfBytes = encoder.encode(pdfContent);
        const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));

        const result = await this.resend.emails.send({
          from: "Senior Digital Mentor <no-reply@senior-digital-mentor.com>",
          to: [caregiver.email],
          subject: `Nouveau rapport d'intervention - ${clientName}`,
          html: emailHTML,
          attachments: [
            {
              filename: `rapport-intervention-${clientName.replace(/\s+/g, '-')}-${reportDate.replace(/\//g, '-')}.html`,
              content: pdfBase64,
              content_type: 'text/html'
            }
          ]
        });

        console.log(`✅ Email ${index + 1} envoyé avec succès:`, {
          id: result.data?.id,
          to: caregiver.email
        });

        return result;
      } catch (error) {
        console.error(`❌ Erreur envoi email ${index + 1} pour:`, caregiver.email);
        console.error('❌ Détails erreur:', error);
        throw error;
      }
    });

    const emailResults = await Promise.allSettled(emailPromises);
    
    const successCount = emailResults.filter(result => result.status === 'fulfilled').length;
    const failureCount = emailResults.filter(result => result.status === 'rejected').length;

    // Afficher les erreurs d'envoi
    emailResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`❌ Échec email ${index + 1}:`, result.reason);
      }
    });

    console.log('📧 Résumé envoi:', {
      total: caregivers.length,
      success: successCount,
      failures: failureCount
    });

    return { successCount, failureCount };
  }
}
