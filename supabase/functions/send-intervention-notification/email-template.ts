
import { ReportData } from './types.ts';

export const generateEmailHTML = (
  report: ReportData,
  clientName: string,
  caregiverName: string,
  reportUrl: string
): string => {
  const reportDate = new Date(report.date).toLocaleDateString('fr-FR');
  
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Nouveau rapport d'intervention</h2>
      
      <p>Bonjour ${caregiverName},</p>
      
      <p>Un nouveau rapport d'intervention a été créé pour <strong>${clientName}</strong>.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #374151;">Détails du rapport</h3>
        <p><strong>Date :</strong> ${reportDate}</p>
        <p><strong>Patient :</strong> ${report.patient_name || 'Non spécifié'}</p>
        <p><strong>Auxiliaire :</strong> ${report.auxiliary_name || 'Non spécifié'}</p>
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
  `;
};
