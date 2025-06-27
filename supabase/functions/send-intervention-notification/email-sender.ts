
import { Resend } from "npm:resend@2.0.0";
import { ReportData, CaregiverData } from './types.ts';
import { generateEmailHTML } from './email-template.ts';
import { generatePDFContent } from './html-generator.ts';

export class EmailSender {
  private resend;

  constructor() {
    this.resend = new Resend(Deno.env.get("RESEND_API_KEY"));
  }

  async sendNotifications(
    report: ReportData,
    caregivers: CaregiverData[],
    clientName: string,
    reportUrl: string
  ): Promise<{ successCount: number; failureCount: number }> {
    const pdfContent = generatePDFContent(report, clientName);
    const reportDate = new Date(report.date).toLocaleDateString('fr-FR');

    const emailPromises = caregivers.map(async (caregiver) => {
      const caregiverName = `${caregiver.first_name} ${caregiver.last_name}`;
      const emailHTML = generateEmailHTML(report, clientName, caregiverName, reportUrl);

      try {
        return await this.resend.emails.send({
          from: "Senior Digital Mentor <no-reply@senior-digital-mentor.com>",
          to: [caregiver.email],
          subject: `Nouveau rapport d'intervention - ${clientName}`,
          html: emailHTML,
          attachments: [
            {
              filename: `rapport-intervention-${clientName.replace(/\s+/g, '-')}-${reportDate.replace(/\//g, '-')}.html`,
              content: Buffer.from(pdfContent).toString('base64'),
              content_type: 'text/html'
            }
          ]
        });
      } catch (error) {
        console.error('❌ Erreur envoi email pour:', caregiver.email, error);
        throw error;
      }
    });

    const emailResults = await Promise.allSettled(emailPromises);
    
    const successCount = emailResults.filter(result => result.status === 'fulfilled').length;
    const failureCount = emailResults.filter(result => result.status === 'rejected').length;

    // Afficher les erreurs d'envoi
    emailResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`❌ Erreur email ${index + 1}:`, result.reason);
      }
    });

    return { successCount, failureCount };
  }
}
